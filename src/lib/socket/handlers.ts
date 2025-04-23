import { Agent } from '@/types/agent';
import { useAgentStore } from '@/store/agentStore';
import { useEventStore } from '@/store/eventStore';
import { useTimeStore } from '@/store/timeStore';
import { socketClient } from './client';
import { Event } from '@/types/event';
import { ServerToClientEvents } from './events';

type AgentUpdateData = Parameters<ServerToClientEvents['agentUpdate']>[0];
type EventOccurredData = Parameters<ServerToClientEvents['eventOccurred']>[0];
type TimeUpdateData = Parameters<ServerToClientEvents['timeUpdate']>[0];

/**
 * 初始化Socket事件处理器
 */
export function initSocketHandlers(): void {
  const socket = socketClient;

  // 监听Agent更新
  socket.on('agentUpdate', (data: AgentUpdateData) => {
    const agentStore = useAgentStore.getState();
    const agent = agentStore.getAgent(data.agentId);
    if (agent) {
      agentStore.setAgent(data.agentId, {
        ...agent,
        ...data.updates
      });
    }
  });

  // 监听事件发生
  socket.on('eventOccurred', (data: EventOccurredData) => {
    const eventStore = useEventStore.getState();
    eventStore.addEvent(data.event);
  });

  // 监听时间更新
  socket.on('timeUpdate', (data: TimeUpdateData) => {
    const timeStore = useTimeStore.getState();
    timeStore.setTime(data.currentTime);
    // dayCount会通过setTime自动更新
  });
}

/**
 * 发送Agent行动
 */
export function sendAgentAction(
  agentId: string,
  action: {
    type: string;
    data: Record<string, unknown>;
  }
): void {
  socketClient.sendAgentAction(agentId, action);
}

/**
 * 发送交互请求
 */
export function sendInteractionRequest(
  initiatorId: string,
  targetId: string,
  type: string,
  data: Record<string, unknown>
): void {
  socketClient.sendInteractionRequest({
    initiatorId,
    targetId,
    type,
    data
  });
}

/**
 * 请求时间更新
 */
export function requestTimeUpdate(): void {
  socketClient.requestTimeUpdate();
}

/**
 * 断开Socket连接
 */
export function disconnectSocket(): void {
  socketClient.disconnect();
}

/**
 * 检查Socket连接状态
 */
export function isSocketConnected(): boolean {
  return socketClient.isConnected();
} 