from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Optional, Any
from backend.models import Event, ResponseModel
from backend.services.event_service import EventService
from backend.services.llm_service import LLMService
from backend.state import events
import time

router = APIRouter()

def get_event_service():
    return EventService()

@router.get("/api/event")
def get_events(type: Optional[str] = None, limit: Optional[int] = None, offset: int = 0, service: EventService = Depends(get_event_service)):
    return ResponseModel(data=[e.dict() for e in service.get_events(type, limit, offset)])

@router.post("/api/event")
def add_event(event: Event, service: EventService = Depends(get_event_service)):
    service.add_event(event)
    return ResponseModel(data=event.dict())

@router.delete("/api/event/{event_id}")
def delete_event(event_id: str, service: EventService = Depends(get_event_service)):
    success = service.delete_event(event_id)
    return ResponseModel(data={"success": success, "message": f"事件已删除: {event_id}"})

# 新增：LLM生成事件接口
@router.post("/api/event/llm_generate")
def llm_generate_event(context: Any = Body(...)):
    """
    context: dict，建议包含 time, day, hour, agents 等
    """
    try:
        event_obj = LLMService().generate_event_via_llm(context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM事件生成失败: {e}")
    # 自动补全事件字段
    event = Event(
        id=str(int(time.time() * 1000)),
        type=event_obj.get('type', 'LLM'),
        description=event_obj.get('description', ''),
        affectedAgents=event_obj.get('affectedAgents', []),
        startTime=int(time.time() * 1000),
        duration=event_obj.get('duration', 300000),
        impact=event_obj.get('impact', {}),
        meta=event_obj,
        scope=event_obj.get('scope'),
        position=event_obj.get('position'),
    )
    events.append(event)
    return ResponseModel(data=event.dict()) 