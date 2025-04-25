"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportanceLevel = exports.MemoryType = void 0;
/**
 * 记忆类型
 */
var MemoryType;
(function (MemoryType) {
    MemoryType["INTERACTION"] = "INTERACTION";
    MemoryType["EVENT"] = "EVENT";
    MemoryType["OBSERVATION"] = "OBSERVATION";
    MemoryType["EMOTION"] = "EMOTION"; // 情感体验
})(MemoryType || (exports.MemoryType = MemoryType = {}));
/**
 * 记忆重要性级别
 */
var ImportanceLevel;
(function (ImportanceLevel) {
    ImportanceLevel[ImportanceLevel["LOW"] = 1] = "LOW";
    ImportanceLevel[ImportanceLevel["MEDIUM"] = 2] = "MEDIUM";
    ImportanceLevel[ImportanceLevel["HIGH"] = 3] = "HIGH";
    ImportanceLevel[ImportanceLevel["CRITICAL"] = 4] = "CRITICAL"; // 关键事件
})(ImportanceLevel || (exports.ImportanceLevel = ImportanceLevel = {}));
