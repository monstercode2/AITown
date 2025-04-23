export const LLM_CONFIG = {
  DASHSCOPE: {
    API_KEY: process.env.DASHSCOPE_API_KEY || '',
    BASE_URL: 'https://dashscope.aliyuncs.com/api/v1',
    MODEL: 'qwen-plus',
    DEFAULT_PARAMS: {
      temperature: 0.7,
      top_p: 0.8,
      result_format: 'text',
    }
  },
  GEMINI: {
    API_KEY: process.env.GEMINI_API_KEY || '',
    BASE_URL: 'https://generativelanguage.googleapis.com',
    MODEL: 'gemini-pro',
    DEFAULT_PARAMS: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1000,
    }
  },
  RETRY_CONFIG: {
    MAX_RETRIES: 3,
    INITIAL_DELAY: 1000, // 1秒
    MAX_DELAY: 10000,    // 10秒
  },
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    COOLDOWN_PERIOD: 60000, // 1分钟
  }
} as const;

// 默认使用的 LLM 服务
export const DEFAULT_LLM_SERVICE = 'DASHSCOPE';

// LLM服务类型
export type LLMService = keyof typeof LLM_CONFIG;

// 检查环境变量是否配置正确
export function validateConfig(service: LLMService = DEFAULT_LLM_SERVICE): boolean {
  switch (service) {
    case 'DASHSCOPE':
      if (!LLM_CONFIG.DASHSCOPE.API_KEY) {
        console.error('错误: 未设置DASHSCOPE_API_KEY环境变量');
        return false;
      }
      break;
    case 'GEMINI':
      if (!LLM_CONFIG.GEMINI.API_KEY) {
        console.error('错误: 未设置GEMINI_API_KEY环境变量');
        return false;
      }
      break;
  }
  return true;
} 