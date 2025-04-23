import axios from 'axios';

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

interface DashscopeConfig {
  apiKey: string;
  model: string;
}

interface DashscopeResponse {
  output: {
    text: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

interface DashscopeError {
  code: string;
  message: string;
}

/**
 * 阿里百炼 API 客户端类
 */
export class DashscopeClient {
  private config: DashscopeConfig;
  private retryCount: number = 3;
  private retryDelay: number = 1000; // 1秒

  constructor(config: DashscopeConfig) {
    this.config = config;
  }

  /**
   * 发送请求到阿里百炼 API
   */
  private async makeRequest(prompt: string): Promise<string> {
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    const data = {
      model: this.config.model,
      input: {
        prompt,
      },
      parameters: {
        temperature: 0.7,
        top_p: 0.8,
        result_format: 'text',
      },
    };

    try {
      const response = await axios.post<DashscopeResponse>(
        DASHSCOPE_API_URL,
        data,
        { headers }
      );
      return response.data.output.text;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const dashError = error.response.data as DashscopeError;
        throw new Error(`Dashscope API error: ${dashError.code} - ${dashError.message}`);
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
        // 如果不是最后一次尝试，等待后重试
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