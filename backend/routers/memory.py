from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from backend.models import Memory, ResponseModel
from backend.services.memory_service import MemoryService

router = APIRouter()

def get_memory_service():
    return MemoryService()

@router.get("/api/memory")
def get_memories(agent_id: Optional[str] = None, limit: Optional[int] = None, offset: int = 0, service: MemoryService = Depends(get_memory_service)):
    memories = service.get_memories(agent_id, limit, offset)
    return ResponseModel(data=[m.dict() for m in memories])

@router.post("/api/memory")
def add_memory(memory: Memory, service: MemoryService = Depends(get_memory_service)):
    service.add_memory(memory)
    return ResponseModel(data=memory.dict())

@router.delete("/api/memory/{memory_id}")
def delete_memory(memory_id: str, service: MemoryService = Depends(get_memory_service)):
    ok = service.delete_memory(memory_id)
    if not ok:
        raise HTTPException(status_code=404, detail="记忆不存在")
    return ResponseModel(data={"deleted": True}) 