import axios from 'axios';
import { Readable } from 'stream';
import * as zlib from 'zlib';
import OpenAI from 'openai';
import process from 'process';

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const DASHSCOPE_COMPAT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

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

const streamModels = ['qwq-plus', 'qwq-32b', 'llama-4-scout-17b-16e-instruct'];

/**
 * 阿里百炼 API 客户端类
 */
export class DashscopeClient {
  private config: DashscopeConfig;
  private retryCount: number = 3;
  private retryDelay: number = 1000; // 1秒
  private openai: OpenAI | null = null;

  constructor(config: DashscopeConfig) {
    this.config = config;
    if (streamModels.includes(config.model)) {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: DASHSCOPE_COMPAT_URL
      });
    }
  }

  /**
   * 发送请求到阿里百炼 API
   */
  private async makeRequest(prompt: string): Promise<string> {
    const needStream = streamModels.includes(this.config.model);
    if (needStream && this.openai) {
      // 用 openai 兼容 SDK 流式调用
      let reasoningContent = '';
      let answerContent = '';
      let isAnswering = false;
      const stream = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      });
      for await (const chunk of stream) {
        if (!chunk.choices?.length) continue;
        const delta = chunk.choices[0].delta;
        // 兼容 reasoning_content 字段（部分模型有）
        if ('reasoning_content' in delta && typeof delta.reasoning_content === 'string') {
          reasoningContent += delta.reasoning_content;
        } else if ('content' in delta && typeof delta.content === 'string') {
          isAnswering = true;
          answerContent += delta.content;
        }
      }
      // 优先返回正式回复
      return answerContent || reasoningContent;
    } else {
      // 普通模式
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
          const data = error.response.data;
          if (data && typeof data === 'object') {
            if (data.error && (data.error.code || data.error.message)) {
              throw new Error(`Dashscope API error: ${data.error.code || ''} - ${data.error.message || ''}`);
            }
            if (data.code || data.message) {
              throw new Error(`Dashscope API error: ${data.code || ''} - ${data.message || ''}`);
            }
            throw new Error(`Dashscope API error: ${JSON.stringify(data)}`);
          }
          throw new Error(`Dashscope API error: ${data}`);
        }
        throw error;
      }
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
    const fullPrompt = `你是一个AI小镇中的居民。根据当前环境，你需要决定下一步行动。\n环境信息：\n${prompt}\n请决定你的下一步行动：`;
    return this.requestWithRetry(fullPrompt);
  }

  /**
   * 生成 Agent 对话
   */
  async generateAgentDialogue(context: string): Promise<string> {
    const fullPrompt = `你正在与其他AI小镇居民交谈。请根据上下文生成合适的对话内容。\n当前上下文：\n${context}\n请生成对话回应：`;
    return this.requestWithRetry(fullPrompt);
  }

  /**
   * 生成事件
   */
  async generateEvent(context: string): Promise<string> {
    const fullPrompt = `你是AI小镇的事件生成器。请根据当前情况生成一个合适的、具有丰富细节的随机事件。\n\n注意：你只负责生成事件本身（如事件名称、描述、触发条件、奖励、环境变化等），不要生成任何agent的具体反应或行动。每个agent的反应会由系统后续单独决策。\n\n当前情况：\n${context}\n\n请只输出事件本身的详细信息，格式为JSON。`;
    return this.requestWithRetry(fullPrompt);
  }
} 