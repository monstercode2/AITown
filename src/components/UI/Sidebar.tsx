import React, { useState, useEffect } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useEventStore } from '@/store/eventStore';
import { Agent, AgentState } from '@/types/agent';
import { AgentInfo } from '../Agent/AgentInfo';
import { Memory } from '@/types/memory';
import { MemoryViewer } from '../Agent/MemoryViewer';
import { Logger, LogCategory } from '@/utils/logger';

interface SidebarProps {
  className?: string;
  onFollowAgent?: (agentId: string | null) => void;
}

/**
 * 侧边栏组件
 * 显示Agent列表、Agent详情和事件日志
 */
export const Sidebar: React.FC<SidebarProps> = ({ 
  className = '',
  onFollowAgent
}) => {
  // 从store获取数据
  const agentStore = useAgentStore();
  const eventStore = useEventStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'memory' | 'relations'>('info');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  // 获取当前选中的Agent
  const selectedAgent = selectedAgentId ? agentStore.getAgent(selectedAgentId) : null;
  const agents = agentStore.getAllAgents();

  // 选择Agent
  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab('info');
    
    // 如果之前在跟随其他Agent，取消跟随
    if (isFollowing && selectedAgentId !== agentId) {
      setIsFollowing(false);
      if (onFollowAgent) onFollowAgent(null);
    }
    
    Logger.info(LogCategory.UI, `用户选择了Agent: ${agentId}`);
  };

  // 跟随Agent
  const toggleFollowAgent = () => {
    if (!selectedAgentId) return;
    
    const newFollowState = !isFollowing;
    setIsFollowing(newFollowState);
    
    if (onFollowAgent) {
      onFollowAgent(newFollowState ? selectedAgentId : null);
    }
    
    Logger.info(LogCategory.UI, 
      newFollowState 
        ? `开始跟随Agent: ${selectedAgentId}` 
        : `停止跟随Agent: ${selectedAgentId}`
    );
  };

  // 打开记忆查看器
  const handleViewAllMemories = () => {
    setShowMemories(true);
  };

  // 关闭记忆查看器
  const handleCloseMemories = () => {
    setShowMemories(false);
  };

  // 获取Agent的状态图标
  const getStateIcon = (state: AgentState) => {
    switch(state) {
      case AgentState.MOVING:
        return '🚶';
      case AgentState.TALKING:
        return '💬';
      case AgentState.INTERACTING:
        return '🤝';
      case AgentState.WORKING:
        return '🔨';
      case AgentState.RESTING:
        return '😴';
      default:
        return '🧍';
    }
  };

  // 获取Agent的心情表情
  const getMoodEmoji = (mood: number = 50) => {
    if (mood >= 80) return '😊';
    if (mood >= 60) return '🙂';
    if (mood >= 40) return '😐';
    if (mood >= 20) return '🙁';
    return '😢';
  };

  // 获取Agent的能量条颜色
  const getEnergyColor = (energy: number = 50) => {
    if (energy >= 80) return 'bg-green-500';
    if (energy >= 60) return 'bg-green-400';
    if (energy >= 40) return 'bg-yellow-400';
    if (energy >= 20) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // 渲染记忆选项卡
  const renderMemoryTab = () => {
    if (!selectedAgent) return null;
    
    return (
      <div className="space-y-2 mt-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-400">记忆</h4>
          <button
            onClick={handleViewAllMemories}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            查看全部
          </button>
        </div>
        
        {selectedAgent.memories.length === 0 ? (
          <p className="text-sm text-gray-500">暂无记忆</p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {selectedAgent.memories.slice(-5).reverse().map((memory) => (
              <div key={memory.id} className="text-sm p-2 bg-gray-700 rounded">
                <div className="font-medium">{memory.content.substring(0, 50)}{memory.content.length > 50 ? '...' : ''}</div>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                  <span>重要程度: {memory.importance}</span>
                  <span>
                    {new Date(memory.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {memory.emotion && (
                  <div className="text-xs text-gray-400 mt-1">
                    情感: {memory.emotion}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 渲染关系选项卡
  const renderRelationsTab = () => {
    if (!selectedAgent) return null;
    
    const relationships = selectedAgent.relationships;
    
    return (
      <div className="space-y-2 mt-2">
        <h4 className="text-sm font-medium text-gray-400">关系网络</h4>
        {relationships.size === 0 ? (
          <p className="text-sm text-gray-500">暂无关系</p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {Array.from(relationships.entries()).map(([targetId, relation]) => {
              const targetAgent = agentStore.getAgent(targetId);
              if (!targetAgent) return null;
              
              return (
                <div 
                  key={targetId} 
                  className="text-sm p-2 bg-gray-700 rounded flex justify-between items-center cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSelectAgent(targetId)}
                >
                  <span className="font-medium">{targetAgent.name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    relation.affinity > 50 ? 'bg-green-900' :
                    relation.affinity > 0 ? 'bg-blue-900' :
                    relation.affinity > -50 ? 'bg-orange-900' : 'bg-red-900'
                  }`}>
                    {relation.affinity > 80 ? '喜爱' :
                     relation.affinity > 50 ? '友好' :
                     relation.affinity > 20 ? '熟悉' :
                     relation.affinity > -20 ? '中立' :
                     relation.affinity > -50 ? '不喜欢' : '敌对'}
                    ({relation.affinity})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 根据Agent状态获取样式
  const getAgentStatusStyle = (state: AgentState) => {
    switch(state) {
      case AgentState.MOVING:
        return 'bg-blue-700';
      case AgentState.TALKING:
        return 'bg-green-700';
      case AgentState.INTERACTING:
        return 'bg-purple-700';
      case AgentState.WORKING:
        return 'bg-amber-700';
      case AgentState.RESTING:
        return 'bg-gray-700';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-full w-64 bg-gray-800 text-white p-4 overflow-y-auto ${className}`}>
      <h2 className="text-xl font-bold mb-4">AI小镇</h2>
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-2 bg-red-900 bg-opacity-50 rounded text-xs">
          {error}
        </div>
      )}
      
      {/* Agent列表 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">居民列表</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedAgentId === agent.id ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => handleSelectAgent(agent.id)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{agent.name}</span>
                <span className="text-sm">{getStateIcon(agent.state)}</span>
              </div>
              <div className="text-sm text-gray-400 flex justify-between">
                <span>({agent.position.x}, {agent.position.y})</span>
                <span className={`px-1 rounded text-xs ${getAgentStatusStyle(agent.state)}`}>
                  {agent.state}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 选中的Agent信息 */}
      {selectedAgent && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">
              {selectedAgent.name}
              {selectedAgent.personality && (
                <span className="ml-2 text-xs text-gray-400">{selectedAgent.personality}</span>
              )}
            </h3>
            <button
              onClick={toggleFollowAgent}
              className={`text-xs px-2 py-1 rounded ${
                isFollowing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isFollowing ? '停止跟随' : '跟随'}
            </button>
          </div>
          
          {/* 选项卡 */}
          <div className="flex border-b border-gray-700 mb-3">
            <button
              className={`px-3 py-1 text-sm ${activeTab === 'info' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              信息
            </button>
            <button
              className={`px-3 py-1 text-sm ${activeTab === 'memory' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('memory')}
            >
              记忆
            </button>
            <button
              className={`px-3 py-1 text-sm ${activeTab === 'relations' ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab('relations')}
            >
              关系
            </button>
          </div>
          
          {/* 选项卡内容 */}
          {activeTab === 'info' && <AgentInfo agent={selectedAgent} />}
          {activeTab === 'memory' && renderMemoryTab()}
          {activeTab === 'relations' && renderRelationsTab()}
          
          {/* 当前行动 */}
          {selectedAgent.currentAction && (
            <div className="mt-3 p-2 bg-gray-700 rounded text-sm">
              <span className="text-xs text-gray-400">当前行动：</span>
              <p>{selectedAgent.currentAction}</p>
            </div>
          )}
        </div>
      )}
      
      {/* 记忆查看器 */}
      {showMemories && selectedAgent && (
        <MemoryViewer
          memories={selectedAgent.memories}
          onClose={handleCloseMemories}
        />
      )}
    </div>
  );
}; 