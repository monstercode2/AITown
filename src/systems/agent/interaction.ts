import { Agent, AgentState, Relationship } from '../../types/agent';
import { Position } from '../../types/grid';
import { DashscopeClient } from '../../lib/llm/client/dashscope';
import { generateDialoguePrompt, generateInteractionPrompt } from '../../lib/llm/prompts/agent-interaction';

/**
 * 检查两个 Agent 是否在交互范围内
 */
export function isWithinInteractionRange(a: Position, b: Position, range: number = 1): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx <= range && dy <= range;
}

/**
 * 更新 Agent 之间的关系
 */
export function updateRelationship(
  agent: Agent,
  target: Agent,
  interactionType: 'positive' | 'negative' | 'neutral',
  intensity: number = 1
): void {
  // 获取或创建关系对象
  let relationship = agent.relationships.get(target.id) || {
    targetId: target.id,
    affinity: 0,
    interactions: 0
  };

  // 根据交互类型更新好感度
  switch (interactionType) {
    case 'positive':
      relationship.affinity = Math.min(100, relationship.affinity + 5 * intensity);
      break;
    case 'negative':
      relationship.affinity = Math.max(-100, relationship.affinity - 5 * intensity);
      break;
    case 'neutral':
      // 中性交互略微提升好感度
      relationship.affinity = Math.min(100, relationship.affinity + intensity);
      break;
  }

  // 增加互动次数
  relationship.interactions += 1;

  // 更新关系
  agent.relationships.set(target.id, relationship);
}

/**
 * 处理对话交互
 */
export async function handleDialogue(
  initiator: Agent,
  target: Agent,
  llmClient: DashscopeClient,
  location: string,
  timeOfDay: string,
  recentEvents: string[],
  previousDialogue?: string[]
): Promise<string> {
  // 检查是否在交互范围内
  if (!isWithinInteractionRange(initiator.position, target.position)) {
    return '对话失败：距离太远';
  }

  // 准备对话上下文
  const context = {
    initiator,
    target,
    location,
    timeOfDay,
    recentEvents,
    previousDialogue
  };

  try {
    // 生成对话内容
    const response = await llmClient.generateAgentDialogue(
      generateDialoguePrompt(context)
    );

    // 解析对话内容
    const messageMatch = response.match(/MESSAGE: "(.+)"/);
    if (!messageMatch) {
      throw new Error('无法解析对话响应');
    }

    const message = messageMatch[1];

    // 更新 Agent 状态
    initiator.state = AgentState.TALKING;
    initiator.currentAction = message;
    
    // 更新关系（默认为中性交互）
    updateRelationship(initiator, target, 'neutral');

    return message;
  } catch (error) {
    console.error('对话生成失败:', error);
    return '对话生成失败';
  }
}

/**
 * 处理一般交互
 */
export async function handleInteraction(
  initiator: Agent,
  target: Agent,
  llmClient: DashscopeClient,
  location: string,
  timeOfDay: string,
  recentEvents: string[]
): Promise<string> {
  // 检查是否在交互范围内
  if (!isWithinInteractionRange(initiator.position, target.position)) {
    return '交互失败：距离太远';
  }

  // 准备交互上下文
  const context = {
    initiator,
    target,
    location,
    timeOfDay,
    recentEvents
  };

  try {
    // 生成交互行为
    const response = await llmClient.generateAgentDialogue(
      generateInteractionPrompt(context)
    );

    // 解析交互行为
    const actionMatch = response.match(/ACTION: (INTERACT|SPEAK)/);
    const messageMatch = response.match(/MESSAGE: "(.+)"/);

    if (!actionMatch || !messageMatch) {
      throw new Error('无法解析交互响应');
    }

    const action = actionMatch[1];
    const message = messageMatch[1];

    // 更新 Agent 状态
    initiator.state = AgentState.TALKING;
    initiator.currentAction = message;

    // 根据交互内容判断类型并更新关系
    const sentiment = analyzeSentiment(message);
    updateRelationship(initiator, target, sentiment);

    return message;
  } catch (error) {
    console.error('交互生成失败:', error);
    return '交互生成失败';
  }
}

/**
 * 简单的情感分析
 * TODO: 后续可以使用更复杂的情感分析
 */
function analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['喜欢', '开心', '高兴', '感谢', '好', '棒', '真棒', '帮助'];
  const negativeWords = ['讨厌', '生气', '难过', '烦', '坏', '差', '糟糕'];

  const positiveCount = positiveWords.filter(word => message.includes(word)).length;
  const negativeCount = negativeWords.filter(word => message.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * 获取两个 Agent 之间的关系状态
 */
export function getRelationshipStatus(
  agent: Agent,
  target: Agent
): { affinity: number; interactions: number } {
  const relationship = agent.relationships.get(target.id);
  return relationship || { affinity: 0, interactions: 0 };
} 