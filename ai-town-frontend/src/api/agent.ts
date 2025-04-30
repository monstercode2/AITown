import type { Agent } from '../types/agent'

export async function fetchAgents(): Promise<Agent[]> {
  try {
    console.log('开始获取Agent列表...')
    const res = await fetch('/api/agent')
    if (!res.ok) {
      console.error('获取Agent列表失败:', res.status, res.statusText)
      return []
    }
    
    const json = await res.json()
    console.log('Agent API返回原始数据:', json)
    
    // 兼容多种响应格式
    let agents: Agent[] = []
    
    if (json && typeof json === 'object') {
      // ResponseModel格式: {code:0, msg:'success', data:[...]}
      if (Array.isArray(json.data)) {
        agents = json.data
        console.log(`从ResponseModel.data中获取到${agents.length}个Agent`)
      } 
      // 直接返回数组
      else if (Array.isArray(json)) {
        agents = json
        console.log(`直接从响应获取到${agents.length}个Agent`)
      }
      // 其他未知格式，尝试解析
      else {
        console.warn('Agent API返回了未知格式:', json)
        if (json.agents && Array.isArray(json.agents)) {
          agents = json.agents
          console.log(`从json.agents获取到${agents.length}个Agent`)
        }
      }
    }
    
    // 确保所有agent都有memories字段（即使为空）
    agents.forEach(agent => {
      if (!agent.memories) agent.memories = []
    })
    
    // 如果没有agent，创建测试agent
    if (agents.length === 0) {
      console.warn('从API获取的Agent为空，创建本地测试Agent')
      agents = [
        {
          id: '1',
          name: '林芳',
          avatar: '👩‍⚕️',
          position: { x: 200, y: 200 },
          state: 'IDLE',
          personality: '理性、细心、乐于助人',
          memories: []
        },
        {
          id: '2',
          name: '王伟',
          avatar: '👨‍🔧',
          position: { x: 400, y: 200 },
          state: 'IDLE',
          personality: '勤劳、实干、诚信',
          memories: []
        }
      ]
    }
    
    return agents
  } catch (err) {
    console.error('获取Agent列表异常:', err)
    // 返回测试agent以确保UI不会崩溃
    return [
      {
        id: 'test-1',
        name: '测试角色',
        avatar: '👤',
        position: { x: 300, y: 300 },
        state: 'IDLE',
        personality: '这是前端自动生成的测试角色',
        memories: []
      }
    ]
  }
}

export async function addAgent(agent: Partial<Agent>): Promise<Agent> {
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    })
    if (!res.ok) {
      console.error('添加Agent失败:', res.status, res.statusText)
      throw new Error('添加Agent失败')
    }
    
    const json = await res.json()
    return json.data || json
  } catch (err) {
    console.error('添加Agent异常:', err)
    throw err
  }
}

export async function deleteAgent(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/agent/${id}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      console.error('删除Agent失败:', res.status, res.statusText)
      return false
    }
    return true
  } catch (err) {
    console.error('删除Agent异常:', err)
    return false
  }
}

export async function updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
  try {
    const res = await fetch(`/api/agent/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!res.ok) {
      console.error('更新Agent失败:', res.status, res.statusText)
      throw new Error('更新Agent失败')
    }
    
    const json = await res.json()
    return json.data || json
  } catch (err) {
    console.error('更新Agent异常:', err)
    throw err
  }
}

export async function searchAgentsByVector(embedding: number[], top_k: number = 5) {
  const res = await fetch('/api/agent/search_by_vector', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embedding, top_k })
  })
  if (!res.ok) throw new Error('向量Agent检索失败')
  const data = await res.json()
  return Array.isArray(data.data) ? data.data : []
} 