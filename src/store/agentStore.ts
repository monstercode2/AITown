import { create } from 'zustand';
import { Agent, AgentState as AgentStateEnum, Relationship } from '@/types/agent';
import { Memory } from '@/types/memory';

interface AgentState {
  agents: Map<string, Agent>;
}

interface AgentStore extends AgentState {
  getAgent: (id: string) => Agent | undefined;
  setAgent: (id: string, agent: Agent) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  clearAgents: () => void;
  addMemory: (agentId: string, memory: Memory) => void;
  getAllAgents: () => Agent[];
  initializeAgents: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: new Map(),

  getAgent: (id) => {
    return get().agents.get(id);
  },

  setAgent: (id, agent) => {
    set((state) => ({
      agents: new Map(state.agents).set(id, agent),
    }));
  },

  addAgent: (agent) => {
    set((state) => ({
      agents: new Map(state.agents).set(agent.id, agent),
    }));
  },

  removeAgent: (id) => {
    set((state) => {
      const agents = new Map(state.agents);
      agents.delete(id);
      return { agents };
    });
  },

  updateAgent: (id, updates) => {
    set((state) => {
      const agents = new Map(state.agents);
      const agent = agents.get(id);
      if (agent) {
        agents.set(id, {
          ...agent,
          ...updates
        });
      }
      return { agents };
    });
  },

  clearAgents: () => {
    set({ agents: new Map() });
  },

  addMemory: (agentId: string, memory: Memory) => {
    set((state) => {
      const agents = new Map(state.agents);
      const agent = agents.get(agentId);
      if (agent) {
        const memories = [...agent.memories, memory];
        agents.set(agentId, {
          ...agent,
          memories
        });
      }
      return { agents };
    });
  },
  
  getAllAgents: () => {
    return Array.from(get().agents.values());
  },
  
  initializeAgents: () => {
    const store = get();
    
    // 清除现有的Agent
    store.clearAgents();
    
    // 添加预设的初始Agent
    store.addAgent({
      id: '1',
      name: '小明',
      position: { x: 5, y: 5 },
      state: AgentStateEnum.IDLE,
      relationships: new Map<string, Relationship>(),
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
    });
    
    store.addAgent({
      id: '2',
      name: '小红',
      position: { x: 10, y: 10 },
      state: AgentStateEnum.IDLE,
      relationships: new Map<string, Relationship>(),
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
    });
    
    store.addAgent({
      id: '3',
      name: '老王',
      position: { x: 15, y: 5 },
      state: AgentStateEnum.WORKING,
      relationships: new Map<string, Relationship>(),
      memories: [],
      attributes: {
        energy: 90,
        mood: 40,
        sociability: 50
      },
      personality: '勤劳、严谨、有责任感',
      currentAction: '正在经营商店',
      traits: ['诚实', '勤奋', '讲信用'],
      schedule: {
        '7:00': '起床',
        '7:30': '开店准备',
        '8:00': '开店',
        '12:30': '午休',
        '13:30': '继续营业',
        '19:00': '关店',
        '19:30': '晚餐',
        '21:00': '记账',
        '22:00': '休息'
      },
      needs: {
        energy: 70,
        social: 50,
        fun: 40
      }
    });
    
    store.addAgent({
      id: '4',
      name: '小张',
      position: { x: 7, y: 15 },
      state: AgentStateEnum.RESTING,
      relationships: new Map<string, Relationship>(),
      memories: [],
      attributes: {
        energy: 70,
        mood: 70,
        sociability: 90
      },
      personality: '外向、乐观、喜欢表演',
      currentAction: '正在休息',
      traits: ['活力四射', '爱说笑', '乐观向上'],
      schedule: {
        '8:30': '起床',
        '9:00': '早餐',
        '10:00': '练习表演',
        '12:30': '午餐',
        '14:00': '与朋友聚会',
        '18:00': '晚餐',
        '19:30': '娱乐活动',
        '22:30': '休息'
      },
      needs: {
        energy: 60,
        social: 90,
        fun: 80
      }
    });
  }
})); 