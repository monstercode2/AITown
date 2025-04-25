from typing import List, Optional
from backend.models import Event, Memory
from backend.services.supabase_client import supabase
from backend.services.memory_service import MemoryService
from backend.services.agent_service import AgentService
import time

class EventService:
    def get_events(self, type: Optional[str] = None, limit: Optional[int] = None, offset: int = 0) -> List[Event]:
        query = supabase.table("events").select("*")
        if type:
            query = query.eq("type", type)
        if offset:
            query = query.range(offset, offset + (limit or 100) - 1)
        elif limit:
            query = query.range(0, limit - 1)
        res = query.execute()
        return [Event(**e) for e in res.data]

    def add_event(self, event: Event) -> Event:
        supabase.table("events").insert(event.dict(by_alias=True, exclude_none=True)).execute()
        # 自动为受影响 agent 写入记忆，并同步属性
        self._write_event_memories_and_update_agents(event)
        return event

    def delete_event(self, event_id: str) -> bool:
        res = supabase.table("events").delete().eq("id", event_id).execute()
        return bool(res.data)

    def _write_event_memories_and_update_agents(self, event: Event):
        agent_service = AgentService()
        for agent_id in event.affectedAgents:
            # 写入记忆
            mem = Memory(
                id=f"{event.id}-{agent_id}",
                agent_id=agent_id,
                content=f"参与事件: {event.description}",
                timestamp=event.startTime,
                importance=2,
                type="EVENT",
                related_agents=event.affectedAgents,
                tags=[event.type.lower()]
            )
            MemoryService().add_memory(mem)
            # 更新 agent 属性（如有 impact）
            if event.impact:
                agent = agent_service.update_agent(agent_id, {k: v for k, v in event.impact.items()}) 