import { Position } from './grid';

// 事件类型枚举
export enum EventType {
  SOCIAL = 'SOCIAL',         // 社交事件
  ENVIRONMENTAL = 'ENVIRONMENTAL', // 环境事件
  PERSONAL = 'PERSONAL',     // 个人事件
  TOWN = 'TOWN',            // 小镇事件
}

// 事件影响范围类型
export enum EventScope {
  INDIVIDUAL = 'INDIVIDUAL', // 影响单个Agent
  LOCAL = 'LOCAL',          // 影响局部区域
  GLOBAL = 'GLOBAL',        // 影响整个小镇
}

// 事件接口
export interface Event {
  id: string;
  type: EventType;
  scope: EventScope;
  description: string;
  position?: Position;      // 事件发生的位置（如果适用）
  affectedAgents: string[]; // 受影响的Agent ID列表
  startTime: number;        // 事件开始时间
  duration: number;         // 持续时间（毫秒）
  impact: {                 // 事件影响
    mood?: number;         // 对心情的影响
    energy?: number;       // 对精力的影响
    sociability?: number;  // 对社交倾向的影响
  };
  meta?: any; // 新增：用于存储事件原始 LLM JSON、事件链上下文等
} 