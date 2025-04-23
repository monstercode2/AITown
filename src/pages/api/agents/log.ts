import { NextApiRequest, NextApiResponse } from 'next';
import { useEventStore } from '@/store/eventStore';
import { Event, EventScope } from '@/types/event';

/**
 * Agent日志API
 * 根据Agent ID获取其活动日志
 * 支持GET /api/agents/log?id=xxx
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只支持GET请求' });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: '缺少Agent ID' });
  }
  
  try {
    // 从事件存储中获取相关事件
    const eventStore = useEventStore.getState();
    const allEvents = eventStore.events;
    
    // 筛选与该Agent相关的事件
    const agentEvents = allEvents.filter((event: Event) => {
      // 全局、局部、个人事件，都检查affectedAgents
      return event.affectedAgents?.includes(id as string);
    });
    
    // 按时间顺序排序
    const sortedEvents = agentEvents.sort((a, b) => a.startTime - b.startTime);
    
    // 构建HTML响应
    const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Agent ${id} 活动日志</title>
          <style>
              body {
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.5;
                  margin: 0;
                  padding: 20px;
                  background-color: #f9fafb;
                  color: #111827;
              }
              h1 {
                  font-size: 1.5rem;
                  margin-bottom: 1rem;
                  color: #1f2937;
              }
              .event-list {
                  max-width: 800px;
                  margin: 0 auto;
              }
              .event {
                  background-color: white;
                  border-radius: 0.5rem;
                  padding: 1rem;
                  margin-bottom: 1rem;
                  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                  border-left: 4px solid;
              }
              .event.global { border-color: #818cf8; }
              .event.local { border-color: #34d399; }
              .event.individual { border-color: #f87171; }
              .event-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 0.5rem;
                  font-size: 0.875rem;
                  color: #6b7280;
              }
              .event-description {
                  font-size: 1rem;
                  color: #1f2937;
              }
              .event-time {
                  font-size: 0.75rem;
                  color: #6b7280;
              }
              .no-events {
                  text-align: center;
                  padding: 2rem;
                  color: #6b7280;
              }
          </style>
      </head>
      <body>
          <div class="event-list">
              <h1>Agent ${id} 活动日志</h1>
              ${sortedEvents.length > 0 
                ? sortedEvents.map(event => `
                  <div class="event ${event.scope.toLowerCase()}">
                      <div class="event-header">
                          <span>类型: ${event.type}</span>
                          <span class="event-time">${new Date(event.startTime).toLocaleString()}</span>
                      </div>
                      <div class="event-description">${event.description}</div>
                  </div>
                `).join('') 
                : '<div class="no-events">暂无活动记录</div>'}
          </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('获取Agent日志出错:', error);
    return res.status(500).json({ error: '获取Agent日志失败' });
  }
} 