from fastapi import APIRouter, Body, HTTPException, Depends
from typing import List
from backend.models import Agent, ResponseModel, AgentUpdateModel
from backend.services.agent_service import AgentService
from backend.state import agents

router = APIRouter()

def get_agent_service():
    return AgentService()

@router.get("/api/agent")
def get_agents(service: AgentService = Depends(get_agent_service)):
    return ResponseModel(data=[a.dict() for a in service.get_agents()])

@router.post("/api/agent")
def add_agent(agent: Agent, service: AgentService = Depends(get_agent_service)):
    service.add_agent(agent)
    return ResponseModel(data=agent.dict())

@router.put("/api/agent/{agent_id}")
def update_agent(agent_id: str, updates: AgentUpdateModel = Body(...), service: AgentService = Depends(get_agent_service)):
    updated = service.update_agent(agent_id, updates)
    if updated:
        return ResponseModel(data=updated.dict())
    raise HTTPException(status_code=404, detail="Agent不存在")

@router.delete("/api/agent/{agent_id}")
def delete_agent(agent_id: str, service: AgentService = Depends(get_agent_service)):
    success = service.delete_agent(agent_id)
    return ResponseModel(data={"success": success, "message": f"Agent已删除: {agent_id}"}) 