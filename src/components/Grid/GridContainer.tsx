import React from 'react';
import { useGridStore } from '@/store/gridStore';
import { Tile } from './Tile';
import { Position } from '@/types';
import { TILE_SIZE } from './constants';

export const GridContainer: React.FC = () => {
  const { grid, selectedTile, selectTile } = useGridStore();

  const handleTileClick = (position: Position) => {
    selectTile(position);
  };

  const containerWidth = grid.width * TILE_SIZE;
  const containerHeight = grid.height * TILE_SIZE;

  return (
    <div className="relative p-4 bg-white rounded-lg shadow-md">
      <div 
        className="relative border-2 border-gray-500"
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          display: 'grid',
          gridTemplateColumns: `repeat(${grid.width}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${grid.height}, ${TILE_SIZE}px)`,
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
    </div>
  );
};
