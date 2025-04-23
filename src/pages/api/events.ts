import { NextApiRequest, NextApiResponse } from 'next';
import { useEventStore } from '@/store/eventStore';
import { useAgentStore } from '@/store/agentStore';
import { Logger, LogCategory } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventType, EventScope } from '@/types/event';

/**
 * Event API路由
 * 提供获取、添加和删除事件的功能
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  try {
    const eventStore = useEventStore.getState();
    const agentStore = useAgentStore.getState();
    
    // GET: 获取事件列表或单个事件
    if (req.method === 'GET') {
      const { id } = req.query;
      
      // 获取单个事件
      if (id && typeof id === 'string') {
        const event = eventStore.events.find(e => e.id === id);
        
        if (!event) {
          return res.status(404).json({ error: `事件不存在: ${id}` });
        }
        
        return res.status(200).json(event);
      }
      
      // 获取所有事件
      const events = eventStore.events;
      
      // 支持简单的分页
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // 支持按类型过滤
      const typeFilter = req.query.type as string;
      
      let filteredEvents = events;
      
      if (typeFilter) {
        filteredEvents = events.filter(event => event.type === typeFilter);
      }
      
      // 分页处理
      if (offset || limit) {
        filteredEvents = filteredEvents.slice(offset, limit ? offset + limit : undefined);
      }
      
      return res.status(200).json(filteredEvents);
    }
    
    // POST: 添加新事件
    if (req.method === 'POST') {
      const eventData = req.body;
      
      // 验证必填字段
      if (!eventData.type || !eventData.description) {
        return res.status(400).json({ error: '缺少必要字段: type或description' });
      }
      
      // 验证类型是否有效
      if (!Object.values(EventType).includes(eventData.type)) {
        return res.status(400).json({ 
          error: `无效的事件类型: ${eventData.type}`,
          validTypes: Object.values(EventType)
        });
      }
      
      // 验证范围是否有效
      if (eventData.scope && !Object.values(EventScope).includes(eventData.scope)) {
        return res.status(400).json({ 
          error: `无效的事件范围: ${eventData.scope}`,
          validScopes: Object.values(EventScope)
        });
      }
      
      // 验证受影响的Agent是否存在
      if (eventData.affectedAgents && eventData.affectedAgents.length > 0) {
        for (const agentId of eventData.affectedAgents) {
          const agent = agentStore.getAgent(agentId);
          if (!agent) {
            return res.status(400).json({ 
              error: `受影响的Agent不存在: ${agentId}` 
            });
          }
        }
      }
      
      // 创建新事件
      const newEvent: Event = {
        id: eventData.id || uuidv4(),
        type: eventData.type,
        scope: eventData.scope || EventScope.INDIVIDUAL,
        description: eventData.description,
        position: eventData.position,
        affectedAgents: eventData.affectedAgents || [],
        startTime: eventData.startTime || Date.now(),
        duration: eventData.duration || 10000, // 默认持续10秒
        impact: eventData.impact || {}
      };
      
      // 添加到存储
      eventStore.addEvent(newEvent);
      
      Logger.info(LogCategory.EVENT, `创建新事件: ${newEvent.id} (${newEvent.type})`, {
        event: newEvent
      });
      
      return res.status(201).json(newEvent);
    }
    
    // DELETE: 删除事件
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: '缺少事件ID' });
      }
      
      const eventExists = eventStore.events.some(e => e.id === id);
      
      if (!eventExists) {
        return res.status(404).json({ error: `事件不存在: ${id}` });
      }
      
      // 删除事件
      eventStore.removeEvent(id);
      
      Logger.info(LogCategory.EVENT, `删除事件: ${id}`);
      
      return res.status(200).json({ success: true, message: `事件已删除: ${id}` });
    }
    
    // 不支持的方法
    return res.status(405).json({ error: '方法不允许' });
  } catch (error) {
    Logger.error(LogCategory.API, '处理Event API请求时出错', error);
    return res.status(500).json({ 
      error: '内部服务器错误',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
} 