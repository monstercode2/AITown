import { Agent } from '@/types/agent';

interface InteractionContext {
  initiator: Agent;
  target: Agent;
  location: string;
  timeOfDay: string;
  recentEvents: string[];
  previousDialogue?: string[];
}

/**
 * 生成对话提示词
 */
export function generateDialoguePrompt(context: InteractionContext): string {
  let prompt = `你是${context.initiator.name}，正在与${context.target.name}交谈。

你的性格：${context.initiator.personality || '平和友善'}
你的心情：${context.initiator.mood || '普通'}

对方的性格：${context.target.personality || '未知'}
对方的心情：${context.target.mood || '未知'}

当前环境：
- 位置：${context.location}
- 时间：${context.timeOfDay}
`;

  if (context.recentEvents.length > 0) {
    prompt += '\n最近发生的事：\n';
    context.recentEvents.forEach(event => {
      prompt += `- ${event}\n`;
    });
  }

  if (context.previousDialogue && context.previousDialogue.length > 0) {
    prompt += '\n之前的对话：\n';
    context.previousDialogue.forEach(line => {
      prompt += `${line}\n`;
    });
  }

  prompt += `\n请用以下格式回复你的对话：
MESSAGE: "你的对话内容"

注意：
1. 保持对话的自然性和连贯性
2. 考虑双方的性格和心情
3. 对话要符合当前的环境和情境
4. 回应要简短且符合对话场景
`;

  return prompt;
}

/**
 * 生成交互提示词
 */
export function generateInteractionPrompt(context: InteractionContext): string {
  let prompt = `你是${context.initiator.name}，正在与${context.target.name}互动。

你的性格：${context.initiator.personality || '平和友善'}
你的心情：${context.initiator.mood || '普通'}

对方的性格：${context.target.personality || '未知'}
对方的心情：${context.target.mood || '未知'}

当前环境：
- 位置：${context.location}
- 时间：${context.timeOfDay}
`;

  if (context.recentEvents.length > 0) {
    prompt += '\n最近发生的事：\n';
    context.recentEvents.forEach(event => {
      prompt += `- ${event}\n`;
    });
  }

  prompt += `\n请用以下格式回复你的互动行为：
ACTION: [INTERACT|SPEAK]
TARGET: ${context.target.id}
MESSAGE: "你的互动内容或对话"

注意：
1. 行为要符合场景和双方关系
2. 考虑当前的环境和时间
3. 保持互动的自然性和合理性
`;

  return prompt;
} 