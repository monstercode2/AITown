"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_MAP_LAYOUT = exports.TERRAIN_CONFIG = exports.TILE_SIZE = exports.GRID_HEIGHT = exports.GRID_WIDTH = void 0;
var types_1 = require("@/types");
// 地图尺寸
exports.GRID_WIDTH = 10;
exports.GRID_HEIGHT = 10;
exports.TILE_SIZE = 48; // px，与CSS变量--tile-size保持一致
// 地形配置
exports.TERRAIN_CONFIG = (_a = {},
    _a[types_1.TileType.GROUND] = {
        color: 'bg-green-200',
        isWalkable: true,
    },
    _a[types_1.TileType.HOUSE] = {
        color: 'bg-yellow-300',
        isWalkable: false,
    },
    _a[types_1.TileType.SHOP] = {
        color: 'bg-blue-300',
        isWalkable: false,
    },
    _a[types_1.TileType.PARK] = {
        color: 'bg-green-400',
        isWalkable: true,
    },
    _a[types_1.TileType.ROAD] = {
        color: 'bg-gray-400',
        isWalkable: true,
    },
    _a);
// 初始地图布局
exports.INITIAL_MAP_LAYOUT = [
    [types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.SHOP, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.PARK],
    [types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.ROAD],
    [types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.SHOP, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.PARK],
    [types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.ROAD],
    [types_1.TileType.SHOP, types_1.TileType.ROAD, types_1.TileType.PARK, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.SHOP, types_1.TileType.PARK],
    [types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.ROAD],
    [types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.SHOP, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.PARK],
    [types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.GROUND, types_1.TileType.ROAD, types_1.TileType.ROAD],
    [types_1.TileType.SHOP, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.ROAD, types_1.TileType.SHOP, types_1.TileType.ROAD, types_1.TileType.HOUSE, types_1.TileType.PARK],
    [types_1.TileType.PARK, types_1.TileType.ROAD, types_1.TileType.PARK, types_1.TileType.ROAD, types_1.TileType.PARK, types_1.TileType.ROAD, types_1.TileType.PARK, types_1.TileType.ROAD, types_1.TileType.PARK, types_1.TileType.PARK],
];
