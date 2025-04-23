/**
 * 时间类型别名
 */
export type TimeOfDay = '早上' | '上午' | '中午' | '下午' | '傍晚' | '晚上' | '深夜';

/**
 * 时间日期结构
 */
export interface GameTime {
  day: number;      // 天数
  hour: number;     // 小时 (0-23)
  minute: number;   // 分钟 (0-59)
  totalSeconds: number; // 总秒数
  timeOfDay: TimeOfDay; // 一天中的时段
}

/**
 * 将秒数转换为小时:分钟格式
 * @param totalSeconds 总秒数
 * @returns 格式化的时间字符串
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * 根据总秒数确定时间段
 * @param totalSeconds 总秒数
 * @returns 时间段描述
 */
export function getTimeOfDay(totalSeconds: number): TimeOfDay {
  const hour = Math.floor((totalSeconds % 86400) / 3600);
  
  if (hour >= 5 && hour < 8) return '早上';
  if (hour >= 8 && hour < 11) return '上午';
  if (hour >= 11 && hour < 13) return '中午';
  if (hour >= 13 && hour < 17) return '下午';
  if (hour >= 17 && hour < 19) return '傍晚';
  if (hour >= 19 && hour < 22) return '晚上';
  return '深夜';
}

/**
 * 计算天数
 * @param totalSeconds 总秒数
 * @returns 天数
 */
export function getDayCount(totalSeconds: number): number {
  return Math.floor(totalSeconds / 86400) + 1; // 从第一天开始
}

/**
 * 根据总秒数获取游戏时间对象
 * @param totalSeconds 总秒数
 * @returns 游戏时间对象
 */
export function getGameTime(totalSeconds: number): GameTime {
  const day = getDayCount(totalSeconds);
  const daySeconds = totalSeconds % 86400;
  const hour = Math.floor(daySeconds / 3600);
  const minute = Math.floor((daySeconds % 3600) / 60);
  const timeOfDay = getTimeOfDay(totalSeconds);
  
  return {
    day,
    hour,
    minute,
    totalSeconds,
    timeOfDay
  };
}

/**
 * 获取友好的时间描述
 * @param gameTime 游戏时间对象
 * @returns 友好的时间描述
 */
export function getFriendlyTimeDescription(gameTime: GameTime): string {
  return `第${gameTime.day}天 ${gameTime.timeOfDay} ${gameTime.hour}:${gameTime.minute.toString().padStart(2, '0')}`;
}

/**
 * 将时间转换为秒数
 * @param days 天数
 * @param hours 小时数
 * @param minutes 分钟数
 * @returns 总秒数
 */
export function toSeconds(days: number = 0, hours: number = 0, minutes: number = 0): number {
  return days * 86400 + hours * 3600 + minutes * 60;
}

/**
 * 判断时间是否在某个区间内
 * @param currentSeconds 当前时间（秒）
 * @param startSeconds 开始时间（秒）
 * @param endSeconds 结束时间（秒）
 * @returns 是否在区间内
 */
export function isTimeInRange(currentSeconds: number, startSeconds: number, endSeconds: number): boolean {
  const currentDaySeconds = currentSeconds % 86400;
  return currentDaySeconds >= startSeconds && currentDaySeconds <= endSeconds;
}

/**
 * 获取当前时间天气表情
 * TODO: 后续可以集成实际天气系统
 * @param _totalSeconds 总秒数
 * @returns 天气表情
 */
export function getWeatherEmoji(_totalSeconds: number): string {
  // 这里后续可以实现实际的天气系统
  // 现在简单返回晴天
  return '☀️';
}

/**
 * 计算两个时间之间的差值
 * @param timeA 时间A（秒）
 * @param timeB 时间B（秒）
 * @returns 差值（秒）
 */
export function getTimeDifference(timeA: number, timeB: number): number {
  return Math.abs(timeA - timeB);
}

/**
 * 检查某个时间是否已经超过了指定的间隔
 * @param lastTime 上次时间（秒）
 * @param currentTime 当前时间（秒）
 * @param interval 时间间隔（秒）
 * @returns 是否已超过间隔
 */
export function hasTimeElapsed(lastTime: number, currentTime: number, interval: number): boolean {
  return getTimeDifference(lastTime, currentTime) >= interval;
} 