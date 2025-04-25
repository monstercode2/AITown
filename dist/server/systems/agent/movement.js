"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryMoveAgent = exports.isPositionOccupied = exports.DIRECTION_VECTORS = exports.Direction = void 0;
exports.isWithinGrid = isWithinGrid;
exports.getNextPosition = getNextPosition;
exports.tryMove = tryMove;
/**
 * 移动方向枚举
 */
var Direction;
(function (Direction) {
    Direction["UP"] = "UP";
    Direction["DOWN"] = "DOWN";
    Direction["LEFT"] = "LEFT";
    Direction["RIGHT"] = "RIGHT";
})(Direction || (exports.Direction = Direction = {}));
/**
 * 方向对应的位置变化
 */
exports.DIRECTION_VECTORS = (_a = {},
    _a[Direction.UP] = { x: 0, y: -1 },
    _a[Direction.DOWN] = { x: 0, y: 1 },
    _a[Direction.LEFT] = { x: -1, y: 0 },
    _a[Direction.RIGHT] = { x: 1, y: 0 },
    _a);
/**
 * 检查位置是否在网格范围内
 */
function isWithinGrid(position, gridSize) {
    return (position.x >= 0 &&
        position.x < gridSize.width &&
        position.y >= 0 &&
        position.y < gridSize.height);
}
/**
 * 获取给定方向上的下一个位置
 */
function getNextPosition(currentPos, direction) {
    var nextPos = __assign({}, currentPos);
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
function tryMove(currentPos, direction, gridSize, isPositionOccupied) {
    var nextPos = getNextPosition(currentPos, direction);
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
var isPositionOccupied = function (pos, agents) {
    return agents.some(function (agent) { return agent.position.x === pos.x && agent.position.y === pos.y; });
};
exports.isPositionOccupied = isPositionOccupied;
/**
 * 尝试移动Agent
 * @param agent 要移动的Agent
 * @param direction 移动方向
 * @param gridWidth 地图宽度
 * @param gridHeight 地图高度
 * @param agents 所有Agent
 * @returns 如果移动成功返回新位置，否则返回null
 */
var tryMoveAgent = function (agent, direction, gridWidth, gridHeight, agents) {
    var newPos = getNextPosition(agent.position, direction);
    if (!isWithinGrid(newPos, { width: gridWidth, height: gridHeight }) ||
        (0, exports.isPositionOccupied)(newPos, agents)) {
        return null;
    }
    return newPos;
};
exports.tryMoveAgent = tryMoveAgent;
