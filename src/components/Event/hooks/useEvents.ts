import { useState, useCallback } from 'react';
import { Event, EventType, EventScope } from '@/types/event';
import { useEventStore } from '../../../store/eventStore';
import { nanoid } from 'nanoid';

/**
 * 事件Hook
 * 用于管理事件的状态和操作
 */
export const useEvents = () => {
  const [activeNotification, setActiveNotification] = useState<Event | null>(null);
  const { events, addEvent, removeEvent } = useEventStore();

  /**
   * 创建新事件
   */
  const createEvent = useCallback((
    type: EventType,
    description: string,
    options: Partial<Event> = {}
  ) => {
    const newEvent: Event = {
      id: nanoid(),
      type,
      scope: options.scope || EventScope.LOCAL,
      description,
      affectedAgents: options.affectedAgents || [],
      startTime: options.startTime || Date.now(),
      duration: options.duration || 0,
      position: options.position,
      impact: options.impact || {},
    };

    addEvent(newEvent);
    setActiveNotification(newEvent);

    return newEvent;
  }, [addEvent]);

  /**
   * 更新事件
   */
  const updateEvent = useCallback((
    eventId: string,
    updates: Partial<Event>
  ) => {
    const event = events.find((e: Event) => e.id === eventId);
    if (!event) return null;

    const updatedEvent = { ...event, ...updates };
    addEvent(updatedEvent); // 使用addEvent来更新现有事件

    return updatedEvent;
  }, [events, addEvent]);

  /**
   * 删除事件
   */
  const deleteEvent = useCallback((eventId: string) => {
    removeEvent(eventId);
    if (activeNotification?.id === eventId) {
      setActiveNotification(null);
    }
  }, [removeEvent, activeNotification]);

  /**
   * 清除当前通知
   */
  const clearNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  /**
   * 获取指定时间范围内的事件
   */
  const getEventsByTimeRange = useCallback((
    startTime: number,
    endTime: number
  ) => {
    return events.filter((event: Event) => 
      event.startTime >= startTime && 
      event.startTime <= endTime
    );
  }, [events]);

  /**
   * 获取影响特定Agent的事件
   */
  const getEventsByAgent = useCallback((agentId: string) => {
    return events.filter((event: Event) => 
      event.affectedAgents.includes(agentId)
    );
  }, [events]);

  /**
   * 获取特定类型的事件
   */
  const getEventsByType = useCallback((type: EventType) => {
    return events.filter((event: Event) => event.type === type);
  }, [events]);

  return {
    events,
    activeNotification,
    createEvent,
    updateEvent,
    deleteEvent,
    clearNotification,
    getEventsByTimeRange,
    getEventsByAgent,
    getEventsByType,
  };
};

export default useEvents; 