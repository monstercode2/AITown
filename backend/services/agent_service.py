from typing import List, Optional
from backend.models import Agent, AgentUpdateModel
from backend.services.supabase_client import supabase
from backend.services.memory_service import MemoryService
import time

class AgentService:
    def get_agents(self) -> List[Agent]:
        # 添加重试机制和异常处理
        for i in range(3):  # 最多重试2次
            try:
                res = supabase.table("agents").select("*").execute()
                agents = [Agent(**a) for a in res.data]
                memory_service = MemoryService()
                for agent in agents:
                    try:
                        agent.memories = memory_service.get_memories(agent.id, limit=5)
                    except Exception as e:
                        print(f"警告: 获取Agent {agent.id} 的记忆失败: {e}")
                        agent.memories = []
                return agents
            except Exception as e:
                if i < 2:  # 如果不是最后一次尝试
                    print(f"警告: 获取Agent列表第{i+1}次尝试失败，将重试: {e}")
                    time.sleep(0.5)  # 休眠一小段时间再重试
                else:
                    print(f"错误: 获取Agent列表失败，已重试{i}次: {e}")
                    # 在最终失败时返回空列表，而不是抛异常中断整个API请求
                    return []

    def add_agent(self, agent: Agent) -> Agent:
        # 只保留数据库实际字段，排除memories/llmPrompts/embedding等
        db_fields = {"id", "name", "position", "state", "avatar", "personality", "traits", "attributes", "emotion", "relationships"}
        agent_data = {k: v for k, v in agent.dict(exclude_none=True).items() if k in db_fields}
        # 添加异常处理
        try:
            supabase.table("agents").insert(agent_data).execute()
            return agent
        except Exception as e:
            print(f"错误: 添加Agent失败: {e}")
            # 仍返回agent对象，但前端可能需要处理未成功添加的情况
            return agent

    def update_agent(self, agent_id: str, updates: AgentUpdateModel) -> Optional[Agent]:
        update_data = updates.dict(exclude_unset=True)
        # 添加异常处理
        try:
            res = supabase.table("agents").update(update_data).eq("id", agent_id).execute()
            if res.data:
                return Agent(**res.data[0])
            return None
        except Exception as e:
            print(f"错误: 更新Agent {agent_id} 失败: {e}")
            return None

    def delete_agent(self, agent_id: str) -> bool:
        # 添加异常处理
        try:
            res = supabase.table("agents").delete().eq("id", agent_id).execute()
            return bool(res.data)
        except Exception as e:
            print(f"错误: 删除Agent {agent_id} 失败: {e}")
            return False

    def search_agents_by_embedding(self, query_embedding: list, top_k: int = 5) -> list:
        # 添加异常处理
        try:
            res = supabase.rpc("match_agents", {"query_embedding": query_embedding, "match_count": top_k}).execute()
            return [Agent(**a) for a in res.data]
        except Exception as e:
            print(f"错误: 向量检索Agent失败: {e}")
            return [] 