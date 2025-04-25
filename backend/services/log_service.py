from typing import List
from backend.models import Event
from backend.services.supabase_client import supabase

class LogService:
    def get_agent_log(self, agent_id: str) -> List[Event]:
        res = supabase.table("events").select("*").contains("affected_agents", [agent_id]).execute()
        agent_events = [Event(**e) for e in res.data]
        agent_events.sort(key=lambda e: e.startTime)
        return agent_events 