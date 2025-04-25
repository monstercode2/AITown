"use strict";
// 需要先安装 express 和 @types/express
// npm install express cors
// npm install --save-dev @types/express @types/cors
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var main_1 = require("../systems/main");
var dashscope_1 = require("../lib/llm/client/dashscope");
var config_1 = require("../lib/llm/config");
var constants_1 = require("../components/Grid/constants");
var agent_1 = require("../types/agent");
// 创建默认网格
function createDefaultGrid() {
    var tiles = Array(constants_1.GRID_HEIGHT)
        .fill(null)
        .map(function (_, y) {
        return Array(constants_1.GRID_WIDTH)
            .fill(null)
            .map(function (_, x) { return ({
            type: constants_1.INITIAL_MAP_LAYOUT[y][x],
            position: { x: x, y: y },
            isWalkable: constants_1.TERRAIN_CONFIG[constants_1.INITIAL_MAP_LAYOUT[y][x]].isWalkable,
            occupiedBy: undefined,
        }); });
    });
    return { width: constants_1.GRID_WIDTH, height: constants_1.GRID_HEIGHT, tiles: tiles };
}
// 创建默认Agents
function createDefaultAgents() {
    return [
        {
            id: '1',
            name: '小明',
            position: { x: 5, y: 5 },
            state: agent_1.AgentState.IDLE,
            relationships: new Map(),
            memories: [],
            attributes: {
                energy: 100,
                mood: 50,
                sociability: 70
            },
            personality: '活泼、好奇、友善',
            currentAction: '正在探索小镇',
            traits: ['善良', '有创造力', '喜欢交朋友'],
            schedule: {
                '8:00': '早餐',
                '9:00': '探索小镇',
                '12:00': '午餐',
                '14:00': '与朋友交流',
                '18:00': '晚餐',
                '21:00': '休息'
            },
            needs: {
                energy: 80,
                social: 60,
                fun: 70
            }
        },
        {
            id: '2',
            name: '小红',
            position: { x: 3, y: 3 },
            state: agent_1.AgentState.IDLE,
            relationships: new Map(),
            memories: [],
            attributes: {
                energy: 100,
                mood: 60,
                sociability: 80
            },
            personality: '温柔、细心、乐于助人',
            currentAction: '正在整理物品',
            traits: ['耐心', '喜欢思考', '爱整洁'],
            schedule: {
                '7:30': '晨练',
                '8:30': '早餐',
                '9:30': '整理房间',
                '12:00': '午餐',
                '13:30': '读书',
                '17:00': '帮助邻居',
                '19:00': '晚餐',
                '20:30': '休息'
            },
            needs: {
                energy: 90,
                social: 70,
                fun: 60
            }
        },
        {
            id: '3',
            name: '老王',
            position: { x: 1, y: 1 },
            state: agent_1.AgentState.WORKING,
            relationships: new Map(),
            memories: [],
            attributes: {
                energy: 100,
                mood: 80,
                sociability: 40
            },
            personality: '勤劳、严谨、有责任感',
            currentAction: '正在经营商店',
            traits: ['勤奋', '守纪律', '有担当'],
            schedule: {
                '6:00': '开店',
                '12:00': '午餐',
                '13:00': '进货',
                '18:00': '关店',
                '19:00': '休息'
            },
            needs: {
                energy: 70,
                social: 30,
                fun: 40
            }
        },
        {
            id: '4',
            name: '小张',
            position: { x: 7, y: 1 },
            state: agent_1.AgentState.RESTING,
            relationships: new Map(),
            memories: [],
            attributes: {
                energy: 100,
                mood: 90,
                sociability: 90
            },
            personality: '外向、乐观、喜欢表演',
            currentAction: '正在休息',
            traits: ['幽默', '爱表演', '乐观'],
            schedule: {
                '8:00': '锻炼',
                '9:00': '表演',
                '12:00': '午餐',
                '14:00': '与朋友玩耍',
                '18:00': '晚餐',
                '21:00': '休息'
            },
            needs: {
                energy: 95,
                social: 95,
                fun: 100
            }
        }
    ];
}
// 初始化主循环
var agents = createDefaultAgents();
var grid = createDefaultGrid();
var llmClient = new dashscope_1.DashscopeClient({
    apiKey: process.env.DASHSCOPE_API_KEY || 'sk-19330bcc71ed4c71a13bb0523e005f71',
    model: config_1.LLM_CONFIG.DASHSCOPE.MODEL
});
var mainLoop = new main_1.MainLoop(agents, grid, llmClient);
// 启动主循环
mainLoop.start();
// Express服务
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 获取模拟状态
app.get('/api/simulation', function (req, res) {
    res.json({
        status: mainLoop.isSimulationRunning() ? 'running' : 'paused',
        uptime: mainLoop.getUptime(),
        agents: mainLoop.getAgents(),
        // 你可以根据需要返回更多状态
    });
});
// 控制模拟（启动/暂停/重置）
app.post('/api/simulation', function (req, res) {
    var action = req.body.action;
    if (action === 'start') {
        mainLoop.start();
        res.json({ status: 'running' });
    }
    else if (action === 'pause') {
        mainLoop.pause();
        res.json({ status: 'paused' });
    }
    else if (action === 'reset') {
        // 这里只是简单重启，实际可扩展为重置所有状态
        mainLoop.stop();
        mainLoop.start();
        res.json({ status: 'running' });
    }
    else {
        res.status(400).json({ error: '无效操作' });
    }
});
// 启动服务
var PORT = 3001;
app.listen(PORT, function () {
    console.log("AI Town\u4E3B\u5FAA\u73AF\u670D\u52A1\u5DF2\u542F\u52A8\uFF0C\u7AEF\u53E3: ".concat(PORT));
});
