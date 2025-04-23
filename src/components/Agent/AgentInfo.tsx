import React from 'react';
import { Agent } from '@/types';
import { AgentStatus } from './AgentStatus';

interface AgentInfoProps {
  agent: Agent;
}

export const AgentInfo: React.FC<AgentInfoProps> = ({ agent }) => {
  const { name, attributes, state, memories } = agent;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-xl font-bold">{name}</div>
        <AgentStatus state={state} />
      </div>

      <div className="space-y-4">
        {/* 属性状态 */}
        <div>
          <h3 className="font-semibold mb-2">状态</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-sm text-gray-600">精力</div>
              <div className="font-medium">{attributes.energy}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">心情</div>
              <div className="font-medium">{attributes.mood}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">社交</div>
              <div className="font-medium">{attributes.sociability}</div>
            </div>
          </div>
        </div>

        {/* 最近记忆 */}
        <div>
          <h3 className="font-semibold mb-2">最近记忆</h3>
          <div className="space-y-2">
            {memories.slice(-3).map((memory) => (
              <div
                key={memory.id}
                className="text-sm p-2 rounded bg-gray-50"
              >
                <div className="text-gray-600">
                  {new Date(memory.timestamp).toLocaleTimeString()}
                </div>
                <div>{memory.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 