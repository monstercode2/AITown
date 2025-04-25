"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LLM_SERVICE = exports.LLM_CONFIG = void 0;
exports.validateConfig = validateConfig;
exports.LLM_CONFIG = {
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
        MAX_DELAY: 10000, // 10秒
    },
    RATE_LIMIT: {
        MAX_REQUESTS_PER_MINUTE: 60,
        COOLDOWN_PERIOD: 60000, // 1分钟
    }
};
// 默认使用的 LLM 服务
exports.DEFAULT_LLM_SERVICE = 'DASHSCOPE';
// 检查环境变量是否配置正确
function validateConfig(service) {
    if (service === void 0) { service = exports.DEFAULT_LLM_SERVICE; }
    switch (service) {
        case 'DASHSCOPE':
            if (!exports.LLM_CONFIG.DASHSCOPE.API_KEY) {
                console.error('错误: 未设置DASHSCOPE_API_KEY环境变量');
                return false;
            }
            break;
        case 'GEMINI':
            if (!exports.LLM_CONFIG.GEMINI.API_KEY) {
                console.error('错误: 未设置GEMINI_API_KEY环境变量');
                return false;
            }
            break;
    }
    return true;
}
