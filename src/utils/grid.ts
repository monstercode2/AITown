import { Position, TileType } from '@/types';
import { INITIAL_MAP_LAYOUT, TERRAIN_CONFIG } from '@/components/Grid/constants';

/**
 * 获取指定坐标的格子类型
 * @param position 坐标
 * @returns 格子类型，如果坐标超出范围则返回undefined
 */
export const getTileTypeAtPosition = (position: Position): TileType | undefined => {
  const { x, y } = position;
  
  // 检查坐标是否在地图范围内
  if (y < 0 || y >= INITIAL_MAP_LAYOUT.length || 
      x < 0 || x >= INITIAL_MAP_LAYOUT[0].length) {
    return undefined;
  }
  
  return INITIAL_MAP_LAYOUT[y][x];
};

/**
 * 检查指定坐标是否可行走
 * @param position 坐标
 * @returns 是否可行走
 */
export const isPositionWalkable = (position: Position): boolean => {
  const tileType = getTileTypeAtPosition(position);
  
  if (!tileType) {
    return false; // 坐标超出范围，不可行走
  }
  
  return TERRAIN_CONFIG[tileType].isWalkable;
};

/**
 * 打印格子类型映射表，用于调试
 */
export const printGridMap = (): void => {
  console.log('===== 地图格子类型映射 =====');
  for (let y = 0; y < INITIAL_MAP_LAYOUT.length; y++) {
    let row = '';
    for (let x = 0; x < INITIAL_MAP_LAYOUT[y].length; x++) {
      const type = INITIAL_MAP_LAYOUT[y][x];
      const walkable = TERRAIN_CONFIG[type].isWalkable;
      row += `(${x},${y}):${type.substring(0, 1)}${walkable ? '✓' : '✗'} `;
    }
    console.log(row);
  }
  console.log('==========================');
}; 