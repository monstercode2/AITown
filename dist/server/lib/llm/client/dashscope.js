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
exports.DashscopeClient = void 0;
var axios_1 = require("axios");
var DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
/**
 * 阿里百炼 API 客户端类
 */
var DashscopeClient = /** @class */ (function () {
    function DashscopeClient(config) {
        this.retryCount = 3;
        this.retryDelay = 1000; // 1秒
        this.config = config;
    }
    /**
     * 发送请求到阿里百炼 API
     */
    DashscopeClient.prototype.makeRequest = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, data, response, error_1, dashError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = {
                            'Authorization': "Bearer ".concat(this.config.apiKey),
                            'Content-Type': 'application/json',
                        };
                        data = {
                            model: this.config.model,
                            input: {
                                prompt: prompt,
                            },
                            parameters: {
                                temperature: 0.7,
                                top_p: 0.8,
                                result_format: 'text',
                            },
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.post(DASHSCOPE_API_URL, data, { headers: headers })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.data.output.text];
                    case 3:
                        error_1 = _a.sent();
                        if (axios_1.default.isAxiosError(error_1) && error_1.response) {
                            dashError = error_1.response.data;
                            throw new Error("Dashscope API error: ".concat(dashError.code, " - ").concat(dashError.message));
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 带重试机制的请求
     */
    DashscopeClient.prototype.requestWithRetry = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var lastError, _loop_1, this_1, i, state_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastError = null;
                        _loop_1 = function (i) {
                            var _b, error_2;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 5]);
                                        _b = {};
                                        return [4 /*yield*/, this_1.makeRequest(prompt)];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_2 = _c.sent();
                                        lastError = error_2;
                                        if (!(i < this_1.retryCount - 1)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, _this.retryDelay * (i + 1)); })];
                                    case 3:
                                        _c.sent();
                                        _c.label = 4;
                                    case 4: return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.retryCount)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(i)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError || new Error('Unknown error occurred');
                }
            });
        });
    };
    /**
     * 生成 Agent 决策
     */
    DashscopeClient.prototype.generateAgentDecision = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var fullPrompt;
            return __generator(this, function (_a) {
                fullPrompt = "\n\u4F60\u662F\u4E00\u4E2AAI\u5C0F\u9547\u4E2D\u7684\u5C45\u6C11\u3002\u6839\u636E\u5F53\u524D\u73AF\u5883\uFF0C\u4F60\u9700\u8981\u51B3\u5B9A\u4E0B\u4E00\u6B65\u884C\u52A8\u3002\n\u8BF7\u7528\u4EE5\u4E0B\u683C\u5F0F\u56DE\u590D\uFF1A\n\nACTION: [MOVE|INTERACT|SPEAK|IDLE]\nDIRECTION: [UP|DOWN|LEFT|RIGHT] (\u5982\u679C\u662F\u79FB\u52A8)\nTARGET: [\u76EE\u6807ID] (\u5982\u679C\u662F\u4EA4\u4E92)\nMESSAGE: \"[\u5BF9\u8BDD\u5185\u5BB9]\" (\u5982\u679C\u662F\u8BF4\u8BDD)\n\n\u73AF\u5883\u4FE1\u606F\uFF1A\n".concat(prompt, "\n\n\u8BF7\u51B3\u5B9A\u4F60\u7684\u4E0B\u4E00\u6B65\u884C\u52A8\uFF1A");
                return [2 /*return*/, this.requestWithRetry(fullPrompt)];
            });
        });
    };
    /**
     * 生成 Agent 对话
     */
    DashscopeClient.prototype.generateAgentDialogue = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var fullPrompt;
            return __generator(this, function (_a) {
                fullPrompt = "\n\u4F60\u6B63\u5728\u4E0E\u5176\u4ED6AI\u5C0F\u9547\u5C45\u6C11\u4EA4\u8C08\u3002\u8BF7\u6839\u636E\u4E0A\u4E0B\u6587\u751F\u6210\u5408\u9002\u7684\u5BF9\u8BDD\u5185\u5BB9\u3002\n\n\u5F53\u524D\u4E0A\u4E0B\u6587\uFF1A\n".concat(context, "\n\n\u8BF7\u751F\u6210\u5BF9\u8BDD\u56DE\u5E94\uFF1A");
                return [2 /*return*/, this.requestWithRetry(fullPrompt)];
            });
        });
    };
    /**
     * 生成事件
     */
    DashscopeClient.prototype.generateEvent = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var fullPrompt;
            return __generator(this, function (_a) {
                fullPrompt = "\n\u4F60\u662FAI\u5C0F\u9547\u7684\u4E8B\u4EF6\u751F\u6210\u5668\u3002\u8BF7\u6839\u636E\u5F53\u524D\u60C5\u51B5\u751F\u6210\u4E00\u4E2A\u5408\u9002\u7684\u968F\u673A\u4E8B\u4EF6\u3002\n\n\u5F53\u524D\u60C5\u51B5\uFF1A\n".concat(context, "\n\n\u8BF7\u751F\u6210\u4E00\u4E2A\u4E8B\u4EF6\uFF1A");
                return [2 /*return*/, this.requestWithRetry(fullPrompt)];
            });
        });
    };
    return DashscopeClient;
}());
exports.DashscopeClient = DashscopeClient;
