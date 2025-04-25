import { NextApiRequest, NextApiResponse } from 'next';
import { MainLoop } from '@/systems/main';
import { useAgentStore } from '@/store/agentStore';
import { useGridStore } from '@/store/gridStore';
import { DashscopeClient } from '@/lib/llm/client/dashscope';
import { LLM_CONFIG } from '@/lib/llm/config';
import { Logger, LogCategory } from '@/utils/logger';
import { Agent, AgentState } from '@/types/agent';
import { Grid, TileType } from '@/types/grid';
import { GRID_HEIGHT, GRID_WIDTH, INITIAL_MAP_LAYOUT, TERRAIN_CONFIG } from '@/components/Grid/constants';

// 全局单例
let simulationInstance: MainLoop | null = null;

// 模拟设置
interface SimulationSettings {
  timeScale: number;        // 时间流速（默认1）
  eventFrequency: number;   // 事件生成频率（0-1）
  autoAgentDecisions: boolean; // 是否自动Agent决策
}

// 默认设置
const defaultSettings: SimulationSettings = {
  timeScale: 1,
  eventFrequency: 0.1,
  autoAgentDecisions: true
};

// 当前设置
let currentSettings: SimulationSettings = { ...defaultSettings };

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

// 创建默认Agents
function createDefaultAgents(): Agent[] {
  return [
    {
      id: '1',
      name: '小明',
      position: { x: 5, y: 5 },
      state: AgentState.IDLE,
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
      },
      llmModel: 'qwen-max'
    },
    {
      id: '2',
      name: '小红',
      position: { x: 10, y: 10 },
      state: AgentState.IDLE,
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
      },
      llmModel: 'qwen-max'
    }
  ];
}

// 获取模拟实例
function getSimulation() {
  if (!simulationInstance) {
    try {
      // 创建默认数据而不是从store获取
      const agents = createDefaultAgents();
      const grid = createDefaultGrid();
      
      // 创建LLM客户端实例
      const llmClient = new DashscopeClient({
        apiKey: process.env.DASHSCOPE_API_KEY || '',
        model: LLM_CONFIG.DASHSCOPE.MODEL
      });

      // 创建新实例
      simulationInstance = new MainLoop(agents, grid);
      
      // 应用设置
      simulationInstance.setTimeScale(currentSettings.timeScale);
      simulationInstance.setEventFrequency(currentSettings.eventFrequency);
      simulationInstance.setAutoAgentDecisions(currentSettings.autoAgentDecisions);
      
      Logger.info(LogCategory.SYSTEM, '模拟实例已创建');
    } catch (error) {
      Logger.error(LogCategory.SYSTEM, '创建模拟实例失败', error);
      throw new Error(`初始化模拟失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  return simulationInstance;
}

// 释放模拟实例
function destroySimulation() {
  if (simulationInstance) {
    simulationInstance.stop();
    simulationInstance = null;
    Logger.info(LogCategory.SYSTEM, '模拟实例已销毁');
  }
}

/**
 * 模拟控制API处理函数
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { action } = req.query;
    
    // GET: 获取当前状态
    if (req.method === 'GET') {
      let status = 'idle';
      let uptime = 0;
      let agents: Agent[] = [];
      
      if (simulationInstance) {
        status = simulationInstance.isSimulationRunning() ? 'running' : 'paused';
        uptime = simulationInstance.getUptime();
        agents = simulationInstance.getAgents();
      }
      
      return res.status(200).json({
        status,
        settings: currentSettings,
        uptime,
        agents
      });
    }
    
    // POST: 控制操作
    if (req.method === 'POST') {
      switch (action) {
        case 'start': {
          const simulation = getSimulation();
          simulation.start();
          return res.status(200).json({
            status: 'running',
            settings: currentSettings,
            agents: simulation.getAgents()
          });
        }
        
        case 'pause': {
          if (!simulationInstance) {
            return res.status(400).json({ error: '模拟尚未运行' });
          }
          
          simulationInstance.pause();
          return res.status(200).json({
            status: 'paused',
            settings: currentSettings
          });
        }
        
        case 'reset': {
          destroySimulation();
          currentSettings = { ...defaultSettings };
          return res.status(200).json({
            status: 'idle',
            settings: currentSettings
          });
        }
        
        default:
          return res.status(400).json({ error: '无效的操作' });
      }
    }
    
    // PUT: 更新设置
    if (req.method === 'PUT' && action === 'settings') {
      const newSettings = req.body as Partial<SimulationSettings>;
      
      // 更新设置
      if (newSettings.timeScale !== undefined) {
        if (newSettings.timeScale <= 0) {
          return res.status(400).json({ error: '时间流速必须大于0' });
        }
        currentSettings.timeScale = newSettings.timeScale;
        simulationInstance?.setTimeScale(newSettings.timeScale);
      }
      
      if (newSettings.eventFrequency !== undefined) {
        if (newSettings.eventFrequency < 0 || newSettings.eventFrequency > 1) {
          return res.status(400).json({ error: '事件频率必须在0-1之间' });
        }
        currentSettings.eventFrequency = newSettings.eventFrequency;
        simulationInstance?.setEventFrequency(newSettings.eventFrequency);
      }
      
      if (newSettings.autoAgentDecisions !== undefined) {
        currentSettings.autoAgentDecisions = newSettings.autoAgentDecisions;
        simulationInstance?.setAutoAgentDecisions(newSettings.autoAgentDecisions);
      }
      
      return res.status(200).json({
        settings: currentSettings
      });
    }
    
    return res.status(405).json({ error: '方法不允许' });
  } catch (error) {
    Logger.error(LogCategory.API, '模拟API错误', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : '内部服务器错误'
    });
  }
} 