import React from 'react';
import { useTimeStore } from '../../store/timeStore';

/**
 * 时间显示组件
 * 显示模拟中的时间和日期
 */
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getTimeOfDay = (totalSeconds: number): string => {
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  if (hours >= 5 && hours < 12) return '早上';
  if (hours >= 12 && hours < 14) return '中午';
  if (hours >= 14 && hours < 18) return '下午';
  if (hours >= 18 && hours < 22) return '晚上';
  return '夜晚';
};

const getWeatherEmoji = (): string => {
  // 临时返回晴天表情，后续可以根据天气系统更新
  return '☀️';
};

const TimeDisplay: React.FC = () => {
  const { currentTime, dayCount } = useTimeStore();

  return (
    <div className="fixed top-4 right-4 bg-gray-800 text-white p-2 rounded-lg shadow-lg">
      <div className="text-sm">第 {dayCount} 天</div>
      <div className="text-lg font-bold">{formatTime(currentTime)}</div>
    </div>
  );
};

export default TimeDisplay; 