"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentState = void 0;
/**
 * Agent 状态枚举
 */
var AgentState;
(function (AgentState) {
    AgentState["IDLE"] = "IDLE";
    AgentState["MOVING"] = "MOVING";
    AgentState["TALKING"] = "TALKING";
    AgentState["INTERACTING"] = "INTERACTING";
    AgentState["WORKING"] = "WORKING";
    AgentState["RESTING"] = "RESTING"; // 休息中
})(AgentState || (exports.AgentState = AgentState = {}));
