import React, { useEffect, useState } from 'react';
import { Event } from '@/types/event';

interface EventNotificationProps {
  event: Event;
  onDismiss?: () => void;
  autoDismissTime?: number; // 自动消失时间（毫秒）
}

/**
 * 事件通知组件
 * 显示最新发生的事件的弹出通知
 */
const EventNotification: React.FC<EventNotificationProps> = ({
  event,
  onDismiss,
  autoDismissTime = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 重置可见性状态
    setIsVisible(true);

    // 设置自动消失定时器
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, autoDismissTime);

    return () => clearTimeout(timer);
  }, [event, autoDismissTime, onDismiss]);

  if (!isVisible) return null;

  // 根据事件类型返回对应的样式
  const getEventTypeStyle = () => {
    switch (event.type) {
      case 'SOCIAL':
        return 'bg-blue-100 border-blue-500';
      case 'ENVIRONMENTAL':
        return 'bg-green-100 border-green-500';
      case 'PERSONAL':
        return 'bg-purple-100 border-purple-500';
      case 'TOWN':
        return 'bg-orange-100 border-orange-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${getEventTypeStyle()}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">新事件发生</h3>
          <p className="text-gray-600 mt-1">{event.description}</p>
          {event.affectedAgents.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              影响: {event.affectedAgents.join(', ')}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <span className="sr-only">关闭</span>
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EventNotification; 