import { Event, EventScope } from '@/types/event';
import { Agent } from '@/types/agent';
import { Position } from '@/types/grid';
import { MemoryType } from '@/types/memory';

/**
 * 计算两点之间的距离
 */
const calculateDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 事件影响范围配置
 */
interface EventRangeConfig {
  LOCAL_RANGE: number;      // 局部事件的影响范围
  NOTIFICATION_RANGE: number; // 通知范围
}

/**
 * 事件处理器类
 */
export class EventProcessor {
  private rangeConfig: EventRangeConfig;

  constructor(config: Partial<EventRangeConfig> = {}) {
    this.rangeConfig = {
      LOCAL_RANGE: config.LOCAL_RANGE || 5,
      NOTIFICATION_RANGE: config.NOTIFICATION_RANGE || 8,
    };
  }

  /**
   * 处理事件对单个Agent的影响
   */
  private processEventForAgent(event: Event, agent: Agent): void {
    // 更新Agent的属性
    if (event.impact) {
      if (event.impact.mood) {
        agent.attributes.mood = Math.max(-100, Math.min(100, 
          agent.attributes.mood + event.impact.mood
        ));
      }
      if (event.impact.energy) {
        agent.attributes.energy = Math.max(0, Math.min(100,
          agent.attributes.energy + event.impact.energy
        ));
      }
      if (event.impact.sociability) {
        agent.attributes.sociability = Math.max(0, Math.min(100,
          agent.attributes.sociability + event.impact.sociability
        ));
      }
    }

    // 添加到Agent的记忆中
    if (agent.memories) {
      agent.memories.push({
        id: `${event.id}-${agent.id}`,
        type: MemoryType.EVENT,
        timestamp: event.startTime,
        content: event.description,
        importance: event.scope === EventScope.GLOBAL ? 3 : 2,
        relatedAgents: event.affectedAgents,
        location: `(${event.position?.x}, ${event.position?.y})`,
        tags: [event.type.toLowerCase()],
      });
    }
  }

  /**
   * 确定事件是否影响特定Agent
   */
  private isAgentAffected(event: Event, agent: Agent): boolean {
    // 如果Agent是事件的直接参与者
    if (event.affectedAgents.includes(agent.id)) {
      return true;
    }

    // 根据事件范围判断
    switch (event.scope) {
      case EventScope.GLOBAL:
        return true;
      case EventScope.LOCAL:
        return event.position ? 
          calculateDistance(event.position, agent.position) <= this.rangeConfig.LOCAL_RANGE :
          false;
      case EventScope.INDIVIDUAL:
        return false; // 个人事件只影响直接参与者
      default:
        return false;
    }
  }

  /**
   * 处理事件
   */
  public processEvent(event: Event, agents: Agent[]): void {
    agents.forEach(agent => {
      if (this.isAgentAffected(event, agent)) {
        this.processEventForAgent(event, agent);
      } else if (
        event.position && 
        calculateDistance(event.position, agent.position) <= this.rangeConfig.NOTIFICATION_RANGE
      ) {
        // 虽然不直接受影响，但在通知范围内的Agent也会记录这个事件
        if (agent.memories) {
          agent.memories.push({
            id: `${event.id}-${agent.id}-observed`,
            type: MemoryType.OBSERVATION,
            timestamp: event.startTime,
            content: `观察到: ${event.description}`,
            importance: 1,
            relatedAgents: event.affectedAgents,
            location: `(${event.position.x}, ${event.position.y})`,
            tags: ['observation', event.type.toLowerCase()],
          });
        }
      }
    });
  }

  /**
   * 批量处理多个事件
   */
  public processEvents(events: Event[], agents: Agent[]): void {
    events.forEach(event => this.processEvent(event, agents));
  }
} 