from typing import List, Optional
from backend.models import Agent, AgentUpdateModel
from backend.services.supabase_client import supabase
from backend.services.memory_service import MemoryService

class AgentService:
    def get_agents(self) -> List[Agent]:
        res = supabase.table("agents").select("*").execute()
        agents = [Agent(**a) for a in res.data]
        memory_service = MemoryService()
        for agent in agents:
            agent.memories = memory_service.get_memories(agent.id, limit=5)
        return agents

    def add_agent(self, agent: Agent) -> Agent:
        supabase.table("agents").insert(agent.dict(by_alias=True, exclude_none=True)).execute()
        return agent

    def update_agent(self, agent_id: str, updates: AgentUpdateModel) -> Optional[Agent]:
        update_data = updates.dict(exclude_unset=True)
        res = supabase.table("agents").update(update_data).eq("id", agent_id).execute()
        if res.data:
            return Agent(**res.data[0])
        return None

    def delete_agent(self, agent_id: str) -> bool:
        res = supabase.table("agents").delete().eq("id", agent_id).execute()
        return bool(res.data) 