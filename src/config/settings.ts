// src/config/settings.ts

import { AgentState, Agent } from '../types/agent';

export const LLM_MODELS = {
  'deepseek-v3': {
    name: 'Deepseek V3',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'deepseek-v3',
    apiKeyEnv: 'DASHSCOPE_API_KEY'
  },
  'qwen-max': {
    name: 'Qwen Max',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-max',
    apiKeyEnv: 'DASHSCOPE_API_KEY'
  },
  'qwq-plus': {
    name: 'Qwq Plus',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwq-plus',
    apiKeyEnv: 'DASHSCOPE_API_KEY'
  },
  'llama-4-scout-17b-16e-instruct': {
    name: 'Llama 4 Scout',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'llama-4-scout-17b-16e-instruct',
    apiKeyEnv: 'DASHSCOPE_API_KEY'
  }
};

export const AGENT_PRESETS: Omit<Agent, 'relationships' | 'memories'>[] = [
  {
    id: '1',
    name: '小明',
    llmModel: 'deepseek-v3',
    position: { x: 5, y: 5 },
    state: AgentState.IDLE,
    personality: '活泼、好奇、友善',
    currentAction: '正在探索小镇',
    traits: ['善良', '有创造力', '喜欢交朋友'],
    schedule: {
      '8:00': '早餐',
      '9:00': '探索小镇',
      '12:00': '午餐',
      '14:00': '与朋友交流',
      '18:00': '晚餐',
      '21:00': '休息'
    },
    needs: {
      energy: 80,
      social: 60,
      fun: 70
    },
    attributes: {
      energy: 100,
      mood: 50,
      sociability: 70
    }
  },
  {
    id: '2',
    name: '小红',
    llmModel: 'qwen-max',
    position: { x: 3, y: 3 },
    state: AgentState.IDLE,
    personality: '温柔、细心、乐于助人',
    currentAction: '正在整理物品',
    traits: ['耐心', '喜欢思考', '爱整洁'],
    schedule: {
      '7:30': '晨练',
      '8:30': '早餐',
      '9:30': '整理房间',
      '12:00': '午餐',
      '13:30': '读书',
      '17:00': '帮助邻居',
      '19:00': '晚餐',
      '20:30': '休息'
    },
    needs: {
      energy: 90,
      social: 70,
      fun: 60
    },
    attributes: {
      energy: 100,
      mood: 60,
      sociability: 80
    }
  },
  {
    id: '3',
    name: '老王',
    llmModel: 'qwq-plus',
    position: { x: 1, y: 1 },
    state: AgentState.WORKING,
    personality: '勤劳、严谨、有责任感',
    currentAction: '正在经营商店',
    traits: ['勤奋', '守纪律', '有担当'],
    schedule: {
      '6:00': '开店',
      '12:00': '午餐',
      '13:00': '进货',
      '18:00': '关店',
      '19:00': '休息'
    },
    needs: {
      energy: 70,
      social: 30,
      fun: 40
    },
    attributes: {
      energy: 100,
      mood: 80,
      sociability: 40
    }
  },
  {
    id: '4',
    name: '小张',
    llmModel: 'llama-4-scout-17b-16e-instruct',
    position: { x: 7, y: 1 },
    state: AgentState.RESTING,
    personality: '外向、乐观、喜欢表演',
    currentAction: '正在休息',
    traits: ['幽默', '爱表演', '乐观'],
    schedule: {
      '8:00': '锻炼',
      '9:00': '表演',
      '12:00': '午餐',
      '14:00': '与朋友玩耍',
      '18:00': '晚餐',
      '21:00': '休息'
    },
    needs: {
      energy: 95,
      social: 95,
      fun: 100
    },
    attributes: {
      energy: 100,
      mood: 90,
      sociability: 90
    }
  }
];

export const LLM_PROMPTS = {
  decision: (env: any) => `你是一个AI小镇中的居民。根据当前环境，你需要决定下一步行动。\n环境信息：\n${JSON.stringify(env)}\n请决定你的下一步行动：`,
  event: (context: any) => `你是AI小镇的事件生成器。请根据当前情况生成一个合适的随机事件。\n当前情况：\n${JSON.stringify(context)}\n请生成一个事件：`
};

export const GLOBAL_SETTINGS = {
  eventFrequency: 0.1,
  timeScale: 1
}; 