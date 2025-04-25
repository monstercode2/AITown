import { Agent } from '../types/agent';
import { Grid, TileType, Position } from '../types/grid';
import { DashscopeClient } from '../lib/llm/client/dashscope';
import { LLM_CONFIG } from '../lib/llm/config';
import { generateEnvironmentPrompt, executeAction, parseLLMResponse } from './agent/decision';
import { Memory } from '../types/memory';
import { useTimeStore } from '../store/timeStore';
import { Event, EventType, EventScope } from '../types/event';
import { Logger, LogCategory, LogLevel } from '../utils/logger';
import { getNextMove, getRandomWalkablePositionInRadius } from '../utils/pathfinding';
import { getTimeOfDay, getGameTime, formatTime, hasTimeElapsed } from '../utils/time';
import { EventProcessor } from './event/processor';
import { AgentReaction, EventFeedbackContext } from '../types/agent';
import { generateAgentReaction } from './agent/decision';

/**
 * 主循环系统
 * 负责协调Agent行为、环境更新和事件生成
 */
export class MainLoop {
  private agents: Agent[];
  private grid: Grid;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private tickInterval: number = 1000; // 1秒一个tick
  private timeStore = useTimeStore.getState();
  private events: Event[] = [];
  private eventProcessor: EventProcessor;
  private startTime: number = 0;
  private timeScale: number = 1;
  private eventFrequency: number = 0.1;
  private autoAgentDecisions: boolean = true;
  private lastAgentProcessTime: Map<string, number> = new Map(); // 记录每个Agent上次处理的时间
  private processingInterval: number = 10; // Agent决策间隔(秒)
  private llmClients: Record<string, DashscopeClient>;
  private eventMemories: any[] = []; // 事件生成器记忆系统

  constructor(agents: Agent[], grid: Grid) {
    this.agents = agents;
    this.grid = grid;
    this.eventProcessor = new EventProcessor();
    this.initializeAgentProcessTimes();
    
    // 在构造函数里初始化 llmClients，确保此时 process.env 已经有值
    this.llmClients = {
      'deepseek-v3': new DashscopeClient({ apiKey: process.env.DASHSCOPE_API_KEY || '', model: 'deepseek-v3' }),
      'qwen-max': new DashscopeClient({ apiKey: process.env.DASHSCOPE_API_KEY || '', model: 'qwen-max' }),
      'qwq-plus': new DashscopeClient({ apiKey: process.env.DASHSCOPE_API_KEY || '', model: 'qwq-plus' }),
      'llama-4-scout-17b-16e-instruct': new DashscopeClient({ apiKey: process.env.DASHSCOPE_API_KEY || '', model: 'llama-4-scout-17b-16e-instruct' })
    };

    Logger.info(LogCategory.SYSTEM, '主循环初始化完成', {
      agentCount: agents.length,
      gridSize: `${grid.width}x${grid.height}`
    });
  }

  /**
   * 初始化Agent处理时间
   */
  private initializeAgentProcessTimes(): void {
    const currentTime = this.timeStore.currentTime;
    this.agents.forEach(agent => {
      // 错开每个Agent的处理时间，避免同时处理
      const offset = Math.floor(Math.random() * this.processingInterval);
      this.lastAgentProcessTime.set(agent.id, currentTime - this.processingInterval + offset);
    });
  }

  /**
   * 启动主循环
   */
  public start(): void {
    if (this.isRunning && !this.isPaused) return;
    
    if (!this.isRunning) {
      Logger.info(LogCategory.SYSTEM, '启动AI小镇模拟', {
        timeScale: this.timeScale,
        eventFrequency: this.eventFrequency
      });
      this.isRunning = true;
      this.startTime = Date.now();
    } else if (this.isPaused) {
      Logger.info(LogCategory.SYSTEM, '恢复AI小镇模拟');
      this.isPaused = false;
    }
    
    this.tick();
  }

  /**
   * 暂停主循环
   */
  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    Logger.info(LogCategory.SYSTEM, '暂停AI小镇模拟');
    this.isPaused = true;
  }

  /**
   * 停止主循环
   */
  public stop(): void {
    if (!this.isRunning) return;
    Logger.info(LogCategory.SYSTEM, '停止AI小镇模拟');
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * 设置时间流速
   */
  public setTimeScale(scale: number): void {
    if (scale <= 0) throw new Error('时间流速必须大于0');
    this.timeScale = scale;
    Logger.info(LogCategory.SYSTEM, `设置时间流速为 ${scale}x`);
  }

  /**
   * 设置事件生成频率
   */
  public setEventFrequency(frequency: number): void {
    if (frequency < 0 || frequency > 1) 
      throw new Error('事件频率必须在0-1之间');
    this.eventFrequency = frequency;
    Logger.info(LogCategory.SYSTEM, `设置事件生成频率为 ${frequency}`);
  }

  /**
   * 设置是否自动Agent决策
   */
  public setAutoAgentDecisions(auto: boolean): void {
    this.autoAgentDecisions = auto;
    Logger.info(LogCategory.SYSTEM, `${auto ? '启用' : '禁用'}自动Agent决策`);
  }

  /**
   * 获取模拟运行时间（毫秒）
   */
  public getUptime(): number {
    if (!this.isRunning && this.startTime === 0) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * 主循环tick
   */
  private async tick(): Promise<void> {
    if (!this.isRunning || this.isPaused) return;

    try {
      // 更新时间（基于timeScale）
      this.timeStore.incrementTime(1 * this.timeScale);  // 每tick增加1秒 * 时间流速
      const currentTime = this.timeStore.currentTime;
      const gameTime = getGameTime(currentTime);
      
      // 处理日期变更事件
      this.handleDayChange(gameTime.day);

      // 为每个agent生成决策（如果启用了自动决策）
      if (this.autoAgentDecisions) {
        // 不是每个tick都处理所有Agent，根据时间间隔处理
        for (const agent of this.agents) {
          const lastProcessTime = this.lastAgentProcessTime.get(agent.id) || 0;
          
          if (hasTimeElapsed(lastProcessTime, currentTime, this.processingInterval)) {
            await this.processAgent(agent);
            this.lastAgentProcessTime.set(agent.id, currentTime);
          }
        }
      }

      // 生成随机事件（基于事件频率）
      if (Math.random() < this.eventFrequency) {
        await this.generateEvent();
      }

      // 调度下一个tick（基于tickInterval和timeScale）
      const adjustedInterval = Math.max(50, this.tickInterval / this.timeScale);
      setTimeout(() => this.tick(), adjustedInterval);
    } catch (error) {
      Logger.error(LogCategory.SYSTEM, '主循环错误', error);
      this.stop();
    }
  }

  /**
   * 处理日期变更
   * @param newDay 新的天数
   */
  private handleDayChange(newDay: number): void {
    const prevDay = this.timeStore.dayCount;
    
    if (newDay > prevDay) {
      Logger.info(LogCategory.SYSTEM, `进入第${newDay}天`);
      
      // 新的一天开始，重置一些状态或生成特殊事件
      this.generateDailyEvent(newDay);
      
      // 更新时间存储中的天数 - 直接设置currentTime会自动更新dayCount
      const currentSeconds = this.timeStore.currentTime;
      const currentTimeOfDay = currentSeconds % 86400; // 保留一天中的时间部分
      const newTotalSeconds = (newDay - 1) * 86400 + currentTimeOfDay;
      this.timeStore.setTime(newTotalSeconds);
    }
  }

  /**
   * 生成每日事件
   * @param day 天数
   */
  private async generateDailyEvent(day: number): Promise<void> {
    try {
      const eventDescription = `新的一天开始了，这是第${day}天。`;
      
      // 创建新事件
      const newEvent: Event = {
        id: `day-${day}-start`,
        type: EventType.TOWN,
        scope: EventScope.GLOBAL,
        description: eventDescription,
        affectedAgents: this.agents.map(a => a.id),
        startTime: Date.now(),
        duration: 300000, // 5分钟
        impact: {
          mood: 5 // 微小的正面心情提升
        }
      };

      this.events.push(newEvent);
      this.eventProcessor.processEvent(newEvent, this.agents);
      Logger.info(LogCategory.EVENT, `生成每日事件: ${eventDescription}`);
    } catch (error) {
      Logger.error(LogCategory.EVENT, '生成每日事件错误', error);
    }
  }

  /**
   * 处理单个Agent的决策和行动
   */
  private async processAgent(agent: Agent): Promise<void> {
    try {
      Logger.debug(LogCategory.AGENT, `处理Agent ${agent.name} (${agent.id})`, {
        position: agent.position,
        state: agent.state
      });
      
      // 获取环境信息
      const envInfo = {
        nearbyAgents: this.getNearbyAgents(agent),
        currentLocation: {
          position: agent.position,
          tileType: this.getTileType(agent.position.y, agent.position.x)
        },
        recentEvents: this.getRecentEvents(),
        timeOfDay: this.getTimeOfDayFromSeconds(),
        memories: agent.memories,
        relationships: agent.relationships
      };

      // 生成环境描述
      const prompt = generateEnvironmentPrompt(envInfo);

      // 根据agent.llmModel选择DashscopeClient
      const llmClient = this.llmClients[agent.llmModel] || this.llmClients['qwen-max'];
      const startTime = Date.now();
      const response = await llmClient.generateAgentDecision(prompt);
      const llmTime = Date.now() - startTime;
      Logger.debug(LogCategory.LLM, `LLM响应时间: ${llmTime}ms`, { agentId: agent.id });

      // 解析决策
      const action = parseLLMResponse(response);
      Logger.info(LogCategory.AGENT, `Agent ${agent.name} 决策: ${action.type}`, action);

      // 执行决策
      const result = await this.executeAction(action, agent);
      
      // 记录决策结果
      Logger.debug(LogCategory.AGENT, `Agent ${agent.name} 执行结果`, result);
    } catch (error) {
      Logger.error(LogCategory.AGENT, `Agent ${agent.id} 处理错误`, error);
    }
  }

  /**
   * 执行Agent动作
   * @param action 动作
   * @param agent Agent
   * @returns 执行结果
   */
  private async executeAction(action: any, agent: Agent): Promise<any> {
    // 这里我们会扩展原来的executeAction，加入寻路算法
    switch (action.type) {
      case 'MOVE': {
        // 使用寻路算法找到下一步位置
        if (action.target && typeof action.target.x === 'number' && typeof action.target.y === 'number') {
          const nextPosition = getNextMove(this.grid, agent.position, action.target);
          
          // 如果能移动（寻路算法找到了路径）
          if (nextPosition.x !== agent.position.x || nextPosition.y !== agent.position.y) {
            // 更新Agent位置前清除之前位置的占用
            const oldTile = this.grid.tiles[agent.position.y][agent.position.x];
            if (oldTile.occupiedBy === agent.id) {
              oldTile.occupiedBy = undefined;
            }
            
            // 更新Agent位置
            agent.position = nextPosition;
            
            // 标记新位置为已占用
            const newTile = this.grid.tiles[nextPosition.y][nextPosition.x];
            newTile.occupiedBy = agent.id;
            
            return { success: true, message: '移动成功', position: nextPosition };
          }
          return { success: false, message: '无法到达目标位置' };
        }
        return { success: false, message: '无效的目标位置' };
      }
      
      case 'WANDER': {
        // 随机在附近找一个可行走的位置
        const radius = action.radius || 3; // 默认半径为3
        const randomPosition = getRandomWalkablePositionInRadius(this.grid, agent.position, radius);
        
        if (randomPosition) {
          // 更新Agent位置前清除之前位置的占用
          const oldTile = this.grid.tiles[agent.position.y][agent.position.x];
          if (oldTile.occupiedBy === agent.id) {
            oldTile.occupiedBy = undefined;
          }
          
          // 更新Agent位置
          agent.position = randomPosition;
          
          // 标记新位置为已占用
          const newTile = this.grid.tiles[randomPosition.y][randomPosition.x];
          newTile.occupiedBy = agent.id;
          
          return { success: true, message: '闲逛成功', position: randomPosition };
        }
        return { success: false, message: '附近没有可行走的位置' };
      }
      
      // 其他动作类型...根据需要扩展
      default:
        // 调用原来的executeAction处理其他类型的动作
        return executeAction(action, agent, this.grid, this.agents);
    }
  }

  /**
   * 获取格子类型
   */
  private getTileType(y: number, x: number): TileType {
    if (y < 0 || y >= this.grid.height || x < 0 || x >= this.grid.width) {
      return TileType.GROUND; // 默认返回地面类型
    }
    return this.grid.tiles[y][x].type;
  }

  /**
   * 生成随机事件
   */
  private async generateEvent(): Promise<void> {
    try {
      const gameTime = getGameTime(this.timeStore.currentTime);
      
      const context = {
        time: gameTime.timeOfDay,
        day: gameTime.day,
        hour: gameTime.hour,
        agents: this.agents.map(a => ({
          id: a.id,
          name: a.name,
          position: a.position,
          currentAction: a.currentAction,
          state: a.state
        }))
      };

      Logger.debug(LogCategory.EVENT, '正在生成事件', context);
      const startTime = Date.now();
      // 事件统一用qwq-plus模型
      const eventClient = this.llmClients['qwq-plus'];
      const eventDescription = await eventClient.generateEvent(JSON.stringify(context));
      const llmTime = Date.now() - startTime;
      Logger.debug(LogCategory.LLM, `事件生成LLM响应时间: ${llmTime}ms`);
      
      // 随机选择受影响的Agent（至少一个）
      const affectedAgents = this.getRandomAffectedAgents();
      
      // 创建新事件
      const newEvent: Event = {
        id: Date.now().toString(),
        type: EventType.ENVIRONMENTAL,
        scope: EventScope.LOCAL,
        description: eventDescription,
        affectedAgents,
        startTime: Date.now(),
        duration: 300000, // 5分钟
        impact: {}
      };

      this.events.push(newEvent);
      this.eventProcessor.processEvent(newEvent, this.agents);
      Logger.info(LogCategory.EVENT, `生成事件: ${eventDescription}`, {
        affectedAgents,
        type: EventType.ENVIRONMENTAL
      });
    } catch (error) {
      Logger.error(LogCategory.EVENT, '事件生成错误', error);
    }
  }

  /**
   * 随机选择受影响的Agent
   * @returns 受影响的Agent ID数组
   */
  private getRandomAffectedAgents(): string[] {
    if (this.agents.length === 0) return [];
    
    // 确保至少有一个Agent受影响
    const minAffected = 1;
    // 最多影响所有Agent
    const maxAffected = this.agents.length;
    
    // 随机决定影响的Agent数量
    const numAffected = Math.floor(Math.random() * (maxAffected - minAffected + 1)) + minAffected;
    
    // 复制并打乱Agent数组
    const shuffledAgents = [...this.agents]
      .sort(() => Math.random() - 0.5)
      .slice(0, numAffected);
    
    return shuffledAgents.map(a => a.id);
  }

  /**
   * 获取附近的Agent
   */
  private getNearbyAgents(agent: Agent): Agent[] {
    return this.agents.filter(other => 
      other.id !== agent.id && 
      Math.abs(other.position.x - agent.position.x) <= 3 &&
      Math.abs(other.position.y - agent.position.y) <= 3
    );
  }

  /**
   * 获取最近的事件
   */
  private getRecentEvents(): string[] {
    return this.events.slice(-5).map((event: Event) => event.description);
  }

  /**
   * 获取当前时间（从秒数）
   */
  private getTimeOfDayFromSeconds(): string {
    const totalSeconds = this.timeStore.currentTime;
    return getTimeOfDay(totalSeconds);
  }

  /**
   * 添加新Agent
   */
  public addAgent(agent: Agent): void {
    this.agents.push(agent);
    this.lastAgentProcessTime.set(agent.id, this.timeStore.currentTime);
    Logger.info(LogCategory.AGENT, `添加新Agent: ${agent.name} (${agent.id})`, {
      position: agent.position
    });
  }

  /**
   * 移除Agent
   */
  public removeAgent(agentId: string): void {
    const agentToRemove = this.agents.find(a => a.id === agentId);
    if (agentToRemove) {
      Logger.info(LogCategory.AGENT, `移除Agent: ${agentToRemove.name} (${agentId})`);
      
      // 清除格子占用
      const position = agentToRemove.position;
      const tile = this.grid.tiles[position.y][position.x];
      if (tile.occupiedBy === agentId) {
        tile.occupiedBy = undefined;
      }
    }
    
    this.agents = this.agents.filter(a => a.id !== agentId);
    this.lastAgentProcessTime.delete(agentId);
  }

  /**
   * 获取所有Agent
   */
  public getAgents(): Agent[] {
    return [...this.agents];
  }

  /**
   * 获取运行状态
   */
  public isSimulationRunning(): boolean {
    return this.isRunning;
  }

  public getEvents(): Event[] {
    const events = this.events;
    console.log('[MainLoop.getEvents] 返回事件数量:', events.length);
    return events;
  }

  /**
   * 多轮事件-反应-再事件主流程
   */
  private async handleEventChain(context: any, maxRounds = 2) {
    let currentContext = context;
    let round = 0;
    let lastEvent: any = null;
    while (round < maxRounds) {
      // 1. 生成事件时带入部分记忆
      const memoryContext = this.eventMemories.slice(-5); // 只带入最近5条
      const eventClient = this.llmClients['qwq-plus'];
      const eventRaw = await eventClient.generateEvent(JSON.stringify({ ...currentContext, memoryContext }));
      let eventObj: any;
      try {
        eventObj = typeof eventRaw === 'string' ? JSON.parse(eventRaw) : eventRaw;
      } catch {
        eventObj = { description: eventRaw };
      }
      // 2. 记录事件
      this.events.push({
        id: Date.now().toString() + '-' + round,
        type: EventType.ENVIRONMENTAL,
        scope: EventScope.LOCAL,
        description: eventObj.description || '',
        affectedAgents: (eventObj.affectedAgents || []),
        startTime: Date.now(),
        duration: 300000,
        impact: {},
        meta: eventObj
      });
      // 3. agent 反应
      const agentReactions: AgentReaction[] = [];
      for (const agentId of (eventObj.affectedAgents || [])) {
        const agent = this.agents.find(a => a.id === agentId);
        if (!agent) continue;
        const llmClient = this.llmClients[agent.llmModel] || this.llmClients['qwen-max'];
        const reaction = await generateAgentReaction(agent, eventObj, llmClient);
        agentReactions.push(reaction);
        // 检查是否有连锁事件
        if (reaction.triggeredEvent) {
          // 递归推进连锁事件，防止死循环只递归一轮
          await this.handleEventChain({
            trigger: 'agent_reaction',
            sourceAgent: agent.id,
            reaction,
            worldState: undefined
          }, 1);
        }
      }
      // 4. 汇总反馈上下文
      const feedbackContext: EventFeedbackContext = {
        event: eventObj,
        agentReactions
      };
      // 5. 递归推进
      currentContext = feedbackContext;
      lastEvent = eventObj;
      // 6. 存入事件生成器记忆
      this.eventMemories.push({ event: eventObj, agentReactions });
      round++;
    }
    return lastEvent;
  }
} 