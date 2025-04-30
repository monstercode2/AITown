export interface Event {
  id: string;
  type: string;
  description: string;
  affectedAgents: string[];
  startTime: number;
  duration: number;
  impact?: Record<string, any>;
  meta?: Record<string, any>;
  scope?: string;
  position?: { x: number; y: number };
  fromAgent?: string;
  toAgent?: string;
  content?: string;
  emotion?: string;
  relationships?: Record<string, number>;
  createdAt?: string;
  
  // 兼容后端字段名
  affected_agents?: string[];
  start_time?: number;
  from_agent?: string;
  to_agent?: string;
  created_at?: string;
} 