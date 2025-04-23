import { Position } from '@/types/grid';
import { Grid, Tile } from '@/types/grid';

/**
 * 寻路节点接口
 */
interface PathNode {
  position: Position;
  gCost: number;  // 从起点到当前节点的实际代价
  hCost: number;  // 从当前节点到终点的估计代价
  fCost: number;  // gCost + hCost
  parent: PathNode | null;
  walkable: boolean;
}

/**
 * 计算曼哈顿距离
 * @param a 起点
 * @param b 终点
 * @returns 曼哈顿距离
 */
export function calculateManhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * 创建寻路节点
 * @param grid 网格
 * @returns 寻路节点二维数组
 */
function createNodes(grid: Grid): PathNode[][] {
  return grid.tiles.map((row, y) => 
    row.map((tile, x) => ({
      position: { x, y },
      gCost: Infinity,
      hCost: 0,
      fCost: Infinity,
      parent: null,
      walkable: tile.isWalkable && !tile.occupiedBy
    }))
  );
}

/**
 * 获取节点邻居
 * @param node 当前节点
 * @param grid 网格
 * @param nodes 节点数组
 * @returns 邻居节点数组
 */
function getNeighbors(node: PathNode, grid: Grid, nodes: PathNode[][]): PathNode[] {
  const neighbors: PathNode[] = [];
  const { x, y } = node.position;
  
  // 四个方向
  const directions = [
    { dx: 0, dy: -1 }, // 上
    { dx: 1, dy: 0 },  // 右
    { dx: 0, dy: 1 },  // 下
    { dx: -1, dy: 0 }, // 左
  ];
  
  for (const dir of directions) {
    const newX = x + dir.dx;
    const newY = y + dir.dy;
    
    // 检查是否在网格范围内
    if (newX >= 0 && newX < grid.width && newY >= 0 && newY < grid.height) {
      neighbors.push(nodes[newY][newX]);
    }
  }
  
  return neighbors;
}

/**
 * 重建路径
 * @param endNode 终点节点
 * @returns 路径数组
 */
function reconstructPath(endNode: PathNode): Position[] {
  const path: Position[] = [];
  let currentNode: PathNode | null = endNode;
  
  while (currentNode) {
    path.unshift(currentNode.position);
    currentNode = currentNode.parent;
  }
  
  return path;
}

/**
 * A*寻路算法
 * @param grid 网格
 * @param startPos 起点
 * @param endPos 终点
 * @returns 路径数组，如果没有路径则返回空数组
 */
export function findPath(grid: Grid, startPos: Position, endPos: Position): Position[] {
  // 创建节点
  const nodes = createNodes(grid);
  
  // 起点和终点
  const startNode = nodes[startPos.y][startPos.x];
  const endNode = nodes[endPos.y][endPos.x];
  
  // 如果起点或终点不可行走，返回空路径
  if (!startNode.walkable || !endNode.walkable) {
    return [];
  }
  
  // 开放列表和关闭列表
  const openSet: PathNode[] = [startNode];
  const closedSet: Set<string> = new Set();
  
  // 初始化起点
  startNode.gCost = 0;
  startNode.hCost = calculateManhattanDistance(startPos, endPos);
  startNode.fCost = startNode.hCost;
  
  // 当开放列表不为空时
  while (openSet.length > 0) {
    // 找到F值最小的节点
    openSet.sort((a, b) => a.fCost - b.fCost);
    const currentNode = openSet.shift()!;
    
    // 如果到达终点，重建路径
    if (currentNode.position.x === endPos.x && currentNode.position.y === endPos.y) {
      return reconstructPath(currentNode);
    }
    
    // 将当前节点加入关闭列表
    closedSet.add(`${currentNode.position.x},${currentNode.position.y}`);
    
    // 检查所有邻居
    const neighbors = getNeighbors(currentNode, grid, nodes);
    
    for (const neighbor of neighbors) {
      // 跳过不可行走的节点和已在关闭列表的节点
      if (!neighbor.walkable || closedSet.has(`${neighbor.position.x},${neighbor.position.y}`)) {
        continue;
      }
      
      // 从当前节点到邻居的花费
      const tentativeGCost = currentNode.gCost + 1; // 假设相邻格子距离为1
      
      // 如果新路径更好或者邻居还未评估
      if (tentativeGCost < neighbor.gCost || !openSet.includes(neighbor)) {
        // 更新邻居节点的成本和父节点
        neighbor.parent = currentNode;
        neighbor.gCost = tentativeGCost;
        neighbor.hCost = calculateManhattanDistance(neighbor.position, endPos);
        neighbor.fCost = neighbor.gCost + neighbor.hCost;
        
        // 添加到开放列表
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  
  // 如果开放列表为空，没有找到路径
  return [];
}

/**
 * 获取下一步移动位置
 * @param grid 网格
 * @param current 当前位置
 * @param target 目标位置
 * @returns 下一步位置，如果无法移动则返回当前位置
 */
export function getNextMove(grid: Grid, current: Position, target: Position): Position {
  const path = findPath(grid, current, target);
  
  if (path.length < 2) {
    return current; // 无法移动或已在目标位置
  }
  
  return path[1]; // 返回路径中的下一个位置
}

/**
 * 获取随机可行走位置
 * @param grid 网格
 * @param maxAttempts 最大尝试次数
 * @returns 随机位置
 */
export function getRandomWalkablePosition(grid: Grid, maxAttempts: number = 10): Position | null {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const x = Math.floor(Math.random() * grid.width);
    const y = Math.floor(Math.random() * grid.height);
    
    const tile = grid.tiles[y][x];
    
    if (tile.isWalkable && !tile.occupiedBy) {
      return { x, y };
    }
    
    attempts++;
  }
  
  return null; // 找不到可行位置
}

/**
 * 获取范围内可行走位置
 * @param grid 网格
 * @param center 中心位置
 * @param radius 半径
 * @returns 随机位置
 */
export function getRandomWalkablePositionInRadius(grid: Grid, center: Position, radius: number): Position | null {
  const positions: Position[] = [];
  
  for (let y = Math.max(0, center.y - radius); y <= Math.min(grid.height - 1, center.y + radius); y++) {
    for (let x = Math.max(0, center.x - radius); x <= Math.min(grid.width - 1, center.x + radius); x++) {
      if (calculateManhattanDistance(center, { x, y }) <= radius) {
        const tile = grid.tiles[y][x];
        if (tile.isWalkable && !tile.occupiedBy) {
          positions.push({ x, y });
        }
      }
    }
  }
  
  if (positions.length === 0) {
    return null;
  }
  
  // 随机选择一个位置
  return positions[Math.floor(Math.random() * positions.length)];
} 