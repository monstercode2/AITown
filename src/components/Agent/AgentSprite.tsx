import React from 'react';
import { Agent, AgentState } from '@/types';
import clsx from 'clsx';

interface AgentSpriteProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
  gridSize: number; // 格子大小
}

const stateColors = {
  [AgentState.IDLE]: 'bg-gray-400',
  [AgentState.MOVING]: 'bg-blue-400',
  [AgentState.TALKING]: 'bg-green-400',
  [AgentState.INTERACTING]: 'bg-teal-400',
  [AgentState.WORKING]: 'bg-yellow-400',
  [AgentState.RESTING]: 'bg-purple-400',
};

// 根据Agent状态返回对应的emoji小人
const getAgentEmoji = (state: AgentState): string => {
  switch (state) {
    case AgentState.IDLE:
      return '🧍'; // 站立的人
    case AgentState.MOVING:
      return '🚶'; // 走路的人
    case AgentState.TALKING:
      return '🗣️'; // 说话的人
    case AgentState.INTERACTING:
      return '👋'; // 挥手的人
    case AgentState.WORKING:
      return '👨‍💼'; // 工作的人
    case AgentState.RESTING:
      return '😴'; // 休息的人
    default:
      return '👤'; // 默认人形
  }
};

export const AgentSprite: React.FC<AgentSpriteProps> = ({
  agent,
  isSelected,
  onClick,
  gridSize
}) => {
  const { position, state } = agent;
  const stateColor = stateColors[state] || stateColors[AgentState.IDLE];
  const emoji = getAgentEmoji(state);
  
  // Agent尺寸（略小于格子）
  const agentSize = Math.floor(gridSize * 0.7);
  
  // 简化的位置计算 - 使用格子的中心点
  const centerX = position.x * gridSize + (gridSize - agentSize) / 2;
  const centerY = position.y * gridSize + (gridSize - agentSize) / 2;

  return (
    <div
      className={clsx(
        stateColor,
        'rounded-full',
        'flex items-center justify-center',
        'text-2xl',
        'border-2 border-white',
        isSelected && 'ring-4 ring-blue-500 ring-offset-2',
        'cursor-pointer hover:opacity-80 transition-opacity',
        'shadow-md',
        'pointer-events-auto'
      )}
      style={{
        left: `${centerX}px`,
        top: `${centerY}px`,
        width: `${agentSize}px`,
        height: `${agentSize}px`,
        position: 'absolute',
        lineHeight: 1,
      }}
      onClick={onClick}
      title={agent.name}
    >
      {emoji}
    </div>
  );
}; 