/**
 * 记忆类型
 */
export enum MemoryType {
  INTERACTION = 'INTERACTION',   // 与其他 Agent 的交互
  EVENT = 'EVENT',              // 发生的事件
  OBSERVATION = 'OBSERVATION',   // 观察到的现象
  EMOTION = 'EMOTION'           // 情感体验
}

/**
 * 记忆重要性级别
 */
export enum ImportanceLevel {
  LOW = 1,      // 日常琐事
  MEDIUM = 2,   // 一般事件
  HIGH = 3,     // 重要事件
  CRITICAL = 4  // 关键事件
}

/**
 * 记忆接口
 */
export interface Memory {
  id: string;                    // 唯一标识符
  type: MemoryType;             // 记忆类型
  timestamp: number;             // 创建时间戳
  content: string;              // 记忆内容
  importance: ImportanceLevel;   // 重要性级别
  relatedAgents?: string[];     // 相关的 Agent ID
  location?: string;            // 发生地点
  emotion?: string;             // 相关情感
  tags?: string[];              // 记忆标签，用于检索
}

/**
 * 记忆检索结果
 */
export interface MemoryQueryResult {
  memory: Memory;
  relevance: number;  // 与查询的相关度 (0-1)
}

/**
 * 记忆检索选项
 */
export interface MemoryQueryOptions {
  type?: MemoryType;
  importance?: ImportanceLevel;
  relatedAgents?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
  location?: string;
  emotion?: string;
  tags?: string[];
  limit?: number;
} 