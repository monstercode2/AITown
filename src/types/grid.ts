// 格子类型枚举
export enum TileType {
  GROUND = 'GROUND',    // 普通地面
  HOUSE = 'HOUSE',      // 房屋
  SHOP = 'SHOP',        // 商店
  PARK = 'PARK',        // 公园
  ROAD = 'ROAD',        // 道路
}

/**
 * 网格位置接口
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 网格大小接口
 */
export interface GridSize {
  width: number;
  height: number;
}

// 格子接口
export interface Tile {
  type: TileType;
  position: Position;
  isWalkable: boolean;
  occupiedBy?: string;  // Agent的ID，如果有Agent在此格子上
}

// 地图接口
export interface Grid {
  width: number;
  height: number;
  tiles: Tile[][];
} 