"use strict";
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
exports.ActionType = void 0;
exports.generateEnvironmentPrompt = generateEnvironmentPrompt;
exports.parseLLMResponse = parseLLMResponse;
exports.executeAction = executeAction;
var movement_1 = require("./movement");
var memory_1 = require("@/types/memory");
/**
 * Agent 行为类型
 */
var ActionType;
(function (ActionType) {
    ActionType["MOVE"] = "MOVE";
    ActionType["INTERACT"] = "INTERACT";
    ActionType["SPEAK"] = "SPEAK";
    ActionType["IDLE"] = "IDLE";
    ActionType["PURSUE_GOAL"] = "PURSUE_GOAL";
})(ActionType || (exports.ActionType = ActionType = {}));
/**
 * 生成环境描述文本
 */
function generateEnvironmentPrompt(env) {
    var prompt = "\u5F53\u524D\u73AF\u5883\u4FE1\u606F\uFF1A\n";
    // 位置信息
    prompt += "\u4F4D\u7F6E\uFF1A\u4F60\u73B0\u5728\u5728".concat(env.currentLocation.tileType, "\u3002\n");
    // 附近的Agent
    if (env.nearbyAgents.length > 0) {
        prompt += '\n附近的人：\n';
        env.nearbyAgents.forEach(function (agent) {
            var relationship = env.relationships.get(agent.id);
            var relationshipStr = relationship
                ? "\uFF08\u5173\u7CFB\u597D\u611F\u5EA6\uFF1A".concat(relationship.affinity, "\uFF0C\u4E92\u52A8\u6B21\u6570\uFF1A").concat(relationship.interactions, "\uFF09")
                : '（初次见面）';
            prompt += "- ".concat(agent.name, " ").concat(relationshipStr, " \u6B63\u5728").concat(agent.currentAction || '这里', "\n");
        });
    }
    // 相关记忆
    if (env.memories.length > 0) {
        prompt += '\n相关记忆：\n';
        var sortedMemories = __spreadArray([], env.memories, true).sort(function (a, b) { return b.importance - a.importance; })
            .slice(0, 3);
        sortedMemories.forEach(function (memory) {
            prompt += "- [".concat(memory.importance, "\u7EA7\u91CD\u8981] ").concat(memory.content, "\n");
        });
    }
    // 最近事件
    if (env.recentEvents.length > 0) {
        prompt += '\n最近发生的事：\n';
        env.recentEvents.forEach(function (event) {
            prompt += "- ".concat(event, "\n");
        });
    }
    prompt += "\n\u73B0\u5728\u662F".concat(env.timeOfDay, "\u3002");
    return prompt;
}
/**
 * 解析 LLM 响应
 */
function parseLLMResponse(response) {
    var defaultAction = {
        type: ActionType.IDLE,
        data: {}
    };
    try {
        var actionMatch = response.match(/ACTION: (MOVE|INTERACT|SPEAK|IDLE|PURSUE_GOAL)/i);
        if (!actionMatch)
            return defaultAction;
        var action = {
            type: actionMatch[1],
            data: {}
        };
        switch (action.type) {
            case ActionType.MOVE:
                var directionMatch = response.match(/DIRECTION: (UP|DOWN|LEFT|RIGHT)/i);
                if (directionMatch) {
                    action.data.direction = directionMatch[1];
                }
                break;
            case ActionType.SPEAK:
                var messageMatch = response.match(/MESSAGE: "(.+)"/);
                if (messageMatch) {
                    action.data.message = messageMatch[1];
                }
                break;
            case ActionType.INTERACT:
                var targetMatch = response.match(/TARGET: (.+)/);
                if (targetMatch) {
                    action.data.targetId = targetMatch[1];
                }
                var interactionMessage = response.match(/INTERACTION: "(.+)"/);
                if (interactionMessage) {
                    action.data.message = interactionMessage[1];
                }
                break;
            case ActionType.PURSUE_GOAL:
                var goalMatch = response.match(/GOAL: "(.+)"/);
                if (goalMatch) {
                    action.data.goal = goalMatch[1];
                }
                var priorityMatch = response.match(/PRIORITY: (\d+)/);
                if (priorityMatch) {
                    action.data.priority = parseInt(priorityMatch[1]);
                }
                break;
        }
        return action;
    }
    catch (error) {
        console.error('Error parsing LLM response:', error);
        return defaultAction;
    }
}
/**
 * 执行 Agent 行为
 */
function executeAction(action, agent, grid, agents) {
    var _a;
    switch (action.type) {
        case ActionType.MOVE:
            if (action.data.direction) {
                var newPosition = (0, movement_1.tryMoveAgent)(agent, action.data.direction, grid.width, grid.height, agents);
                if (newPosition) {
                    agent.position = newPosition;
                    // 创建移动记忆
                    var memory = {
                        id: Date.now().toString(),
                        content: "\u79FB\u52A8\u5230\u4E86\u65B0\u7684\u4F4D\u7F6E (".concat(newPosition.x, ", ").concat(newPosition.y, ")"),
                        timestamp: Date.now(),
                        importance: memory_1.ImportanceLevel.LOW,
                        type: memory_1.MemoryType.OBSERVATION,
                        tags: ['移动']
                    };
                    agent.memories.push(memory);
                }
            }
            break;
        case ActionType.SPEAK:
            if (action.data.message) {
                agent.currentAction = action.data.message;
                // 创建对话记忆
                var memory = {
                    id: Date.now().toString(),
                    content: "\u5BF9".concat(action.data.targetId ? (_a = agents.find(function (a) { return a.id === action.data.targetId; })) === null || _a === void 0 ? void 0 : _a.name : '周围的人', "\u8BF4\uFF1A").concat(action.data.message),
                    timestamp: Date.now(),
                    importance: memory_1.ImportanceLevel.LOW,
                    type: memory_1.MemoryType.INTERACTION,
                    tags: ['对话']
                };
                agent.memories.push(memory);
            }
            break;
        case ActionType.INTERACT:
            if (action.data.targetId) {
                var targetAgent = agents.find(function (a) { return a.id === action.data.targetId; });
                if (targetAgent) {
                    agent.currentAction = action.data.message || '正在互动';
                    // 创建交互记忆
                    var memory = {
                        id: Date.now().toString(),
                        content: "\u4E0E".concat(targetAgent.name, "\u8FDB\u884C\u4E86\u4E92\u52A8\uFF1A").concat(action.data.message || ''),
                        timestamp: Date.now(),
                        importance: memory_1.ImportanceLevel.MEDIUM,
                        type: memory_1.MemoryType.INTERACTION,
                        tags: ['互动', targetAgent.name]
                    };
                    agent.memories.push(memory);
                }
            }
            break;
        case ActionType.PURSUE_GOAL:
            if (action.data.goal) {
                agent.currentAction = "\u8FFD\u6C42\u76EE\u6807\uFF1A".concat(action.data.goal);
                // 创建目标记忆
                var memory = {
                    id: Date.now().toString(),
                    content: "\u8BBE\u5B9A\u4E86\u65B0\u76EE\u6807\uFF1A".concat(action.data.goal),
                    timestamp: Date.now(),
                    importance: memory_1.ImportanceLevel.HIGH,
                    type: memory_1.MemoryType.EVENT,
                    tags: ['目标']
                };
                agent.memories.push(memory);
            }
            break;
    }
}
