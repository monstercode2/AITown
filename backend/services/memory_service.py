from typing import List, Optional
from backend.models import Memory
from backend.services.supabase_client import supabase
from backend.services.llm_service import LLMService
import time

class MemoryService:
    def get_memories(self, agent_id: Optional[str] = None, limit: Optional[int] = None, offset: int = 0) -> List[Memory]:
        query = supabase.table("memories").select("*")
        if agent_id:
            query = query.eq("agent_id", agent_id)
        if offset:
            query = query.range(offset, offset + (limit or 100) - 1)
        elif limit:
            query = query.range(0, limit - 1)
        for i in range(2):
            try:
                res = query.execute()
                # 修复历史脏数据：embedding为字符串时自动转为list
                for m in res.data:
                    if isinstance(m.get('embedding'), str):
                        try:
                            import json
                            m['embedding'] = json.loads(m['embedding'])
                        except Exception:
                            m['embedding'] = None
                return [Memory(**m) for m in res.data]
            except Exception as e:
                if i == 0:
                    time.sleep(0.5)
                else:
                    raise RuntimeError(f"Supabase连接异常: {e}")

    def add_memory(self, memory: Memory) -> Memory:
        # 自动生成 embedding
        if memory.embedding is None and memory.content:
            memory.embedding = LLMService().get_embedding(memory.content)
        supabase.table("memories").insert(memory.dict(exclude_none=True)).execute()
        return memory

    def delete_memory(self, memory_id: str) -> bool:
        res = supabase.table("memories").delete().eq("id", memory_id).execute()
        return bool(res.data)

    def search_memories_by_embedding(self, query_embedding: list, top_k: int = 5) -> list:
        """
        基于embedding向量的相似度检索，返回最相似的top_k条Memory。
        依赖Supabase SQL自定义函数 match_memories。
        """
        res = supabase.rpc("match_memories", {"query_embedding": query_embedding, "match_count": top_k}).execute()
        return [Memory(**m) for m in res.data] 