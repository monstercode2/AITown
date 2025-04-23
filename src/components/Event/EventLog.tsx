import React from 'react';
import { Event } from '@/types/event';

interface EventLogProps {
  events: Event[];
  maxDisplayCount?: number;
}

/**
 * 事件日志组件
 * 显示小镇中发生的事件列表，按时间倒序排列
 */
const EventLog: React.FC<EventLogProps> = ({ events, maxDisplayCount = 10 }) => {
  // 获取最近的事件
  const recentEvents = events.slice(-maxDisplayCount).reverse();

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 根据事件类型返回对应的样式
  const getEventTypeStyle = (type: string) => {
    switch (type) {
      case 'SOCIAL':
        return 'text-blue-600';
      case 'ENVIRONMENTAL':
        return 'text-green-600';
      case 'PERSONAL':
        return 'text-purple-600';
      case 'TOWN':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 max-h-[600px] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">小镇事件日志</h2>
      <div className="space-y-2">
        {recentEvents.map((event) => (
          <div
            key={event.id}
            className="p-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <span className={`font-medium ${getEventTypeStyle(event.type)}`}>
                {formatTime(event.startTime)}
              </span>
              <span className="text-sm text-gray-500">
                持续: {Math.round(event.duration / 1000)}秒
              </span>
            </div>
            <p className="text-gray-700 mt-1">{event.description}</p>
            {event.affectedAgents.length > 0 && (
              <div className="text-sm text-gray-500 mt-1">
                影响: {event.affectedAgents.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventLog; 