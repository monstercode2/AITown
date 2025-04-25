"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainLoop = void 0;
var grid_1 = require("@/types/grid");
var decision_1 = require("./agent/decision");
var timeStore_1 = require("@/store/timeStore");
var eventStore_1 = require("@/store/eventStore");
var event_1 = require("@/types/event");
var logger_1 = require("@/utils/logger");
var pathfinding_1 = require("@/utils/pathfinding");
var time_1 = require("@/utils/time");
/**
 * 主循环系统
 * 负责协调Agent行为、环境更新和事件生成
 */
var MainLoop = /** @class */ (function () {
    function MainLoop(agents, grid, llmClient) {
        this.isRunning = false;
        this.isPaused = false;
        this.tickInterval = 1000; // 1秒一个tick
        this.timeStore = timeStore_1.useTimeStore.getState();
        this.eventStore = eventStore_1.useEventStore.getState();
        this.startTime = 0;
        this.timeScale = 1;
        this.eventFrequency = 0.1;
        this.autoAgentDecisions = true;
        this.lastAgentProcessTime = new Map(); // 记录每个Agent上次处理的时间
        this.processingInterval = 10; // Agent决策间隔(秒)
        this.agents = agents;
        this.grid = grid;
        this.llmClient = llmClient;
        this.initializeAgentProcessTimes();
        logger_1.Logger.info(logger_1.LogCategory.SYSTEM, '主循环初始化完成', {
            agentCount: agents.length,
            gridSize: "".concat(grid.width, "x").concat(grid.height)
        });
    }
    /**
     * 初始化Agent处理时间
     */
    MainLoop.prototype.initializeAgentProcessTimes = function () {
        var _this = this;
        var currentTime = this.timeStore.currentTime;
        this.agents.forEach(function (agent) {
            // 错开每个Agent的处理时间，避免同时处理
            var offset = Math.floor(Math.random() * _this.processingInterval);
            _this.lastAgentProcessTime.set(agent.id, currentTime - _this.processingInterval + offset);
        });
    };
    /**
     * 启动主循环
     */
    MainLoop.prototype.start = function () {
        if (this.isRunning && !this.isPaused)
            return;
        if (!this.isRunning) {
            logger_1.Logger.info(logger_1.LogCategory.SYSTEM, '启动AI小镇模拟', {
                timeScale: this.timeScale,
                eventFrequency: this.eventFrequency
            });
            this.isRunning = true;
            this.startTime = Date.now();
        }
        else if (this.isPaused) {
            logger_1.Logger.info(logger_1.LogCategory.SYSTEM, '恢复AI小镇模拟');
            this.isPaused = false;
        }
        this.tick();
    };
    /**
     * 暂停主循环
     */
    MainLoop.prototype.pause = function () {
        if (!this.isRunning || this.isPaused)
            return;
        logger_1.Logger.info(logger_1.LogCategory.SYSTEM, '暂停AI小镇模拟');
        this.isPaused = true;
    };
    /**
     * 停止主循环
     */
    MainLoop.prototype.stop = function () {
        if (!this.isRunning)
            return;
        logger_1.Logger.info(logger_1.LogCategory.SYSTEM, '停止AI小镇模拟');
        this.isRunning = false;
        this.isPaused = false;
    };
    /**
     * 设置时间流速
     */
    MainLoop.prototype.setTimeScale = function (scale) {
        if (scale <= 0)
            throw new Error('时间流速必须大于0');
        this.timeScale = scale;
        logger_1.Logger.info(logger_1.LogCategory.SYSTEM, "\u8BBE\u7F6E\u65F6\u95F4\u6D41\u901F\u4E3A ".concat(scale, "x"));
    };
    /**
     * 设置事件生成频率
     */
    MainLoop.prototype.setEventFrequency = function (frequency) {
        if (frequency < 0 || frequency > 1)
            throw new Error('事件频率必须在0-1之间');
        this.eventFrequency = frequency;
        logger_1.Logger.info(logger_1.LogCategory.SYSTEM, "\u8BBE\u7F6E\u4E8B\u4EF6\u751F\u6210\u9891\u7387\u4E3A ".concat(frequency));
    };
    /**
     * 设置是否自动Agent决策
     */
    MainLoop.prototype.setAutoAgentDecisions = function (auto) {
        this.autoAgentDecisions = auto;
        logger_1.Logger.info(logger_1.LogCategory.SYSTEM, "".concat(auto ? '启用' : '禁用', "\u81EA\u52A8Agent\u51B3\u7B56"));
    };
    /**
     * 获取模拟运行时间（毫秒）
     */
    MainLoop.prototype.getUptime = function () {
        if (!this.isRunning && this.startTime === 0)
            return 0;
        return Date.now() - this.startTime;
    };
    /**
     * 主循环tick
     */
    MainLoop.prototype.tick = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentTime, gameTime, _i, _a, agent, lastProcessTime, adjustedInterval, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.isRunning || this.isPaused)
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, , 9]);
                        // 更新时间（基于timeScale）
                        this.timeStore.incrementTime(1 * this.timeScale); // 每tick增加1秒 * 时间流速
                        currentTime = this.timeStore.currentTime;
                        gameTime = (0, time_1.getGameTime)(currentTime);
                        // 处理日期变更事件
                        this.handleDayChange(gameTime.day);
                        if (!this.autoAgentDecisions) return [3 /*break*/, 5];
                        _i = 0, _a = this.agents;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        agent = _a[_i];
                        lastProcessTime = this.lastAgentProcessTime.get(agent.id) || 0;
                        if (!(0, time_1.hasTimeElapsed)(lastProcessTime, currentTime, this.processingInterval)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.processAgent(agent)];
                    case 3:
                        _b.sent();
                        this.lastAgentProcessTime.set(agent.id, currentTime);
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (!(Math.random() < this.eventFrequency)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.generateEvent()];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        adjustedInterval = Math.max(50, this.tickInterval / this.timeScale);
                        setTimeout(function () { return _this.tick(); }, adjustedInterval);
                        return [3 /*break*/, 9];
                    case 8:
                        error_1 = _b.sent();
                        logger_1.Logger.error(logger_1.LogCategory.SYSTEM, '主循环错误', error_1);
                        this.stop();
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 处理日期变更
     * @param newDay 新的天数
     */
    MainLoop.prototype.handleDayChange = function (newDay) {
        var prevDay = this.timeStore.dayCount;
        if (newDay > prevDay) {
            logger_1.Logger.info(logger_1.LogCategory.SYSTEM, "\u8FDB\u5165\u7B2C".concat(newDay, "\u5929"));
            // 新的一天开始，重置一些状态或生成特殊事件
            this.generateDailyEvent(newDay);
            // 更新时间存储中的天数 - 直接设置currentTime会自动更新dayCount
            var currentSeconds = this.timeStore.currentTime;
            var currentTimeOfDay = currentSeconds % 86400; // 保留一天中的时间部分
            var newTotalSeconds = (newDay - 1) * 86400 + currentTimeOfDay;
            this.timeStore.setTime(newTotalSeconds);
        }
    };
    /**
     * 生成每日事件
     * @param day 天数
     */
    MainLoop.prototype.generateDailyEvent = function (day) {
        return __awaiter(this, void 0, void 0, function () {
            var eventDescription, newEvent;
            return __generator(this, function (_a) {
                try {
                    eventDescription = "\u65B0\u7684\u4E00\u5929\u5F00\u59CB\u4E86\uFF0C\u8FD9\u662F\u7B2C".concat(day, "\u5929\u3002");
                    newEvent = {
                        id: "day-".concat(day, "-start"),
                        type: event_1.EventType.TOWN,
                        scope: event_1.EventScope.GLOBAL,
                        description: eventDescription,
                        affectedAgents: this.agents.map(function (a) { return a.id; }),
                        startTime: Date.now(),
                        duration: 300000, // 5分钟
                        impact: {
                            mood: 5 // 微小的正面心情提升
                        }
                    };
                    this.eventStore.addEvent(newEvent);
                    logger_1.Logger.info(logger_1.LogCategory.EVENT, "\u751F\u6210\u6BCF\u65E5\u4E8B\u4EF6: ".concat(eventDescription));
                }
                catch (error) {
                    logger_1.Logger.error(logger_1.LogCategory.EVENT, '生成每日事件错误', error);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * 处理单个Agent的决策和行动
     */
    MainLoop.prototype.processAgent = function (agent) {
        return __awaiter(this, void 0, void 0, function () {
            var envInfo, prompt_1, startTime, response, llmTime, action, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        logger_1.Logger.debug(logger_1.LogCategory.AGENT, "\u5904\u7406Agent ".concat(agent.name, " (").concat(agent.id, ")"), {
                            position: agent.position,
                            state: agent.state
                        });
                        envInfo = {
                            nearbyAgents: this.getNearbyAgents(agent),
                            currentLocation: {
                                position: agent.position,
                                tileType: this.getTileType(agent.position.y, agent.position.x)
                            },
                            recentEvents: this.getRecentEvents(),
                            timeOfDay: this.getTimeOfDayFromSeconds(),
                            memories: agent.memories,
                            relationships: agent.relationships
                        };
                        prompt_1 = (0, decision_1.generateEnvironmentPrompt)(envInfo);
                        startTime = Date.now();
                        return [4 /*yield*/, this.llmClient.generateAgentDecision(prompt_1)];
                    case 1:
                        response = _a.sent();
                        llmTime = Date.now() - startTime;
                        logger_1.Logger.debug(logger_1.LogCategory.LLM, "LLM\u54CD\u5E94\u65F6\u95F4: ".concat(llmTime, "ms"), { agentId: agent.id });
                        action = (0, decision_1.parseLLMResponse)(response);
                        logger_1.Logger.info(logger_1.LogCategory.AGENT, "Agent ".concat(agent.name, " \u51B3\u7B56: ").concat(action.type), action);
                        return [4 /*yield*/, this.executeAction(action, agent)];
                    case 2:
                        result = _a.sent();
                        // 记录决策结果
                        logger_1.Logger.debug(logger_1.LogCategory.AGENT, "Agent ".concat(agent.name, " \u6267\u884C\u7ED3\u679C"), result);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        logger_1.Logger.error(logger_1.LogCategory.AGENT, "Agent ".concat(agent.id, " \u5904\u7406\u9519\u8BEF"), error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 执行Agent动作
     * @param action 动作
     * @param agent Agent
     * @returns 执行结果
     */
    MainLoop.prototype.executeAction = function (action, agent) {
        return __awaiter(this, void 0, void 0, function () {
            var nextPosition, oldTile, newTile, radius, randomPosition, oldTile, newTile;
            return __generator(this, function (_a) {
                // 这里我们会扩展原来的executeAction，加入寻路算法
                switch (action.type) {
                    case 'MOVE': {
                        // 使用寻路算法找到下一步位置
                        if (action.target && typeof action.target.x === 'number' && typeof action.target.y === 'number') {
                            nextPosition = (0, pathfinding_1.getNextMove)(this.grid, agent.position, action.target);
                            // 如果能移动（寻路算法找到了路径）
                            if (nextPosition.x !== agent.position.x || nextPosition.y !== agent.position.y) {
                                oldTile = this.grid.tiles[agent.position.y][agent.position.x];
                                if (oldTile.occupiedBy === agent.id) {
                                    oldTile.occupiedBy = undefined;
                                }
                                // 更新Agent位置
                                agent.position = nextPosition;
                                newTile = this.grid.tiles[nextPosition.y][nextPosition.x];
                                newTile.occupiedBy = agent.id;
                                return [2 /*return*/, { success: true, message: '移动成功', position: nextPosition }];
                            }
                            return [2 /*return*/, { success: false, message: '无法到达目标位置' }];
                        }
                        return [2 /*return*/, { success: false, message: '无效的目标位置' }];
                    }
                    case 'WANDER': {
                        radius = action.radius || 3;
                        randomPosition = (0, pathfinding_1.getRandomWalkablePositionInRadius)(this.grid, agent.position, radius);
                        if (randomPosition) {
                            oldTile = this.grid.tiles[agent.position.y][agent.position.x];
                            if (oldTile.occupiedBy === agent.id) {
                                oldTile.occupiedBy = undefined;
                            }
                            // 更新Agent位置
                            agent.position = randomPosition;
                            newTile = this.grid.tiles[randomPosition.y][randomPosition.x];
                            newTile.occupiedBy = agent.id;
                            return [2 /*return*/, { success: true, message: '闲逛成功', position: randomPosition }];
                        }
                        return [2 /*return*/, { success: false, message: '附近没有可行走的位置' }];
                    }
                    // 其他动作类型...根据需要扩展
                    default:
                        // 调用原来的executeAction处理其他类型的动作
                        return [2 /*return*/, (0, decision_1.executeAction)(action, agent, this.grid, this.agents)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * 获取格子类型
     */
    MainLoop.prototype.getTileType = function (y, x) {
        if (y < 0 || y >= this.grid.height || x < 0 || x >= this.grid.width) {
            return grid_1.TileType.GROUND; // 默认返回地面类型
        }
        return this.grid.tiles[y][x].type;
    };
    /**
     * 生成随机事件
     */
    MainLoop.prototype.generateEvent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gameTime, context, startTime, eventDescription, llmTime, affectedAgents, newEvent, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        gameTime = (0, time_1.getGameTime)(this.timeStore.currentTime);
                        context = {
                            time: gameTime.timeOfDay,
                            day: gameTime.day,
                            hour: gameTime.hour,
                            agents: this.agents.map(function (a) { return ({
                                id: a.id,
                                name: a.name,
                                position: a.position,
                                currentAction: a.currentAction,
                                state: a.state
                            }); })
                        };
                        logger_1.Logger.debug(logger_1.LogCategory.EVENT, '正在生成事件', context);
                        startTime = Date.now();
                        return [4 /*yield*/, this.llmClient.generateEvent(JSON.stringify(context))];
                    case 1:
                        eventDescription = _a.sent();
                        llmTime = Date.now() - startTime;
                        logger_1.Logger.debug(logger_1.LogCategory.LLM, "\u4E8B\u4EF6\u751F\u6210LLM\u54CD\u5E94\u65F6\u95F4: ".concat(llmTime, "ms"));
                        affectedAgents = this.getRandomAffectedAgents();
                        newEvent = {
                            id: Date.now().toString(),
                            type: event_1.EventType.ENVIRONMENTAL,
                            scope: event_1.EventScope.LOCAL,
                            description: eventDescription,
                            affectedAgents: affectedAgents,
                            startTime: Date.now(),
                            duration: 300000, // 5分钟
                            impact: {}
                        };
                        this.eventStore.addEvent(newEvent);
                        logger_1.Logger.info(logger_1.LogCategory.EVENT, "\u751F\u6210\u4E8B\u4EF6: ".concat(eventDescription), {
                            affectedAgents: affectedAgents,
                            type: event_1.EventType.ENVIRONMENTAL
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.Logger.error(logger_1.LogCategory.EVENT, '事件生成错误', error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 随机选择受影响的Agent
     * @returns 受影响的Agent ID数组
     */
    MainLoop.prototype.getRandomAffectedAgents = function () {
        if (this.agents.length === 0)
            return [];
        // 确保至少有一个Agent受影响
        var minAffected = 1;
        // 最多影响所有Agent
        var maxAffected = this.agents.length;
        // 随机决定影响的Agent数量
        var numAffected = Math.floor(Math.random() * (maxAffected - minAffected + 1)) + minAffected;
        // 复制并打乱Agent数组
        var shuffledAgents = __spreadArray([], this.agents, true).sort(function () { return Math.random() - 0.5; })
            .slice(0, numAffected);
        return shuffledAgents.map(function (a) { return a.id; });
    };
    /**
     * 获取附近的Agent
     */
    MainLoop.prototype.getNearbyAgents = function (agent) {
        return this.agents.filter(function (other) {
            return other.id !== agent.id &&
                Math.abs(other.position.x - agent.position.x) <= 3 &&
                Math.abs(other.position.y - agent.position.y) <= 3;
        });
    };
    /**
     * 获取最近的事件
     */
    MainLoop.prototype.getRecentEvents = function () {
        return this.eventStore.events
            .slice(-5)
            .map(function (event) { return event.description; });
    };
    /**
     * 获取当前时间（从秒数）
     */
    MainLoop.prototype.getTimeOfDayFromSeconds = function () {
        var totalSeconds = this.timeStore.currentTime;
        return (0, time_1.getTimeOfDay)(totalSeconds);
    };
    /**
     * 添加新Agent
     */
    MainLoop.prototype.addAgent = function (agent) {
        this.agents.push(agent);
        this.lastAgentProcessTime.set(agent.id, this.timeStore.currentTime);
        logger_1.Logger.info(logger_1.LogCategory.AGENT, "\u6DFB\u52A0\u65B0Agent: ".concat(agent.name, " (").concat(agent.id, ")"), {
            position: agent.position
        });
    };
    /**
     * 移除Agent
     */
    MainLoop.prototype.removeAgent = function (agentId) {
        var agentToRemove = this.agents.find(function (a) { return a.id === agentId; });
        if (agentToRemove) {
            logger_1.Logger.info(logger_1.LogCategory.AGENT, "\u79FB\u9664Agent: ".concat(agentToRemove.name, " (").concat(agentId, ")"));
            // 清除格子占用
            var position = agentToRemove.position;
            var tile = this.grid.tiles[position.y][position.x];
            if (tile.occupiedBy === agentId) {
                tile.occupiedBy = undefined;
            }
        }
        this.agents = this.agents.filter(function (a) { return a.id !== agentId; });
        this.lastAgentProcessTime.delete(agentId);
    };
    /**
     * 获取所有Agent
     */
    MainLoop.prototype.getAgents = function () {
        return __spreadArray([], this.agents, true);
    };
    /**
     * 获取运行状态
     */
    MainLoop.prototype.isSimulationRunning = function () {
        return this.isRunning;
    };
    return MainLoop;
}());
exports.MainLoop = MainLoop;
