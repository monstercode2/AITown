import { Agent } from '../../types/agent';
import { Position, TileType, Grid } from '../../types/grid';
import { Direction, tryMoveAgent } from './movement';
import { Memory, ImportanceLevel, MemoryType } from '../../types/memory';
import { getRelationshipStatus } from './interaction';
import { AgentReaction } from '../../types/agent';

/**
 * Agent 行为类型
 */
export enum ActionType {
  MOVE = 'MOVE',
  INTERACT = 'INTERACT',
  SPEAK = 'SPEAK',
  IDLE = 'IDLE',
  PURSUE_GOAL = 'PURSUE_GOAL'
}

/**
 * Agent 行为接口
 */
export interface AgentAction {
  type: ActionType;
  data: {
    direction?: Direction;
    targetId?: string;
    message?: string;
    destination?: Position;
    goal?: string;
    priority?: number;
  };
}

/**
 * 环境感知信息接口
 */
export interface EnvironmentInfo {
  nearbyAgents: Agent[];
  currentLocation: {
    position: Position;
    tileType: TileType;
  };
  recentEvents: string[];
  timeOfDay: string;
  memories: Memory[];
  relationships: Map<string, { affinity: number; interactions: number }>;
}

/**
 * 生成环境描述文本
 */
export function generateEnvironmentPrompt(env: EnvironmentInfo): string {
  let prompt = `当前环境信息：\n`;
  
  // 位置信息
  prompt += `位置：你现在在${env.currentLocation.tileType}。\n`;
  
  // 附近的Agent
  if (env.nearbyAgents.length > 0) {
    prompt += '\n附近的人：\n';
    env.nearbyAgents.forEach(agent => {
      const relationship = env.relationships.get(agent.id);
      const relationshipStr = relationship 
        ? `（关系好感度：${relationship.affinity}，互动次数：${relationship.interactions}）`
        : '（初次见面）';
      prompt += `- ${agent.name} ${relationshipStr} 正在${agent.currentAction || '这里'}\n`;
    });
  }
  
  // 相关记忆
  if (env.memories.length > 0) {
    prompt += '\n相关记忆：\n';
    const sortedMemories = [...env.memories]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3);
    
    sortedMemories.forEach(memory => {
      prompt += `- [${memory.importance}级重要] ${memory.content}\n`;
    });
  }
  
  // 最近事件
  if (env.recentEvents.length > 0) {
    prompt += '\n最近发生的事：\n';
    env.recentEvents.forEach(event => {
      prompt += `- ${event}\n`;
    });
  }
  
  prompt += `\n现在是${env.timeOfDay}。`;
  
  return prompt;
}

/**
 * 解析 LLM 响应
 */
export function parseLLMResponse(response: string): AgentAction {
  const defaultAction: AgentAction = {
    type: ActionType.IDLE,
    data: {}
  };

  try {
    const actionMatch = response.match(/ACTION: (MOVE|INTERACT|SPEAK|IDLE|PURSUE_GOAL)/i);
    if (!actionMatch) return defaultAction;

    const action: AgentAction = {
      type: actionMatch[1] as ActionType,
      data: {}
    };

    switch (action.type) {
      case ActionType.MOVE:
        const directionMatch = response.match(/DIRECTION: (UP|DOWN|LEFT|RIGHT)/i);
        if (directionMatch) {
          action.data.direction = directionMatch[1] as Direction;
        }
        break;
      
      case ActionType.SPEAK:
        const messageMatch = response.match(/MESSAGE: "(.+)"/);
        if (messageMatch) {
          action.data.message = messageMatch[1];
        }
        break;
      
      case ActionType.INTERACT:
        const targetMatch = response.match(/TARGET: (.+)/);
        if (targetMatch) {
          action.data.targetId = targetMatch[1];
        }
        const interactionMessage = response.match(/INTERACTION: "(.+)"/);
        if (interactionMessage) {
          action.data.message = interactionMessage[1];
        }
        break;

      case ActionType.PURSUE_GOAL:
        const goalMatch = response.match(/GOAL: "(.+)"/);
        if (goalMatch) {
          action.data.goal = goalMatch[1];
        }
        const priorityMatch = response.match(/PRIORITY: (\d+)/);
        if (priorityMatch) {
          action.data.priority = parseInt(priorityMatch[1]);
        }
        break;
    }

    return action;
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    return defaultAction;
  }
}

/**
 * 执行 Agent 行为
 */
export function executeAction(
  action: AgentAction,
  agent: Agent,
  grid: Grid,
  agents: Agent[]
): void {
  switch (action.type) {
    case ActionType.MOVE:
      if (action.data.direction) {
        const newPosition = tryMoveAgent(
          agent,
          action.data.direction,
          grid.width,
          grid.height,
          agents
        );
        if (newPosition) {
          agent.position = newPosition;
          // 创建移动记忆
          const memory: Memory = {
            id: Date.now().toString(),
            content: `移动到了新的位置 (${newPosition.x}, ${newPosition.y})`,
            timestamp: Date.now(),
            importance: ImportanceLevel.LOW,
            type: MemoryType.OBSERVATION,
            tags: ['移动']
          };
          agent.memories.push(memory);
        }
      }
      break;
      
    case ActionType.SPEAK:
      if (action.data.message) {
        agent.currentAction = action.data.message;
        // 创建对话记忆
        const memory: Memory = {
          id: Date.now().toString(),
          content: `对${action.data.targetId ? agents.find(a => a.id === action.data.targetId)?.name : '周围的人'}说：${action.data.message}`,
          timestamp: Date.now(),
          importance: ImportanceLevel.LOW,
          type: MemoryType.INTERACTION,
          tags: ['对话']
        };
        agent.memories.push(memory);
      }
      break;
      
    case ActionType.INTERACT:
      if (action.data.targetId) {
        const targetAgent = agents.find(a => a.id === action.data.targetId);
        if (targetAgent) {
          agent.currentAction = action.data.message || '正在互动';
          // 创建交互记忆
          const memory: Memory = {
            id: Date.now().toString(),
            content: `与${targetAgent.name}进行了互动：${action.data.message || ''}`,
            timestamp: Date.now(),
            importance: ImportanceLevel.MEDIUM,
            type: MemoryType.INTERACTION,
            tags: ['互动', targetAgent.name]
          };
          agent.memories.push(memory);
        }
      }
      break;

    case ActionType.PURSUE_GOAL:
      if (action.data.goal) {
        agent.currentAction = `追求目标：${action.data.goal}`;
        // 创建目标记忆
        const memory: Memory = {
          id: Date.now().toString(),
          content: `设定了新目标：${action.data.goal}`,
          timestamp: Date.now(),
          importance: ImportanceLevel.HIGH,
          type: MemoryType.EVENT,
          tags: ['目标']
        };
        agent.memories.push(memory);
      }
      break;
  }
}

/**
 * 生成 Agent 针对事件的反应（可调用 LLM 或规则）
 */
export async function generateAgentReaction(agent: Agent, event: any, llmClient: any): Promise<AgentReaction> {
  // 构造 prompt，带入记忆、关系、状态
  const memories = agent.memories.slice(-3).map(m => `- ${m.content}`).join('\n');
  const relationships = Array.from(agent.relationships.entries()).map(([id, rel]) => `${id}: 好感度${rel.affinity}`).join('，');
  const prompt = `你是AI小镇的居民（${agent.name}）。\n你的记忆片段如下：\n${memories || '（无）'}\n你与其他人的关系：${relationships || '（无）'}\n你当前状态：${agent.state}，${agent.currentAction || ''}\n请针对以下事件做出你的反应（只描述你自己的行动和情绪，不要生成事件本身）。\n\n事件内容：\n${typeof event === 'string' ? event : JSON.stringify(event)}\n\n如果你的反应会引发新的事件或影响其他agent，请在JSON中用 triggeredEvent 字段详细描述（如通知、协作、警觉、请求帮助等）。\n请输出你的反应，格式为JSON。`;
  // 调用 LLM
  const response = await llmClient.generateAgentDecision(prompt);
  // 解析 LLM 响应为 AgentReaction
  try {
    const reaction = JSON.parse(response);
    return {
      agentId: agent.id,
      action: reaction.action || '',
      detail: reaction.detail || '',
      stateChange: reaction.stateChange,
      emotionChange: reaction.emotionChange,
      triggeredEvent: reaction.triggeredEvent // 新增，支持连锁
    };
  } catch (e) {
    // fallback: 只返回字符串
    return {
      agentId: agent.id,
      action: '未知',
      detail: response
    };
  }
} 