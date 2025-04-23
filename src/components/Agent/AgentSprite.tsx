import React, { useEffect, useState } from 'react';
import { Agent, AgentState } from '@/types';
import clsx from 'clsx';

interface AgentSpriteProps {
  agent: Agent;
  isSelected?: boolean;
  onClick?: () => void;
}

const stateColors = {
  [AgentState.IDLE]: 'bg-gray-400',
  [AgentState.MOVING]: 'bg-blue-400',
  [AgentState.TALKING]: 'bg-green-400',
  [AgentState.INTERACTING]: 'bg-teal-400',
  [AgentState.WORKING]: 'bg-yellow-400',
  [AgentState.RESTING]: 'bg-purple-400',
};

export const AgentSprite: React.FC<AgentSpriteProps> = ({
  agent,
  isSelected,
  onClick,
}) => {
  const { position, state } = agent;
  const stateColor = stateColors[state] || stateColors[AgentState.IDLE];
  
  // 默认使用配置的tile大小
  const tileSizeNum = 48; // 与CSS中的--tile-size保持一致

  return (
    <div
      className={clsx(
        'agent',
        stateColor,
        'rounded-full',
        'flex items-center justify-center',
        'text-white font-bold text-lg', 
        isSelected && 'ring-4 ring-blue-500 ring-offset-2',
        'cursor-pointer hover:opacity-80 transition-opacity',
        'shadow-md'
      )}
      style={{
        transform: `translate(calc(${position.x} * var(--tile-size)), calc(${position.y} * var(--tile-size)))`,
      }}
      onClick={onClick}
    >
      {agent.name[0]}
    </div>
  );
}; 