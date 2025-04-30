import type { Event } from '../types/event'

export async function fetchEvents(): Promise<Event[]> {
  try {
    console.log('开始获取事件列表...')
    const res = await fetch('/api/event/debug') // 使用debug接口
    if (!res.ok) {
      console.error('获取事件列表失败:', res.status, res.statusText)
      return []
    }
    
    const json = await res.json()
    console.log('事件API返回原始JSON:', JSON.stringify(json).substring(0, 200) + '...')
    
    // 直接使用debug接口的events数组
    if (json && json.data && Array.isArray(json.data.events)) {
      const events = json.data.events
      console.log(`从debug接口获取到${events.length}个事件`)
      
      // 转换字段名（后端可能使用下划线而不是驼峰命名）
      const processedEvents = events.map((event: Record<string, any>) => {
        // 确保基础字段存在
        const processedEvent: Event = {
          id: event.id || `local-${Date.now()}`,
          type: event.type || 'UNKNOWN',
          description: event.description || '未知事件',
          affectedAgents: Array.isArray(event.affected_agents) ? event.affected_agents : 
                        (event.affectedAgents || []),
          startTime: event.start_time || event.startTime || Date.now(),
          duration: event.duration || 60000,
          createdAt: event.created_at || event.createdAt || new Date().toISOString()
        };
        
        // 可选字段
        if (event.from_agent) processedEvent.fromAgent = event.from_agent;
        if (event.to_agent) processedEvent.toAgent = event.to_agent;
        if (event.content) processedEvent.content = event.content;
        if (event.meta) processedEvent.meta = event.meta;
        if (event.impact) processedEvent.impact = event.impact;
        if (event.scope) processedEvent.scope = event.scope;
        if (event.position) processedEvent.position = event.position;
        
        return processedEvent;
      });
      
      console.log(`处理后返回${processedEvents.length}个事件`);
      if (processedEvents.length > 0) {
        console.log('第一个处理后的事件:', JSON.stringify(processedEvents[0]).substring(0, 200) + '...');
      }
      
      return processedEvents;
    }
    
    console.warn('事件debug接口返回了意外格式:', json)
    return []
  } catch (err) {
    console.error('获取事件列表异常:', err)
    return []
  }
}

export async function searchEventsByVector(embedding: number[], top_k: number = 5) {
  try {
    const res = await fetch('/api/event/search_by_vector', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedding, top_k })
    })
    if (!res.ok) {
      console.error('向量事件检索失败:', res.status, res.statusText)
      return []
    }
    
    const json = await res.json()
    // 兼容多种响应格式
    return Array.isArray(json.data) ? json.data : 
           (Array.isArray(json) ? json : [])
  } catch (err) {
    console.error('向量事件检索异常:', err)
    return []
  }
} 