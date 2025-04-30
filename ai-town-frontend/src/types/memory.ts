export interface Memory {
  id: string;
  agent_id: string;
  content: string;
  timestamp: number;
  importance: number;
  type: string;
  relatedAgents?: string[];
  location?: string;
  tags?: string[];
  embedding?: number[];
  emotion?: string;
  relationships?: Record<string, number>;
} 