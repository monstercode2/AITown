import React, { useState } from 'react';
import { Agent, AgentState } from '@/types/agent';
import { MemoryViewer } from '../Agent/MemoryViewer';

interface AgentListProps {
  agents: Agent[];
  onSelectAgent?: (agentId: string) => void;
  className?: string;
}

/**
 * Agent列表组件
 * 显示小镇中所有Agent的信息和状态
 */
export const AgentList: React.FC<AgentListProps> = ({ 
  agents, 
  onSelectAgent,
  className = '' 
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showMemories, setShowMemories] = useState<boolean>(false);
  
  // 当前选中的Agent
  const selectedAgent = selectedAgentId 
    ? agents.find(agent => agent.id === selectedAgentId) 
    : null;

  // 获取Agent状态的样式
  const getStateStyle = (state: AgentState) => {
    switch(state) {
      case AgentState.MOVING:
        return 'bg-blue-100 text-blue-800';
      case AgentState.TALKING:
        return 'bg-green-100 text-green-800';
      case AgentState.INTERACTING:
        return 'bg-purple-100 text-purple-800';
      case AgentState.WORKING:
        return 'bg-amber-100 text-amber-800';
      case AgentState.RESTING:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // 处理Agent点击
  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId);
    if (onSelectAgent) {
      onSelectAgent(agentId);
    }
  };

  // 打开记忆查看器
  const handleViewMemories = () => {
    setShowMemories(true);
  };

  // 关闭记忆查看器
  const handleCloseMemories = () => {
    setShowMemories(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">小镇居民列表</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Agent列表 */}
        <div className="divide-y">
          {agents.map(agent => (
            <div 
              key={agent.id}
              className={`py-3 px-2 cursor-pointer transition-colors ${
                selectedAgentId === agent.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleAgentClick(agent.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-gray-600">
                    {agent.personality || '没有性格描述'}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getStateStyle(agent.state)}`}>
                  {agent.state}
                </span>
              </div>
              {agent.currentAction && (
                <div className="text-sm mt-1 text-gray-600">
                  正在: {agent.currentAction}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 选中Agent的详细信息 */}
      {selectedAgent && (
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium mb-2">{selectedAgent.name} 详情</h3>
            <button
              onClick={handleViewMemories}
              className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              查看记忆
            </button>
          </div>
          
          {/* 状态和属性 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500">心情</div>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      selectedAgent.attributes.mood > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.abs(selectedAgent.attributes.mood)}%` 
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-sm">
                  {selectedAgent.attributes.mood}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">精力</div>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${selectedAgent.attributes.energy}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm">
                  {selectedAgent.attributes.energy}
                </span>
              </div>
            </div>
          </div>
          
          {/* 特征列表 */}
          {selectedAgent.traits && selectedAgent.traits.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">特征</div>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.traits.map((trait, index) => (
                  <span 
                    key={index}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 关系列表 */}
          {selectedAgent.relationships.size > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-1">关系</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(selectedAgent.relationships.entries()).map(([id, relationship]) => {
                  const relatedAgent = agents.find(a => a.id === id);
                  if (!relatedAgent) return null;
                  
                  return (
                    <div 
                      key={id} 
                      className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
                    >
                      <span>{relatedAgent.name}</span>
                      <div className="flex items-center">
                        <span 
                          className={`px-2 py-0.5 rounded ${
                            relationship.affinity > 0 
                              ? 'bg-green-100 text-green-800' 
                              : relationship.affinity < 0 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {relationship.affinity > 0 ? '+' : ''}{relationship.affinity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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