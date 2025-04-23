import React from 'react';
import { AgentState } from '@/types';
import clsx from 'clsx';

interface AgentStatusProps {
  state: AgentState;
}

const stateConfig = {
  [AgentState.IDLE]: {
    color: 'bg-gray-400',
    label: '空闲',
  },
  [AgentState.MOVING]: {
    color: 'bg-blue-400',
    label: '行走',
  },
  [AgentState.TALKING]: {
    color: 'bg-green-400',
    label: '对话',
  },
  [AgentState.INTERACTING]: {
    color: 'bg-teal-400',
    label: '交互',
  },
  [AgentState.WORKING]: {
    color: 'bg-yellow-400',
    label: '工作',
  },
  [AgentState.RESTING]: {
    color: 'bg-purple-400',
    label: '休息',
  },
};

export const AgentStatus: React.FC<AgentStatusProps> = ({ state }) => {
  const config = stateConfig[state] || stateConfig[AgentState.IDLE];

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(
          'w-2 h-2 rounded-full',
          config.color
        )}
      />
      <span className="text-sm text-gray-600">{config.label}</span>
    </div>
  );
}; 