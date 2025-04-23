import { Event, EventType, EventScope } from '@/types/event';
import { Agent } from '@/types/agent';
import { Position } from '@/types/grid';
import { nanoid } from 'nanoid';

/**
 * 事件生成器配置接口
 */
interface EventGeneratorConfig {
  minInterval: number;  // 最小事件间隔（毫秒）
  maxEvents: number;    // 最大同时存在的事件数
  baseChances: {        // 各类型事件的基础生成概率
    [key in EventType]: number;
  };
}

/**
 * 事件生成器类
 */
export class EventGenerator {
  private config: EventGeneratorConfig;
  private lastEventTime: number;

  constructor(config: Partial<EventGeneratorConfig> = {}) {
    this.config = {
      minInterval: config.minInterval || 5000,
      maxEvents: config.maxEvents || 10,
      baseChances: config.baseChances || {
        [EventType.SOCIAL]: 0.4,
        [EventType.ENVIRONMENTAL]: 0.2,
        [EventType.PERSONAL]: 0.3,
        [EventType.TOWN]: 0.1,
      },
    };
    this.lastEventTime = Date.now();
  }

  /**
   * 生成社交事件
   */
  private generateSocialEvent(agents: Agent[]): Event | null {
    if (agents.length < 2) return null;

    // 随机选择两个Agent
    const agent1 = agents[Math.floor(Math.random() * agents.length)];
    let agent2 = agent1;
    while (agent2 === agent1) {
      agent2 = agents[Math.floor(Math.random() * agents.length)];
    }

    // 生成社交事件描述
    const descriptions = [
      `${agent1.name}和${agent2.name}开始了一场愉快的对话。`,
      `${agent1.name}正在向${agent2.name}分享一个有趣的故事。`,
      `${agent1.name}邀请${agent2.name}一起散步。`,
    ];

    return {
      id: nanoid(),
      type: EventType.SOCIAL,
      scope: EventScope.LOCAL,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      affectedAgents: [agent1.id, agent2.id],
      startTime: Date.now(),
      duration: 5 * 60 * 1000, // 5分钟
      position: agent1.position,
      impact: {
        mood: Math.random() * 20,
        sociability: Math.random() * 15,
      },
    };
  }

  /**
   * 生成环境事件
   */
  private generateEnvironmentalEvent(position: Position): Event {
    const descriptions = [
      '天气突然变得晴朗起来。',
      '一阵清爽的微风吹过小镇。',
      '远处传来鸟儿的歌唱声。',
    ];

    return {
      id: nanoid(),
      type: EventType.ENVIRONMENTAL,
      scope: EventScope.GLOBAL,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      affectedAgents: [], // 环境事件可能影响所有Agent
      startTime: Date.now(),
      duration: 15 * 60 * 1000, // 15分钟
      position,
      impact: {
        mood: Math.random() * 10,
      },
    };
  }

  /**
   * 生成个人事件
   */
  private generatePersonalEvent(agent: Agent): Event {
    const descriptions = [
      `${agent.name}正在思考今天的计划。`,
      `${agent.name}感到有些疲倦，需要休息一下。`,
      `${agent.name}想起了一件开心的事。`,
    ];

    return {
      id: nanoid(),
      type: EventType.PERSONAL,
      scope: EventScope.INDIVIDUAL,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      affectedAgents: [agent.id],
      startTime: Date.now(),
      duration: 3 * 60 * 1000, // 3分钟
      position: agent.position,
      impact: {
        mood: Math.random() * 15 - 5,
        energy: Math.random() * -10,
      },
    };
  }

  /**
   * 生成小镇事件
   */
  private generateTownEvent(position: Position): Event {
    const descriptions = [
      '小镇广场正在举办一场小型集市。',
      '镇上的居民们在讨论最近的新闻。',
      '小镇图书馆举办了读书分享会。',
    ];

    return {
      id: nanoid(),
      type: EventType.TOWN,
      scope: EventScope.GLOBAL,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      affectedAgents: [], // 小镇事件可能影响所有Agent
      startTime: Date.now(),
      duration: 30 * 60 * 1000, // 30分钟
      position,
      impact: {
        mood: Math.random() * 25,
        sociability: Math.random() * 20,
      },
    };
  }

  /**
   * 尝试生成新事件
   */
  public tryGenerateEvent(
    agents: Agent[],
    currentEvents: Event[],
    currentTime: number
  ): Event | null {
    // 检查事件间隔和数量限制
    if (
      currentTime - this.lastEventTime < this.config.minInterval ||
      currentEvents.length >= this.config.maxEvents
    ) {
      return null;
    }

    // 随机选择事件类型
    const rand = Math.random();
    let cumulative = 0;
    let selectedType: EventType | null = null;

    for (const [type, chance] of Object.entries(this.config.baseChances)) {
      cumulative += chance;
      if (rand <= cumulative) {
        selectedType = type as EventType;
        break;
      }
    }

    if (!selectedType || agents.length === 0) return null;

    // 根据选择的类型生成事件
    let event: Event | null = null;
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];

    switch (selectedType) {
      case EventType.SOCIAL:
        event = this.generateSocialEvent(agents);
        break;
      case EventType.ENVIRONMENTAL:
        event = this.generateEnvironmentalEvent(randomAgent.position);
        break;
      case EventType.PERSONAL:
        event = this.generatePersonalEvent(randomAgent);
        break;
      case EventType.TOWN:
        event = this.generateTownEvent(randomAgent.position);
        break;
    }

    if (event) {
      this.lastEventTime = currentTime;
    }

    return event;
  }
} 