import { Agent } from '@/types/agent';
import { EnvironmentInfo } from '@/systems/agent/decision';

/**
 * 生成角色设定提示词
 */
export function generateRolePrompt(agent: Agent): string {
  return `你是AI小镇的居民 ${agent.name}。
性格特点：${agent.personality || '平和友善'}
当前心情：${agent.mood || '普通'}
`;
}

/**
 * 生成系统提示词
 */
export function generateSystemPrompt(): string {
  return `你是AI小镇中的一位居民。作为小镇居民，你需要：
1. 根据当前环境和个人状态做出合理的决策
2. 与其他居民友好互动
3. 保持行为的连续性和合理性

请用以下格式回复你的决策：

ACTION: [MOVE|INTERACT|SPEAK|IDLE]
DIRECTION: [UP|DOWN|LEFT|RIGHT] (如果是移动)
TARGET: [目标ID] (如果是交互)
MESSAGE: "[对话内容]" (如果是说话)

注意：
- 移动时必须指定方向
- 交互时必须指定目标
- 说话时必须包含对话内容
- 保持回复格式的严格一致性
`;
}

/**
 * 生成环境描述提示词
 */
export function generateEnvironmentPrompt(env: EnvironmentInfo): string {
  let prompt = `当前环境：
位置：${env.currentLocation.tileType}
时间：${env.timeOfDay}
`;

  if (env.nearbyAgents.length > 0) {
    prompt += '\n附近的居民：\n';
    env.nearbyAgents.forEach(agent => {
      prompt += `- ${agent.name} 正在${agent.currentAction || '这里'}\n`;
    });
  }

  if (env.recentEvents.length > 0) {
    prompt += '\n最近发生的事：\n';
    env.recentEvents.forEach(event => {
      prompt += `- ${event}\n`;
    });
  }

  return prompt;
}

/**
 * 生成完整的决策提示词
 */
export function generateDecisionPrompt(
  agent: Agent,
  env: EnvironmentInfo
): string {
  return `${generateSystemPrompt()}

${generateRolePrompt(agent)}

${generateEnvironmentPrompt(env)}

根据以上信息，请决定你的下一步行动：`;
} 