import { TileType } from '../../types/grid';

// 地图尺寸
export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 10;
export const TILE_SIZE = 48; // px，与CSS变量--tile-size保持一致

// 地形配置
export const TERRAIN_CONFIG = {
  [TileType.GROUND]: {
    color: 'bg-green-200',
    isWalkable: true,
  },
  [TileType.HOUSE]: {
    color: 'bg-yellow-300',
    isWalkable: false,
  },
  [TileType.SHOP]: {
    color: 'bg-blue-300',
    isWalkable: false,
  },
  [TileType.PARK]: {
    color: 'bg-green-400',
    isWalkable: true,
  },
  [TileType.ROAD]: {
    color: 'bg-gray-400',
    isWalkable: true,
  },
} as const;

// 初始地图布局
export const INITIAL_MAP_LAYOUT = [
  [TileType.HOUSE, TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.SHOP,  TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.HOUSE, TileType.PARK],
  [TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.ROAD],
  [TileType.HOUSE, TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.SHOP,  TileType.ROAD,  TileType.HOUSE, TileType.PARK],
  [TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.ROAD],
  [TileType.SHOP,  TileType.ROAD,  TileType.PARK,  TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.SHOP,  TileType.PARK],
  [TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.ROAD],
  [TileType.HOUSE, TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.SHOP,  TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.HOUSE, TileType.PARK],
  [TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.GROUND,TileType.ROAD,  TileType.ROAD],
  [TileType.SHOP,  TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.HOUSE, TileType.ROAD,  TileType.SHOP,  TileType.ROAD,  TileType.HOUSE, TileType.PARK],
  [TileType.PARK,  TileType.ROAD,  TileType.PARK,  TileType.ROAD,  TileType.PARK,  TileType.ROAD,  TileType.PARK,  TileType.ROAD,  TileType.PARK,  TileType.PARK],
]; 