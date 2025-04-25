import React, { useState, useEffect } from 'react';
import { useTimeStore } from '@/store/timeStore';
import { useEventStore } from '@/store/eventStore';

interface ControlsProps {
  className?: string;
}

// 模拟状态类型
type SimulationStatus = 'idle' | 'running' | 'paused';

// 模拟设置
interface SimulationSettings {
  timeScale: number;        // 时间流速（默认1）
  eventFrequency: number;   // 事件生成频率（0-1）
  autoAgentDecisions: boolean; // 是否自动Agent决策
}

/**
 * 控制面板组件
 * 用于控制模拟速度和其他全局设置
 */
export const Controls: React.FC<ControlsProps> = ({ className = '' }) => {
  const { currentTime, dayCount } = useTimeStore();
  const { events } = useEventStore();
  
  // 本地状态
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [settings, setSettings] = useState<SimulationSettings>({
    timeScale: 1,
    eventFrequency: 0.5,
    autoAgentDecisions: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  const API_BASE = 'http://localhost:3001/api/simulation';

  // 获取当前模拟状态
  const fetchStatus = async () => {
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) throw new Error('获取状态失败');
      
      const data = await response.json();
      setStatus(data.status);
      setSettings(data.settings);
      if (data.uptime !== undefined) {
        setSystemInfo({
          uptime: formatUptime(data.uptime),
          agentCount: data.agents?.length || 0
        });
      }
    } catch (err) {
      console.error('获取模拟状态出错:', err);
      setError('无法连接到模拟服务器');
    }
  };

  // 格式化运行时间
  const formatUptime = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${milliseconds}毫秒`;
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 启动模拟
  const startSimulation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}?action=start`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '启动失败');
      }
      
      const data = await response.json();
      setStatus(data.status);
      // 可以处理返回的agents数据
    } catch (err) {
      console.error('启动模拟出错:', err);
      setError(err instanceof Error ? err.message : '启动失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 暂停模拟
  const pauseSimulation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}?action=pause`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '暂停失败');
      }
      
      const data = await response.json();
      setStatus(data.status);
    } catch (err) {
      console.error('暂停模拟出错:', err);
      setError(err instanceof Error ? err.message : '暂停失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置模拟
  const resetSimulation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}?action=reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '重置失败');
      }
      
      const data = await response.json();
      setStatus(data.status);
    } catch (err) {
      console.error('重置模拟出错:', err);
      setError(err instanceof Error ? err.message : '重置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新设置
  const updateSettings = async (newSettings: Partial<SimulationSettings>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}?action=settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新设置失败');
      }
      
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      console.error('更新设置出错:', err);
      setError(err instanceof Error ? err.message : '更新设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 速度选项
  const speedOptions = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' }
  ];

  // 将秒数转换为时间字符串
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // 加载初始状态
  useEffect(() => {
    fetchStatus();
    
    // 定期刷新状态
    const intervalId = setInterval(fetchStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // 处理点击操作
  const handlePlayPause = () => {
    if (status === 'running') {
      pauseSimulation();
    } else {
      startSimulation();
    }
  };

  // 处理速度变更
  const handleSpeedChange = (speed: number) => {
    updateSettings({ timeScale: speed });
  };

  // 处理事件频率变更
  const handleEventFrequencyChange = (frequency: number) => {
    updateSettings({ eventFrequency: frequency });
  };

  // 切换调试模式
  const toggleDebugMode = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  return (
    <div className={`fixed left-4 bottom-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg ${className}`}>
      <div className="space-y-4">
        {/* 状态和时间显示 */}
        <div className="flex justify-between items-center">
          <div className="text-sm px-2 py-1 rounded-full" style={{ 
            backgroundColor: status === 'running' 
              ? 'rgba(34, 197, 94, 0.2)' 
              : status === 'paused' 
                ? 'rgba(234, 179, 8, 0.2)' 
                : 'rgba(100, 116, 139, 0.2)',
            color: status === 'running' 
              ? 'rgb(34, 197, 94)' 
              : status === 'paused' 
                ? 'rgb(234, 179, 8)' 
                : 'rgb(100, 116, 139)'
          }}>
            {status === 'running' ? '运行中' : status === 'paused' ? '已暂停' : '未启动'}
          </div>
          <div>
            <div className="text-sm text-gray-400">第 {dayCount} 天</div>
            <div className="text-xl font-bold">{formatTime(currentTime)}</div>
          </div>
          <div className="text-sm text-gray-400">
            {events.length > 0 ? `${events.length}个事件` : '无事件'}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 p-2 rounded text-xs">
            错误: {error}
          </div>
        )}

        <div className="flex items-center space-x-3">
          {/* 暂停/继续按钮 */}
          <button
            className={`px-3 py-1 rounded transition-colors ${
              status !== 'running' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : status !== 'running' ? '启动' : '暂停'}
          </button>

          {/* 速度控制 */}
          <div className="flex items-center space-x-1">
            <span className="text-xs">速度:</span>
            <select
              value={settings?.timeScale ?? 1}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="bg-gray-700 text-white text-xs px-1 py-1 rounded outline-none"
              disabled={isLoading || status === 'idle' || !settings}
            >
              {speedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 事件频率 */}
          <div className="flex items-center space-x-1">
            <span className="text-xs">事件:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings?.eventFrequency ?? 0.5}
              onChange={(e) => handleEventFrequencyChange(Number(e.target.value))}
              className="w-16 h-1"
              disabled={isLoading || status === 'idle' || !settings}
            />
            <span className="text-xs w-6">{((settings?.eventFrequency ?? 0.5) * 100).toFixed(0)}%</span>
          </div>

          {/* 重置按钮 */}
          <button
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors text-sm"
            onClick={resetSimulation}
            disabled={isLoading || status === 'idle'}
          >
            重置
          </button>
          
          {/* 调试开关 */}
          <button
            className={`px-3 py-1 rounded transition-colors text-xs ${
              showDebugInfo ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            onClick={toggleDebugMode}
          >
            {showDebugInfo ? '隐藏调试' : '显示调试'}
          </button>
        </div>
        
        {/* 调试信息 */}
        {showDebugInfo && systemInfo && (
          <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
            <div className="flex justify-between">
              <span>运行时间: {systemInfo.uptime}</span>
              <span>Agent数量: {systemInfo.agentCount}</span>
              <span>自动决策: {settings?.autoAgentDecisions === undefined ? '未知' : (settings.autoAgentDecisions ? '开启' : '关闭')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 