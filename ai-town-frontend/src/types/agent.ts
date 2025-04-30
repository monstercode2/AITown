export interface Memory {
  id: string;
  agent_id: string;
  content: string;
  timestamp: number;
  importance?: number;
  type?: string;
  relatedAgents?: string[];
  tags?: string[];
  emotion?: string;
  relationships?: Record<string, number>;
}

export interface Agent {
  id: string;
  name: string;
  position: { x: number; y: number };
  avatar: string;
  state: string;
  personality?: string;
  traits?: string[];
  attributes?: Record<string, any>;
  emotion?: string;
  relationships?: Record<string, number>;
  relatedAgents?: string[];
  llm_model?: string;
  current_action?: string;
  schedule?: Record<string, any>;
  needs?: Record<string, any>;
  createdAt?: string;
  updated_at?: string;
  memories?: Memory[];
} 