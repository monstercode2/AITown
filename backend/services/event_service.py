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
        # 环境类记忆自动同步（如政策/税率变动）
        is_policy = event.type.upper() == 'POLICY' or \
            ('税' in event.description or '政策' in event.description or (event.meta and ('税' in str(event.meta) or '政策' in str(event.meta))))
        if is_policy:
            agent_service = AgentService()
            memory_service = MemoryService()
            agents = agent_service.get_agents()
            for agent in agents:
                # 删除旧的政策/税率相关记忆
                old_memories = memory_service.get_memories(agent.id, limit=100)
                for mem in old_memories:
                    if '税' in mem.content or '政策' in mem.content:
                        memory_service.delete_memory(mem.id)
                # 写入最新政策记忆
                mem = Memory(
                    id=f"{event.id}-{agent.id}-policy",
                    agent_id=agent.id,
                    content=f"最新政策/税率: {event.description}",
                    timestamp=event.startTime,
                    importance=3,
                    type="POLICY",
                    related_agents=[],
                    tags=["policy"]
                )
                memory_service.add_memory(mem)
        supabase.table("events").insert(event.dict(by_alias=True, exclude_none=True)).execute()
        # 自动为受影响 agent 写入记忆，并同步属性
        self._write_event_memories_and_update_agents(event)
        return event

    def delete_event(self, event_id: str) -> bool:
        res = supabase.table("events").delete().eq("id", event_id).execute()
        return bool(res.data)

    def _write_event_memories_and_update_agents(self, event: Event):
        agent_service = AgentService()
        # 新增：支持互动事件写入双方记忆
        if event.from_agent and event.to_agent and event.content:
            # 发起者记忆
            mem_from = Memory(
                id=f"{event.id}-{event.from_agent}-from",
                agent_id=event.from_agent,
                content=f"你对{event.to_agent}说: {event.content}",
                timestamp=event.startTime,
                importance=2,
                type="DIALOGUE",
                related_agents=[event.to_agent],
                tags=[event.type.lower()]
            )
            MemoryService().add_memory(mem_from)
            # 接收者记忆
            mem_to = Memory(
                id=f"{event.id}-{event.to_agent}-to",
                agent_id=event.to_agent,
                content=f"{event.from_agent}对你说: {event.content}",
                timestamp=event.startTime,
                importance=2,
                type="DIALOGUE",
                related_agents=[event.from_agent],
                tags=[event.type.lower()]
            )
            MemoryService().add_memory(mem_to)
            # 受影响agent属性更新（如有impact）
            for agent_id in [event.from_agent, event.to_agent]:
                if event.impact:
                    agent_service.update_agent(agent_id, {k: v for k, v in event.impact.items()})
        else:
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
                    agent_service.update_agent(agent_id, {k: v for k, v in event.impact.items()}) 