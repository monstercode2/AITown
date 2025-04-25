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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinInteractionRange = isWithinInteractionRange;
exports.updateRelationship = updateRelationship;
exports.handleDialogue = handleDialogue;
exports.handleInteraction = handleInteraction;
exports.getRelationshipStatus = getRelationshipStatus;
var agent_1 = require("@/types/agent");
var agent_interaction_1 = require("@/lib/llm/prompts/agent-interaction");
/**
 * 检查两个 Agent 是否在交互范围内
 */
function isWithinInteractionRange(a, b, range) {
    if (range === void 0) { range = 1; }
    var dx = Math.abs(a.x - b.x);
    var dy = Math.abs(a.y - b.y);
    return dx <= range && dy <= range;
}
/**
 * 更新 Agent 之间的关系
 */
function updateRelationship(agent, target, interactionType, intensity) {
    if (intensity === void 0) { intensity = 1; }
    // 获取或创建关系对象
    var relationship = agent.relationships.get(target.id) || {
        targetId: target.id,
        affinity: 0,
        interactions: 0
    };
    // 根据交互类型更新好感度
    switch (interactionType) {
        case 'positive':
            relationship.affinity = Math.min(100, relationship.affinity + 5 * intensity);
            break;
        case 'negative':
            relationship.affinity = Math.max(-100, relationship.affinity - 5 * intensity);
            break;
        case 'neutral':
            // 中性交互略微提升好感度
            relationship.affinity = Math.min(100, relationship.affinity + intensity);
            break;
    }
    // 增加互动次数
    relationship.interactions += 1;
    // 更新关系
    agent.relationships.set(target.id, relationship);
}
/**
 * 处理对话交互
 */
function handleDialogue(initiator, target, llmClient, location, timeOfDay, recentEvents, previousDialogue) {
    return __awaiter(this, void 0, void 0, function () {
        var context, response, messageMatch, message, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // 检查是否在交互范围内
                    if (!isWithinInteractionRange(initiator.position, target.position)) {
                        return [2 /*return*/, '对话失败：距离太远'];
                    }
                    context = {
                        initiator: initiator,
                        target: target,
                        location: location,
                        timeOfDay: timeOfDay,
                        recentEvents: recentEvents,
                        previousDialogue: previousDialogue
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, llmClient.generateAgentDialogue((0, agent_interaction_1.generateDialoguePrompt)(context))];
                case 2:
                    response = _a.sent();
                    messageMatch = response.match(/MESSAGE: "(.+)"/);
                    if (!messageMatch) {
                        throw new Error('无法解析对话响应');
                    }
                    message = messageMatch[1];
                    // 更新 Agent 状态
                    initiator.state = agent_1.AgentState.TALKING;
                    initiator.currentAction = message;
                    // 更新关系（默认为中性交互）
                    updateRelationship(initiator, target, 'neutral');
                    return [2 /*return*/, message];
                case 3:
                    error_1 = _a.sent();
                    console.error('对话生成失败:', error_1);
                    return [2 /*return*/, '对话生成失败'];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 处理一般交互
 */
function handleInteraction(initiator, target, llmClient, location, timeOfDay, recentEvents) {
    return __awaiter(this, void 0, void 0, function () {
        var context, response, actionMatch, messageMatch, action, message, sentiment, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // 检查是否在交互范围内
                    if (!isWithinInteractionRange(initiator.position, target.position)) {
                        return [2 /*return*/, '交互失败：距离太远'];
                    }
                    context = {
                        initiator: initiator,
                        target: target,
                        location: location,
                        timeOfDay: timeOfDay,
                        recentEvents: recentEvents
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, llmClient.generateAgentDialogue((0, agent_interaction_1.generateInteractionPrompt)(context))];
                case 2:
                    response = _a.sent();
                    actionMatch = response.match(/ACTION: (INTERACT|SPEAK)/);
                    messageMatch = response.match(/MESSAGE: "(.+)"/);
                    if (!actionMatch || !messageMatch) {
                        throw new Error('无法解析交互响应');
                    }
                    action = actionMatch[1];
                    message = messageMatch[1];
                    // 更新 Agent 状态
                    initiator.state = agent_1.AgentState.TALKING;
                    initiator.currentAction = message;
                    sentiment = analyzeSentiment(message);
                    updateRelationship(initiator, target, sentiment);
                    return [2 /*return*/, message];
                case 3:
                    error_2 = _a.sent();
                    console.error('交互生成失败:', error_2);
                    return [2 /*return*/, '交互生成失败'];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 简单的情感分析
 * TODO: 后续可以使用更复杂的情感分析
 */
function analyzeSentiment(message) {
    var positiveWords = ['喜欢', '开心', '高兴', '感谢', '好', '棒', '真棒', '帮助'];
    var negativeWords = ['讨厌', '生气', '难过', '烦', '坏', '差', '糟糕'];
    var positiveCount = positiveWords.filter(function (word) { return message.includes(word); }).length;
    var negativeCount = negativeWords.filter(function (word) { return message.includes(word); }).length;
    if (positiveCount > negativeCount)
        return 'positive';
    if (negativeCount > positiveCount)
        return 'negative';
    return 'neutral';
}
/**
 * 获取两个 Agent 之间的关系状态
 */
function getRelationshipStatus(agent, target) {
    var relationship = agent.relationships.get(target.id);
    return relationship || { affinity: 0, interactions: 0 };
}
