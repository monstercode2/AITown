from fastapi import APIRouter, Depends
from backend.models import ResponseModel
from backend.services.log_service import LogService

router = APIRouter()

def get_log_service():
    return LogService()

@router.get("/api/agents/log")
def get_agent_log(id: str, service: LogService = Depends(get_log_service)):
    agent_events = service.get_agent_log(id)
    return ResponseModel(data=[e.dict() for e in agent_events]) 