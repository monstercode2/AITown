import { Tile as TileType } from '@/types';
import { TERRAIN_CONFIG, TILE_SIZE } from './constants';
import clsx from 'clsx';
import { TileType as TileEnum } from '@/types/grid';

interface TileProps {
  tile: TileType;
  isSelected?: boolean;
  onClick?: () => void;
}

export const Tile: React.FC<TileProps> = ({ tile, isSelected, onClick }) => {
  const terrainConfig = TERRAIN_CONFIG[tile.type];
  
  // 添加emoji图标来表示不同类型的地形
  const tileEmoji: Record<string, string> = {
    'GROUND': '🌱',
    'HOUSE': '🏠',
    'SHOP': '🏪',
    'PARK': '🌳',
    'ROAD': '🛣️',
  };

  return (
    <div
      className={clsx(
        terrainConfig.color,
        'flex items-center justify-center border-2 border-gray-400',
        isSelected && 'ring-2 ring-blue-500 z-20',
        !tile.isWalkable && 'cursor-not-allowed',
        'cursor-pointer hover:opacity-80 transition-all'
      )}
      style={{
        width: `${TILE_SIZE}px`,
        height: `${TILE_SIZE}px`,
      }}
      onClick={onClick}
    >
      <span className="text-lg opacity-70">{tileEmoji[tile.type]}</span>
    </div>
  );
}; 