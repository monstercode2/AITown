import { NextApiRequest, NextApiResponse } from 'next';
import { useAgentStore } from '@/store/agentStore';
import { Logger, LogCategory } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentState } from '@/types/agent';

/**
 * Agent API路由
 * 提供获取、添加、更新和删除Agent的功能
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  try {
    const agentStore = useAgentStore.getState();
    
    // GET: 获取Agent列表或单个Agent
    if (req.method === 'GET') {
      const { id } = req.query;
      
      // 获取单个Agent
      if (id && typeof id === 'string') {
        const agent = agentStore.getAgent(id);
        
        if (!agent) {
          return res.status(404).json({ error: `Agent不存在: ${id}` });
        }
        
        return res.status(200).json(agent);
      }
      
      // 获取所有Agent
      const agents = agentStore.getAllAgents();
      return res.status(200).json(agents);
    }
    
    // POST: 添加新Agent
    if (req.method === 'POST') {
      const agentData = req.body;
      
      // 验证必填字段
      if (!agentData.name || !agentData.position) {
        return res.status(400).json({ error: '缺少必要字段: name或position' });
      }
      
      // 创建新Agent
      const newAgent: Agent = {
        id: agentData.id || uuidv4(),
        name: agentData.name,
        position: agentData.position,
        state: agentData.state || AgentState.IDLE,
        relationships: new Map(),
        memories: [],
        attributes: agentData.attributes || {
          energy: 100,
          mood: 50,
          sociability: 50
        },
        ...agentData
      };
      
      // 添加到存储
      agentStore.addAgent(newAgent);
      
      Logger.info(LogCategory.AGENT, `创建新Agent: ${newAgent.id} (${newAgent.name})`);
      
      return res.status(201).json(newAgent);
    }
    
    // PUT: 更新Agent
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: '缺少Agent ID' });
      }
      
      const agent = agentStore.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({ error: `Agent不存在: ${id}` });
      }
      
      const updates = req.body;
      
      // 更新Agent
      agentStore.updateAgent(id, updates);
      
      const updatedAgent = agentStore.getAgent(id);
      
      Logger.info(LogCategory.AGENT, `更新Agent: ${id}`, { 
        updates: Object.keys(updates) 
      });
      
      return res.status(200).json(updatedAgent);
    }
    
    // DELETE: 删除Agent
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: '缺少Agent ID' });
      }
      
      const agent = agentStore.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({ error: `Agent不存在: ${id}` });
      }
      
      // 删除Agent
      agentStore.removeAgent(id);
      
      Logger.info(LogCategory.AGENT, `删除Agent: ${id} (${agent.name})`);
      
      return res.status(200).json({ success: true, message: `Agent已删除: ${id}` });
    }
    
    // 不支持的方法
    return res.status(405).json({ error: '方法不允许' });
  } catch (error) {
    Logger.error(LogCategory.API, '处理Agent API请求时出错', error);
    return res.status(500).json({ 
      error: '内部服务器错误',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
} 