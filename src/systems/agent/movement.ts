import { Position, GridSize } from '../../types/grid';
import { Agent } from '@/types/agent';

/**
 * 移动方向枚举
 */
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

/**
 * 方向对应的位置变化
 */
export const DIRECTION_VECTORS: Record<Direction, Position> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
};

/**
 * 检查位置是否在网格范围内
 */
export function isWithinGrid(position: Position, gridSize: GridSize): boolean {
  return (
    position.x >= 0 &&
    position.x < gridSize.width &&
    position.y >= 0 &&
    position.y < gridSize.height
  );
}

/**
 * 获取给定方向上的下一个位置
 */
export function getNextPosition(currentPos: Position, direction: Direction): Position {
  const nextPos = { ...currentPos };
  
  switch (direction) {
    case Direction.UP:
      nextPos.y -= 1;
      break;
    case Direction.DOWN:
      nextPos.y += 1;
      break;
    case Direction.LEFT:
      nextPos.x -= 1;
      break;
    case Direction.RIGHT:
      nextPos.x += 1;
      break;
  }
  
  return nextPos;
}

/**
 * 尝试移动到新位置
 * 如果移动有效则返回新位置，否则返回当前位置
 */
export function tryMove(
  currentPos: Position,
  direction: Direction,
  gridSize: GridSize,
  isPositionOccupied: (pos: Position) => boolean
): Position {
  const nextPos = getNextPosition(currentPos, direction);
  
  if (isWithinGrid(nextPos, gridSize) && !isPositionOccupied(nextPos)) {
    return nextPos;
  }
  
  return currentPos;
}

/**
 * 检查位置是否被占用
 * @param pos 位置
 * @param agents 所有Agent
 * @returns 是否被占用
 */
export const isPositionOccupied = (
  pos: Position,
  agents: Agent[]
): boolean => {
  return agents.some(
    (agent) => agent.position.x === pos.x && agent.position.y === pos.y
  );
};

/**
 * 尝试移动Agent
 * @param agent 要移动的Agent
 * @param direction 移动方向
 * @param gridWidth 地图宽度
 * @param gridHeight 地图高度
 * @param agents 所有Agent
 * @returns 如果移动成功返回新位置，否则返回null
 */
export const tryMoveAgent = (
  agent: Agent,
  direction: Direction,
  gridWidth: number,
  gridHeight: number,
  agents: Agent[]
): Position | null => {
  const newPos = getNextPosition(agent.position, direction);
  
  if (
    !isWithinGrid(newPos, { width: gridWidth, height: gridHeight }) ||
    isPositionOccupied(newPos, agents)
  ) {
    return null;
  }
  
  return newPos;
}; 