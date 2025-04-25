import { create } from 'zustand';
import { Grid, Position, Tile } from '../types/grid';
import { GRID_HEIGHT, GRID_WIDTH, INITIAL_MAP_LAYOUT, TERRAIN_CONFIG } from '../components/Grid/constants';
import { StateCreator } from 'zustand/vanilla';

interface GridState {
  grid: Grid;
  selectedTile: Position | null;
  initializeGrid: () => void;
  selectTile: (position: Position | null) => void;
  isTileWalkable: (position: Position) => boolean;
}

type GridStore = StateCreator<GridState>;

export const useGridStore = create<GridState>((set, get): GridState => ({
  grid: {
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    tiles: [],
  },
  selectedTile: null,

  initializeGrid: () => {
    const tiles: Tile[][] = Array(GRID_HEIGHT)
      .fill(null)
      .map((_, y) =>
        Array(GRID_WIDTH)
          .fill(null)
          .map((_, x) => ({
            type: INITIAL_MAP_LAYOUT[y][x],
            position: { x, y },
            isWalkable: TERRAIN_CONFIG[INITIAL_MAP_LAYOUT[y][x]].isWalkable,
            occupiedBy: undefined,
          }))
      );

    set({ grid: { width: GRID_WIDTH, height: GRID_HEIGHT, tiles } });
  },

  selectTile: (position: Position | null) => {
    set({ selectedTile: position });
  },

  isTileWalkable: (position: Position) => {
    const { grid } = get();
    const tile = grid.tiles[position.y]?.[position.x];
    if (!tile) return false;
    return tile.isWalkable && !tile.occupiedBy;
  },
})); 