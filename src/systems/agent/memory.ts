import { v4 as uuidv4 } from 'uuid';
import { Memory, MemoryType, ImportanceLevel, MemoryQueryOptions, MemoryQueryResult } from '@/types/memory';
import { Agent } from '@/types/agent';

/**
 * 记忆管理器类
 */
export class MemoryManager {
  private memories: Memory[] = [];
  private readonly maxMemories: number = 1000; // 最大记忆数量
  private readonly agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  /**
   * 创建新记忆
   */
  createMemory(
    type: MemoryType,
    content: string,
    importance: ImportanceLevel,
    options: Partial<Memory> = {}
  ): Memory {
    const memory: Memory = {
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      content,
      importance,
      ...options
    };

    this.addMemory(memory);
    return memory;
  }

  /**
   * 添加记忆并管理记忆容量
   */
  private addMemory(memory: Memory): void {
    this.memories.push(memory);

    // 如果超过最大记忆数量，删除最不重要的记忆
    if (this.memories.length > this.maxMemories) {
      this.memories = this.memories
        .sort((a, b) => {
          // 优先保留重要的记忆
          if (a.importance !== b.importance) {
            return b.importance - a.importance;
          }
          // 其次保留最近的记忆
          return b.timestamp - a.timestamp;
        })
        .slice(0, this.maxMemories);
    }
  }

  /**
   * 检索记忆
   */
  queryMemories(options: MemoryQueryOptions): MemoryQueryResult[] {
    let results = this.memories.filter(memory => {
      if (options.type && memory.type !== options.type) return false;
      if (options.importance && memory.importance < options.importance) return false;
      if (options.location && memory.location !== options.location) return false;
      if (options.emotion && memory.emotion !== options.emotion) return false;
      
      if (options.relatedAgents && options.relatedAgents.length > 0) {
        if (!memory.relatedAgents?.some(id => options.relatedAgents?.includes(id))) {
          return false;
        }
      }

      if (options.timeRange) {
        if (
          memory.timestamp < options.timeRange.start ||
          memory.timestamp > options.timeRange.end
        ) {
          return false;
        }
      }

      if (options.tags && options.tags.length > 0) {
        if (!memory.tags?.some(tag => options.tags?.includes(tag))) {
          return false;
        }
      }

      return true;
    });

    // 计算相关度并排序
    const queryResults: MemoryQueryResult[] = results.map(memory => ({
      memory,
      relevance: this.calculateRelevance(memory, options)
    }));

    // 按相关度排序
    queryResults.sort((a, b) => b.relevance - a.relevance);

    // 限制返回数量
    if (options.limit) {
      return queryResults.slice(0, options.limit);
    }

    return queryResults;
  }

  /**
   * 计算记忆与查询的相关度
   */
  private calculateRelevance(memory: Memory, options: MemoryQueryOptions): number {
    let relevance = 0;

    // 基础相关度：时间衰减
    const timeDecay = Math.exp(-(Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24)); // 24小时衰减
    relevance += timeDecay * 0.3; // 时间因素权重 0.3

    // 重要性相关度
    relevance += (memory.importance / ImportanceLevel.CRITICAL) * 0.3; // 重要性权重 0.3

    // 标签匹配度
    if (options.tags && memory.tags) {
      const tagMatch = options.tags.filter(tag => memory.tags?.includes(tag)).length / options.tags.length;
      relevance += tagMatch * 0.2; // 标签匹配权重 0.2
    }

    // 情感匹配度
    if (options.emotion && memory.emotion === options.emotion) {
      relevance += 0.2; // 情感匹配权重 0.2
    }

    return Math.min(1, relevance);
  }

  /**
   * 生成记忆摘要
   */
  generateSummary(options: MemoryQueryOptions): string {
    const memories = this.queryMemories(options);
    
    if (memories.length === 0) {
      return '没有相关记忆。';
    }

    // 按时间排序
    memories.sort((a, b) => a.memory.timestamp - b.memory.timestamp);

    // 生成摘要
    let summary = '记忆摘要：\n';
    memories.forEach(result => {
      const date = new Date(result.memory.timestamp).toLocaleString();
      summary += `[${date}] (重要性: ${result.memory.importance}, 相关度: ${result.relevance.toFixed(2)})\n`;
      summary += `${result.memory.content}\n\n`;
    });

    return summary;
  }

  /**
   * 更新记忆重要性
   */
  updateImportance(memoryId: string, newImportance: ImportanceLevel): void {
    const memory = this.memories.find(m => m.id === memoryId);
    if (memory) {
      memory.importance = newImportance;
    }
  }

  /**
   * 添加记忆标签
   */
  addTags(memoryId: string, tags: string[]): void {
    const memory = this.memories.find(m => m.id === memoryId);
    if (memory) {
      const uniqueTags = new Set([...(memory.tags || []), ...tags]);
      memory.tags = Array.from(uniqueTags);
    }
  }

  /**
   * 获取与特定 Agent 相关的所有记忆
   */
  getMemoriesWithAgent(agentId: string): Memory[] {
    return this.memories.filter(memory => 
      memory.relatedAgents?.includes(agentId)
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取最近的记忆
   */
  getRecentMemories(limit: number = 5): Memory[] {
    return [...this.memories]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
} 