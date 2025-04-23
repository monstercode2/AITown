import axios from 'axios';
import { LLM_CONFIG } from '../config';

interface GeminiConfig {
  apiKey: string;
  model?: string;
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  promptFeedback: {
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
}

interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Gemini API 客户端类
 */
export class GeminiClient {
  private config: GeminiConfig;
  private retryCount: number = 3;
  private retryDelay: number = 1000; // 1秒
  private model: string = 'gemini-pro';

  constructor(config: GeminiConfig) {
    this.config = config;
    if (config.model) {
      this.model = config.model;
    }
  }

  /**
   * 发送请求到 Gemini API
   */
  private async makeRequest(prompt: string): Promise<string> {
    const url = `${LLM_CONFIG.GEMINI.BASE_URL}/v1/models/${this.model}:generateContent`;
    
    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.config.apiKey,
    };

    const data = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    try {
      const response = await axios.post<GeminiResponse>(url, data, { headers });
      return response.data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const geminiError = error.response.data as GeminiError;
        throw new Error(`Gemini API error: ${geminiError.error.code} - ${geminiError.error.message}`);
      }
      throw error;
    }
  }

  /**
   * 带重试机制的请求
   */
  private async requestWithRetry(prompt: string): Promise<string> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await this.makeRequest(prompt);
      } catch (error: any) {
        lastError = error;
        if (i < this.retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
        }
      }
    }
    
    throw lastError || new Error('Unknown error occurred');
  }

  /**
   * 生成 Agent 决策
   */
  async generateAgentDecision(prompt: string): Promise<string> {
    const fullPrompt = `
你是一个AI小镇中的居民。根据当前环境，你需要决定下一步行动。
请用以下格式回复：

ACTION: [MOVE|INTERACT|SPEAK|IDLE]
DIRECTION: [UP|DOWN|LEFT|RIGHT] (如果是移动)
TARGET: [目标ID] (如果是交互)
MESSAGE: "[对话内容]" (如果是说话)

环境信息：
${prompt}

请决定你的下一步行动：`;

    return this.requestWithRetry(fullPrompt);
  }

  /**
   * 生成 Agent 对话
   */
  async generateAgentDialogue(context: string): Promise<string> {
    const fullPrompt = `
你正在与其他AI小镇居民交谈。请根据上下文生成合适的对话内容。

当前上下文：
${context}

请生成对话回应：`;

    return this.requestWithRetry(fullPrompt);
  }

  /**
   * 生成事件
   */
  async generateEvent(context: string): Promise<string> {
    const fullPrompt = `
你是AI小镇的事件生成器。请根据当前情况生成一个合适的随机事件。

当前情况：
${context}

请生成一个事件：`;

    return this.requestWithRetry(fullPrompt);
  }
} 