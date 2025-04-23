import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './events';

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  /**
   * 初始化Socket连接
   */
  public init(url: string = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001'): void {
    if (this.socket) {
      console.warn('Socket connection already exists');
      return;
    }

    this.socket = io(url, {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupEventHandlers();
  }

  /**
   * 监听事件
   */
  public on<E extends keyof ServerToClientEvents>(
    event: E,
    listener: ServerToClientEvents[E]
  ): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.on(event, listener as any);
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.socket?.disconnect();
      }
    });

    // 监听Agent更新事件
    this.socket.on('agentUpdate', (data) => {
      console.log('Agent updated:', data);
      // TODO: 更新Agent状态
    });

    // 监听事件更新
    this.socket.on('eventOccurred', (data) => {
      console.log('New event:', data);
      // TODO: 处理新事件
    });

    // 监听时间更新
    this.socket.on('timeUpdate', (data) => {
      console.log('Time updated:', data);
      // TODO: 更新时间显示
    });
  }

  /**
   * 发送Agent行动
   */
  public sendAgentAction(agentId: string, action: {
    type: string;
    data: Record<string, unknown>;
  }): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.emit('agentAction', { agentId, action });
  }

  /**
   * 发送交互请求
   */
  public sendInteractionRequest(data: {
    initiatorId: string;
    targetId: string;
    type: string;
    data: Record<string, unknown>;
  }): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.emit('interactionRequest', data);
  }

  /**
   * 请求时间更新
   */
  public requestTimeUpdate(): void {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    this.socket.emit('requestTimeUpdate');
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (!this.socket) return;

    this.socket.disconnect();
    this.socket = null;
  }

  /**
   * 检查连接状态
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketClient = SocketClient.getInstance(); 