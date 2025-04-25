// 需要先安装 express 和 @types/express
// npm install express cors
// npm install --save-dev @types/express @types/cors

import express, { Request, Response } from 'express';
import cors from 'cors';
import { MainLoop } from '../systems/main';
import { DashscopeClient } from '../lib/llm/client/dashscope';
import { LLM_CONFIG } from '../lib/llm/config';
import { GRID_HEIGHT, GRID_WIDTH, INITIAL_MAP_LAYOUT, TERRAIN_CONFIG } from '../components/Grid/constants';
import { Agent, AgentState } from '../types/agent';
import { Grid } from '../types/grid';
import { AGENT_PRESETS, GLOBAL_SETTINGS } from '../config/settings';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// 创建默认网格
function createDefaultGrid(): Grid {
  const tiles = Array(GRID_HEIGHT)
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
  return { width: GRID_WIDTH, height: GRID_HEIGHT, tiles };
}

// 初始化主循环
const agents = AGENT_PRESETS.map(preset => ({
  ...preset,
  relationships: new Map(),
  memories: []
}));
const grid = createDefaultGrid();
const mainLoop = new MainLoop(agents, grid);

// 启动主循环
mainLoop.start();
// 可根据GLOBAL_SETTINGS设置事件频率、时间流速等
mainLoop.setEventFrequency(GLOBAL_SETTINGS.eventFrequency);
mainLoop.setTimeScale(GLOBAL_SETTINGS.timeScale);

// Express服务
const app = express();
app.use(cors());
app.use(express.json());

// 获取模拟状态
app.get('/api/simulation', (req: Request, res: Response) => {
  res.json({
    status: mainLoop.isSimulationRunning() ? 'running' : 'paused',
    uptime: mainLoop.getUptime(),
    agents: mainLoop.getAgents(),
    settings: {
      timeScale: 1,
      eventFrequency: 0.1,
      autoAgentDecisions: true
    },
    events: mainLoop.getEvents()
  });
});

// 控制模拟（启动/暂停/重置）
app.post('/api/simulation', (req: Request, res: Response) => {
  const { action } = req.body;
  if (action === 'start') {
    mainLoop.start();
    res.json({ status: 'running' });
  } else if (action === 'pause') {
    mainLoop.pause();
    res.json({ status: 'paused' });
  } else if (action === 'reset') {
    // 这里只是简单重启，实际可扩展为重置所有状态
    mainLoop.stop();
    mainLoop.start();
    res.json({ status: 'running' });
  } else {
    res.status(400).json({ error: '无效操作' });
  }
});

// 启动服务
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`AI Town主循环服务已启动，端口: ${PORT}`);
}); 