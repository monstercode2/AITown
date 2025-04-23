import { Agent } from '@/types/agent';
import { Event } from '@/types/event';

// 服务器发送给客户端的事件
export interface ServerToClientEvents {
  agentUpdate: (data: {
    agentId: string;
    updates: Partial<Agent>;
  }) => void;
  eventOccurred: (data: {
    event: Event;
  }) => void;
  timeUpdate: (data: {
    currentTime: number;
    dayCount: number;
  }) => void;
}

// 客户端发送给服务器的事件
export interface ClientToServerEvents {
  agentAction: (data: {
    agentId: string;
    action: {
      type: string;
      data: any;
    };
  }) => void;
  interactionRequest: (data: {
    initiatorId: string;
    targetId: string;
    type: string;
    data: any;
  }) => void;
  requestTimeUpdate: () => void;
}

// 服务器间事件
export interface InterServerEvents {
  ping: () => void;
}

// Socket数据
export interface SocketData {
  userId: string;
  sessionId: string;
} 