import { Position } from './grid';
import { Memory } from './memory';

/**
 * Agent 状态枚举
 */
export enum AgentState {
  IDLE = 'IDLE',           // 空闲
  MOVING = 'MOVING',       // 移动中
  TALKING = 'TALKING',     // 对话中
  INTERACTING = 'INTERACTING', // 交互中
  WORKING = 'WORKING',     // 工作中
  RESTING = 'RESTING'      // 休息中
}

/**
 * Agent 关系接口
 */
export interface Relationship {
  targetId: string;        // 目标 Agent ID
  affinity: number;        // 好感度 (-100 到 100)
  interactions: number;    // 互动次数
  lastInteraction?: number; // 最后互动时间
}

/**
 * Agent 属性接口
 */
export interface AgentAttributes {
  energy: number;         // 0-100 的精力值
  mood: number;          // -100 到 100 的心情值
  sociability: number;   // 0-100 的社交倾向
}

/**
 * Agent 类型定义
 */
export interface Agent {
  id: string;
  name: string;
  position: Position;
  state: AgentState;
  currentAction?: string;
  personality?: string;    // 性格特点
  mood?: string;          // 当前心情
  relationships: Map<string, Relationship>;  // 与其他 Agent 的关系
  memories: Memory[];      // 记忆列表
  traits?: string[];      // 特征列表
  schedule?: {            // 日程安排
    [timeSlot: string]: string;
  };
  needs?: {              // 需求状态
    energy: number;      // 精力
    social: number;      // 社交需求
    fun: number;        // 娱乐需求
    [key: string]: number;
  };
  attributes: AgentAttributes;
  llmModel: string; // 新增字段，指定该Agent使用的大模型
}

// Agent 针对事件的反应结构
export interface AgentReaction {
  agentId: string;
  action: string; // 如"调查"、"协作"、"警觉"等
  detail: string; // 具体行动描述
  stateChange?: any; // 状态/属性变化
  emotionChange?: any; // 情绪变化
  triggeredEvent?: any; // 支持 agent 连锁反应
}

// 事件-反应-再事件的反馈上下文结构
export interface EventFeedbackContext {
  event: any; // Event 类型或 LLM 原始事件 JSON
  agentReactions: AgentReaction[];
  worldState?: any; // 可选，环境变化、奖励等
} 