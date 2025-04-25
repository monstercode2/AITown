from typing import List, Optional
from backend.models import Memory
from backend.services.supabase_client import supabase

class MemoryService:
    def get_memories(self, agent_id: Optional[str] = None, limit: Optional[int] = None, offset: int = 0) -> List[Memory]:
        query = supabase.table("memories").select("*")
        if agent_id:
            query = query.eq("agent_id", agent_id)
        if offset:
            query = query.range(offset, offset + (limit or 100) - 1)
        elif limit:
            query = query.range(0, limit - 1)
        res = query.execute()
        return [Memory(**m) for m in res.data]

    def add_memory(self, memory: Memory) -> Memory:
        supabase.table("memories").insert(memory.dict(exclude_none=True)).execute()
        return memory

    def delete_memory(self, memory_id: str) -> bool:
        res = supabase.table("memories").delete().eq("id", memory_id).execute()
        return bool(res.data) 