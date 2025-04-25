from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import time

class AgentAttributes(BaseModel):
    energy: int = 100
    mood: int = 50
    sociability: int = 50

class Relationship(BaseModel):
    targetId: str
    affinity: int = 0
    interactions: int = 0
    lastInteraction: Optional[int] = None

class Memory(BaseModel):
    id: str
    agent_id: str
    content: str
    timestamp: int
    importance: int = 1
    type: str = "OBSERVATION"
    relatedAgents: Optional[List[str]] = None
    location: Optional[str] = None
    tags: Optional[List[str]] = None

class Agent(BaseModel):
    id: str
    name: str
    position: Dict[str, int]
    state: str
    llmModel: Optional[str] = None
    personality: Optional[str] = None
    currentAction: Optional[str] = None
    traits: Optional[List[str]] = None
    schedule: Optional[Dict[str, str]] = None
    needs: Optional[Dict[str, int]] = None
    attributes: AgentAttributes = Field(default_factory=AgentAttributes)
    memories: List[Memory] = Field(default_factory=list)
    relationships: Dict[str, Relationship] = Field(default_factory=dict)
    llmPrompts: Optional[dict] = None

class Event(BaseModel):
    id: str
    type: str
    description: str
    affectedAgents: List[str] = Field(default_factory=list, alias="affected_agents")
    startTime: int = Field(default_factory=lambda: int(time.time() * 1000), alias="start_time")
    duration: int
    impact: Dict[str, Any] = Field(default_factory=dict)
    meta: Optional[dict] = None
    scope: Optional[str] = None
    position: Optional[dict] = None

class ResponseModel(BaseModel):
    code: int = 0
    msg: str = "success"
    data: Any = None

class SimulationSettings(BaseModel):
    speed: Optional[int] = None
    environment: Optional[str] = None

class AgentUpdateModel(BaseModel):
    name: Optional[str] = None
    position: Optional[Dict[str, int]] = None
    state: Optional[str] = None
    llmModel: Optional[str] = None
    personality: Optional[str] = None
    currentAction: Optional[str] = None
    traits: Optional[List[str]] = None
    schedule: Optional[Dict[str, str]] = None
    needs: Optional[Dict[str, int]] = None
    attributes: Optional[AgentAttributes] = None
    memories: Optional[List[Memory]] = None
    relationships: Optional[Dict[str, Relationship]] = None

class EventQuery(BaseModel):
    type: Optional[str] = None
    limit: Optional[int] = None
    offset: int = 0

class LLMDecideRequest(BaseModel):
    prompt: str 