import React from 'react';
import { useGridStore } from '@/store/gridStore';
import { Tile } from './Tile';
import { Position } from '@/types';

export const GridContainer: React.FC = () => {
  const { grid, selectedTile, selectTile } = useGridStore();

  const handleTileClick = (position: Position) => {
    selectTile(position);
  };

  return (
    <div className="relative p-4 bg-white rounded-lg shadow-md">
      <div
        className="grid gap-0 border-2 border-gray-500"
        style={{
          gridTemplateColumns: `repeat(${grid.width}, var(--tile-size))`,
          gridTemplateRows: `repeat(${grid.height}, var(--tile-size))`,
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
