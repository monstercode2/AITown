import React from 'react';
import { useGridStore } from '@/store/gridStore';
import { useAgentStore } from '@/store/agentStore';
import { Tile } from './Tile';
import { AgentSprite } from '@/components/Agent/AgentSprite';
import { Position } from '@/types';
import { TILE_SIZE } from './constants';

interface GameMapProps {
  onSelectAgent: (agentId: string | null) => void;
  selectedAgentId: string | null;
}

export const GameMap: React.FC<GameMapProps> = ({ onSelectAgent, selectedAgentId }) => {
  const { grid, selectedTile, selectTile } = useGridStore();
  const { getAllAgents } = useAgentStore();
  const agentList = getAllAgents();

  const handleTileClick = (position: Position) => {
    selectTile(position);
  };

  const containerWidth = grid.width * TILE_SIZE;
  const containerHeight = grid.height * TILE_SIZE;

  return (
    <div className="relative bg-white rounded-lg shadow-md p-4">
      <div 
        className="relative"
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
        }}
      >
        {/* 网格层 - 背景层 */}
        <div 
          className="absolute top-0 left-0 w-full h-full border-2 border-gray-500"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${grid.width}, ${TILE_SIZE}px)`,
            gridTemplateRows: `repeat(${grid.height}, ${TILE_SIZE}px)`,
            zIndex: 10,
          }}
        >
          {grid.tiles.map((row, y) =>
            row.map((tile, x) => (
              <Tile
                key={`${x}-${y}`}
                tile={tile}
                isSelected={
                  selectedTile?.x === x && selectedTile?.y === y
                }
                onClick={() => handleTileClick({ x, y })}
              />
            ))
          )}
        </div>

        {/* Agent层 - 前景层 */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            zIndex: 20,
          }}
        >
          {agentList.map((agent) => (
            <AgentSprite
              key={agent.id}
              agent={agent}
              isSelected={agent.id === selectedAgentId}
              onClick={() => onSelectAgent(agent.id)}
              gridSize={TILE_SIZE}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 