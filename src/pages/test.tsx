import React, { useState, useEffect } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useGridStore } from '@/store/gridStore';
import { useEventStore } from '@/store/eventStore';
import { useTimeStore } from '@/store/timeStore';
import { Logger, LogCategory, LogLevel } from '@/utils/logger';
import { EventType, EventScope } from '@/types/event';

/**
 * 系统测试页面
 * 用于测试 AI 小镇系统的各个组件功能
 */
export default function TestPage() {
  const agentStore = useAgentStore();
  const gridStore = useGridStore();
  const eventStore = useEventStore();
  const timeStore = useTimeStore();
  
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'success' | 'failure' | 'pending';
    message?: string;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // 测试：初始化网格
  const testInitGrid = () => {
    try {
      // 检查网格是否已初始化
      if (!gridStore.grid) {
        // 假设initializeGrid不需要参数或使用默认值
        gridStore.initializeGrid();
      }
      
      const grid = gridStore.grid;
      Logger.info(LogCategory.TEST, '网格初始化测试', { 
        size: `${grid.width}x${grid.height}`,
        tileCount: grid.tiles.flat().length 
      });
      
      return {
        name: '初始化网格',
        status: 'success' as const,
        message: `网格大小: ${grid.width}x${grid.height}`
      };
    } catch (error) {
      Logger.error(LogCategory.TEST, '网格初始化失败', error);
      return {
        name: '初始化网格',
        status: 'failure' as const,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  // 测试：初始化Agent
  const testInitAgents = () => {
    try {
      agentStore.initializeAgents();
      const agents = agentStore.getAllAgents();
      
      Logger.info(LogCategory.TEST, 'Agent初始化测试', { 
        count: agents.length,
        agentIds: agents.map(a => a.id)
      });
      
      return {
        name: '初始化Agent',
        status: 'success' as const,
        message: `初始化了 ${agents.length} 个Agent`
      };
    } catch (error) {
      Logger.error(LogCategory.TEST, 'Agent初始化失败', error);
      return {
        name: '初始化Agent',
        status: 'failure' as const,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  // 测试：时间系统
  const testTimeSystem = () => {
    try {
      const initialTime = timeStore.currentTime;
      timeStore.incrementTime(3600); // 增加1小时
      const newTime = timeStore.currentTime;
      
      Logger.info(LogCategory.TEST, '时间系统测试', { 
        initialTime,
        newTime,
        difference: newTime - initialTime
      });
      
      return {
        name: '时间系统',
        status: 'success' as const,
        message: `时间增加了 ${newTime - initialTime} 秒`
      };
    } catch (error) {
      Logger.error(LogCategory.TEST, '时间系统测试失败', error);
      return {
        name: '时间系统',
        status: 'failure' as const,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  // 测试：事件系统
  const testEventSystem = () => {
    try {
      const initialCount = eventStore.events.length;
      
      // 创建测试事件
      eventStore.addEvent({
        id: `test-${Date.now()}`,
        type: EventType.TOWN,
        scope: EventScope.GLOBAL,
        description: '这是一个测试事件',
        affectedAgents: [],
        startTime: Date.now(),
        duration: 60000,
        impact: {} // 添加空的impact对象
      });
      
      const newCount = eventStore.events.length;
      
      Logger.info(LogCategory.TEST, '事件系统测试', { 
        initialCount,
        newCount,
        difference: newCount - initialCount
      });
      
      return {
        name: '事件系统',
        status: 'success' as const,
        message: `添加事件成功，当前共有 ${newCount} 个事件`
      };
    } catch (error) {
      Logger.error(LogCategory.TEST, '事件系统测试失败', error);
      return {
        name: '事件系统',
        status: 'failure' as const,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  // 测试：API连接
  const testAPIConnection = async () => {
    try {
      const response = await fetch('/api/simulation');
      
      if (!response.ok) {
        throw new Error(`API响应错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      Logger.info(LogCategory.TEST, 'API连接测试', { 
        status: response.status,
        data
      });
      
      return {
        name: 'API连接',
        status: 'success' as const,
        message: `连接成功，模拟状态: ${data.status}`
      };
    } catch (error) {
      Logger.error(LogCategory.TEST, 'API连接测试失败', error);
      return {
        name: 'API连接',
        status: 'failure' as const,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setLogs([]);
    
    // 捕获日志
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev, args.join(' ')]);
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      setLogs(prev => [...prev, `错误: ${args.join(' ')}`]);
      originalConsoleError(...args);
    };
    
    try {
      // 依次运行测试
      const tests = [
        { name: '初始化网格', test: testInitGrid },
        { name: '初始化Agent', test: testInitAgents },
        { name: '时间系统', test: testTimeSystem },
        { name: '事件系统', test: testEventSystem },
        { name: 'API连接', test: testAPIConnection }
      ];
      
      for (const testInfo of tests) {
        setTestResults(prev => [
          ...prev, 
          { name: testInfo.name, status: 'pending' }
        ]);
        
        // 等待一小段时间使UI更新
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await testInfo.test();
        
        setTestResults(prev => prev.map(item => 
          item.name === testInfo.name ? result : item
        ));
        
        // 如果测试失败，停止后续测试
        if (result.status === 'failure') {
          break;
        }
        
        // 测试之间的间隔
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      setIsRunning(false);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: 'success' | 'failure' | 'pending') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failure':
        return '❌';
      case 'pending':
        return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI小镇系统测试</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">系统组件测试</h2>
            <button
              className={`px-4 py-2 rounded transition-colors ${
                isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              onClick={runAllTests}
              disabled={isRunning}
            >
              {isRunning ? '测试运行中...' : '运行所有测试'}
            </button>
          </div>
          
          <div className="space-y-3">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">点击"运行所有测试"按钮开始测试</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">{getStatusIcon(result.status)}</span>
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <span className={
                      result.status === 'success' ? 'text-green-600' :
                      result.status === 'failure' ? 'text-red-600' : 'text-yellow-600'
                    }>
                      {result.status === 'pending' ? '测试中...' : result.status === 'success' ? '通过' : '失败'}
                    </span>
                  </div>
                  {result.message && (
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">系统日志</h2>
            <button
              className="text-blue-600 hover:text-blue-800"
              onClick={() => setLogsVisible(!logsVisible)}
            >
              {logsVisible ? '隐藏' : '显示'}
            </button>
          </div>
          
          {logsVisible && (
            <div className="bg-gray-800 text-gray-200 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">暂无日志</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="pb-1 border-b border-gray-700 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            返回主页
          </a>
        </div>
      </div>
    </div>
  );
} 