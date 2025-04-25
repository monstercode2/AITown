import { useEffect, useState } from 'react';
import { useGridStore } from '@/store/gridStore';
import { useAgentStore } from '@/store/agentStore';
import { useEventStore } from '@/store/eventStore';
import { AgentInfo } from '@/components/Agent/AgentInfo';
import { EventLog } from '@/components/UI/EventLog';
import { AgentList } from '@/components/UI/AgentList';
import { Controls } from '@/components/UI/Controls';
import TimeDisplay from '@/components/UI/TimeDisplay';
import { GameMap } from '@/components/Grid/GameMap';
import Link from 'next/link';

export default function Home() {
  const initializeGrid = useGridStore((state) => state.initializeGrid);
  const { getAgent, getAllAgents, initializeAgents } = useAgentStore();
  const events = useEventStore((state) => state.events);
  const fetchEvents = useEventStore((state) => state.fetchEvents);
  const [activeTab, setActiveTab] = useState<'agents' | 'events'>('agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    // 初始化地图
    initializeGrid();
    
    // 初始化Agent
    initializeAgents();
    // 定时拉取事件
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [initializeGrid, initializeAgents, fetchEvents]);

  const selectedAgent = selectedAgentId ? getAgent(selectedAgentId) : null;
  const agentList = getAllAgents();
  
  const selectAgent = (agentId: string | null) => {
    setSelectedAgentId(agentId);
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-hidden">
      {/* 时间显示 */}
      <div className="absolute top-4 right-4 z-10">
        <TimeDisplay />
      </div>
      
      <div className="container mx-auto p-4 relative">
        <h1 className="text-2xl font-bold mb-4 flex items-center">
          <span>AI Town</span>
          <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            模拟中
          </span>
          <Link 
            href="/test"
            className="ml-auto text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded hover:bg-purple-200 transition-colors"
          >
            系统测试
          </Link>
        </h1>
        
        <div className="flex gap-4">
          {/* 左侧：地图和Agent */}
          <div className="flex-grow relative">
            {/* 使用新的GameMap组件 */}
            <GameMap
              onSelectAgent={selectAgent}
              selectedAgentId={selectedAgentId}
            />
            
            {/* 模拟控制 */}
            <Controls className="mt-4" />
          </div>

          {/* 右侧：Tab栏和信息面板 */}
          <div className="w-96">
            {/* Tab导航 */}
            <div className="flex border-b mb-4">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'agents'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('agents')}
              >
                居民
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === 'events'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('events')}
              >
                事件
              </button>
            </div>

            {/* 内容区域 */}
            <div className="h-[calc(100vh-160px)] overflow-hidden">
              {activeTab === 'agents' ? (
                <AgentList 
                  agents={agentList} 
                  onSelectAgent={selectAgent}
                  className="h-full overflow-y-auto"
                />
              ) : (
                <EventLog 
                  events={events}
                  className="h-full overflow-y-auto"
                  maxDisplayCount={50}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* 选中Agent的详细信息 */}
        {selectedAgent && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 border-t transform transition-transform duration-300 z-20">
            <div className="container mx-auto">
              <div className="flex justify-between items-start">
                <AgentInfo agent={selectedAgent} />
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => selectAgent(null)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 