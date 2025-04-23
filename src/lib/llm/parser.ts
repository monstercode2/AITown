import { ActionType, AgentAction } from '@/systems/agent/decision';
import { Direction } from '@/systems/agent/movement';
import { EventType, EventScope } from '@/types/event';

/**
 * 解析Agent决策响应
 */
export function parseAgentDecision(response: string): AgentAction {
  // 默认动作为空闲
  const defaultAction: AgentAction = {
    type: ActionType.IDLE,
    data: {}
  };

  try {
    // 查找动作类型
    const actionMatch = response.match(/ACTION: (MOVE|INTERACT|SPEAK|IDLE)/i);
    if (!actionMatch) return defaultAction;

    const action: AgentAction = {
      type: actionMatch[1] as ActionType,
      data: {}
    };

    // 根据动作类型解析详细信息
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
        const interactionMessageMatch = response.match(/MESSAGE: "(.+)"/);
        if (interactionMessageMatch) {
          action.data.message = interactionMessageMatch[1];
        }
        break;
    }

    return action;
  } catch (error) {
    console.error('Error parsing agent decision:', error);
    return defaultAction;
  }
}

/**
 * 解析对话响应
 */
export function parseDialogue(response: string): string {
  try {
    const messageMatch = response.match(/MESSAGE: "(.+)"/);
    if (messageMatch) {
      return messageMatch[1];
    }
    return '';
  } catch (error) {
    console.error('Error parsing dialogue:', error);
    return '';
  }
}

/**
 * 解析事件响应
 */
export interface ParsedEvent {
  type: EventType;
  scope: EventScope;
  description: string;
  duration?: number;
  impact?: {
    mood?: number;
    energy?: number;
    sociability?: number;
  };
}

export function parseEvent(response: string): ParsedEvent | null {
  try {
    const typeMatch = response.match(/TYPE: (SOCIAL|ENVIRONMENTAL|PERSONAL|TOWN)/i);
    const scopeMatch = response.match(/SCOPE: (INDIVIDUAL|LOCAL|GLOBAL)/i);
    const descriptionMatch = response.match(/DESCRIPTION: "(.+)"/);
    const durationMatch = response.match(/DURATION: (\d+)/);
    const impactMatch = response.match(/IMPACT: {([^}]+)}/);

    if (!typeMatch || !scopeMatch || !descriptionMatch) {
      return null;
    }

    const event: ParsedEvent = {
      type: typeMatch[1] as EventType,
      scope: scopeMatch[1] as EventScope,
      description: descriptionMatch[1],
    };

    if (durationMatch) {
      event.duration = parseInt(durationMatch[1]);
    }

    if (impactMatch) {
      event.impact = {};
      const impactStr = impactMatch[1];
      
      const moodMatch = impactStr.match(/mood: (-?\d+)/i);
      const energyMatch = impactStr.match(/energy: (-?\d+)/i);
      const sociabilityMatch = impactStr.match(/sociability: (-?\d+)/i);

      if (moodMatch) event.impact.mood = parseInt(moodMatch[1]);
      if (energyMatch) event.impact.energy = parseInt(energyMatch[1]);
      if (sociabilityMatch) event.impact.sociability = parseInt(sociabilityMatch[1]);
    }

    return event;
  } catch (error) {
    console.error('Error parsing event:', error);
    return null;
  }
}

/**
 * 分析文本情感
 */
export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  // 简单的情感分析，后续可以使用更复杂的算法或调用专门的API
  const positiveWords = ['开心', '高兴', '快乐', '好', '棒', '喜欢', '感谢', '谢谢'];
  const negativeWords = ['不开心', '难过', '伤心', '糟糕', '讨厌', '生气', '抱歉', '对不起'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (text.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (text.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
} 