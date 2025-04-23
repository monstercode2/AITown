import React, { useState } from 'react';
import { Event, EventType, EventScope } from '@/types/event';

interface EventLogProps {
  events: Event[];
  maxDisplayCount?: number;
  onEventSelect?: (event: Event) => void;
  className?: string;
}

/**
 * 事件日志组件
 * 显示小镇中发生的事件列表，提供事件过滤和详细信息
 */
export const EventLog: React.FC<EventLogProps> = ({
  events,
  maxDisplayCount = 20,
  onEventSelect,
  className = '',
}) => {
  const [filter, setFilter] = useState<EventType | 'ALL'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);

  // 事件过滤
  const filteredEvents = filter === 'ALL'
    ? events
    : events.filter(event => event.type === filter);

  // 获取最近的事件，按时间倒序排列
  const recentEvents = filteredEvents
    .slice(-maxDisplayCount)
    .sort((a, b) => b.startTime - a.startTime);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 获取事件类型的中文名称
  const getEventTypeName = (type: EventType) => {
    switch (type) {
      case EventType.SOCIAL:
        return '社交事件';
      case EventType.ENVIRONMENTAL:
        return '环境事件';
      case EventType.PERSONAL:
        return '个人事件';
      case EventType.TOWN:
        return '小镇事件';
      default:
        return '未知事件';
    }
  };

  // 根据事件类型返回对应的样式
  const getEventTypeStyle = (type: EventType) => {
    switch (type) {
      case EventType.SOCIAL:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case EventType.ENVIRONMENTAL:
        return 'text-green-600 bg-green-50 border-green-200';
      case EventType.PERSONAL:
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case EventType.TOWN:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 获取事件范围的中文名称
  const getEventScopeName = (scope: EventScope) => {
    switch (scope) {
      case EventScope.INDIVIDUAL:
        return '个人';
      case EventScope.LOCAL:
        return '局部';
      case EventScope.GLOBAL:
        return '全局';
      default:
        return '未知';
    }
  };

  // 切换展开/折叠
  const toggleExpand = (eventId: string) => {
    setExpanded(expanded === eventId ? null : eventId);
  };

  // 处理事件选择
  const handleEventSelect = (event: Event) => {
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">小镇事件日志</h2>
        
        {/* 事件类型过滤 */}
        <div className="flex space-x-2 text-sm">
          <button
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'ALL' ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setFilter('ALL')}
          >
            全部
          </button>
          {Object.values(EventType).map((type) => (
            <button
              key={type}
              className={`px-2 py-1 rounded transition-colors ${
                filter === type ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setFilter(type)}
            >
              {getEventTypeName(type)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {recentEvents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            暂无事件记录
          </div>
        ) : (
          recentEvents.map((event) => (
            <div
              key={event.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                expanded === event.id ? 'shadow-md' : ''
              }`}
            >
              {/* 事件标题行 */}
              <div 
                className={`p-3 cursor-pointer flex items-center justify-between border-b ${
                  getEventTypeStyle(event.type)
                }`}
                onClick={() => toggleExpand(event.id)}
              >
                <div className="flex items-center">
                  <div className="font-medium">{formatTime(event.startTime)}</div>
                  <div className="ml-2 text-sm">
                    {getEventTypeName(event.type)}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-60">
                    {getEventScopeName(event.scope)}
                  </span>
                  <button className="ml-2">
                    {expanded === event.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 事件详情 */}
              {expanded === event.id && (
                <div className="p-3 bg-white">
                  <p className="text-gray-700 mb-3">{event.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">持续时间:</span>
                      <span className="ml-2">
                        {Math.round(event.duration / 1000)}秒
                      </span>
                    </div>
                    
                    {event.position && (
                      <div>
                        <span className="text-gray-500">位置:</span>
                        <span className="ml-2">
                          ({event.position.x}, {event.position.y})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 事件影响 */}
                  {event.impact && Object.keys(event.impact).length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-gray-500 mb-1">影响:</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(event.impact).map(([key, value]) => (
                          <span 
                            key={key} 
                            className={`text-xs px-2 py-1 rounded ${
                              value > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {key}: {value > 0 ? '+' : ''}{value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 受影响的Agent */}
                  {event.affectedAgents && event.affectedAgents.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-500 mb-1">
                        受影响的居民 ({event.affectedAgents.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {event.affectedAgents.map(agentId => (
                          <span 
                            key={agentId}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {agentId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-right">
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => handleEventSelect(event)}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 