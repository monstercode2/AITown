from fastapi import FastAPI, Request, HTTPException, Query, Body, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
from typing import List, Optional, Dict, Any, Set
from datetime import datetime
import threading
import time
import requests
import asyncio
from backend.models import AgentAttributes, Relationship, Memory, Agent, Event, ResponseModel, SimulationSettings, AgentUpdateModel, EventQuery, LLMDecideRequest
from backend.routers.agent import router as agent_router
from backend.routers.event import router as event_router
from backend.routers.simulation import router as simulation_router
from backend.routers.llm import router as llm_router
from backend.routers.log import router as log_router
from backend.routers.websocket import router as websocket_router
from backend.state import agents, events, simulation_status, simulation_thread, stop_event
from backend.loop import main_loop
from backend.config_manager import ConfigManager
from backend.services.llm_service import LLMService
from backend.routers.memory import router as memory_router
from backend.services.supabase_client import supabase

app = FastAPI()

# 允许跨域，便于前端本地开发
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket 连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# 新增：事件推送和单 agent 状态推送
class EventWSManager(ConnectionManager):
    def __init__(self):
        super().__init__()
        self.last_event_id = None

    async def broadcast_new_events(self):
        # 只推送最新事件
        if events:
            latest = events[-1]
            if latest.id != self.last_event_id:
                self.last_event_id = latest.id
                await self.broadcast({"event": latest.dict()})

class AgentWSManager:
    def __init__(self):
        self.agent_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, agent_id: str, websocket: WebSocket):
        await websocket.accept()
        self.agent_connections.setdefault(agent_id, set()).add(websocket)

    def disconnect(self, agent_id: str, websocket: WebSocket):
        if agent_id in self.agent_connections:
            self.agent_connections[agent_id].discard(websocket)
            if not self.agent_connections[agent_id]:
                del self.agent_connections[agent_id]

    async def broadcast(self, agent_id: str, message: dict):
        for ws in list(self.agent_connections.get(agent_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(agent_id, ws)

# 实例化
ws_event_manager = EventWSManager()
ws_agent_manager = AgentWSManager()

@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await ws_event_manager.connect(websocket)
    try:
        # 首次推送所有历史事件
        await websocket.send_json({"history": [e.dict() for e in events]})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_event_manager.disconnect(websocket)

@app.websocket("/ws/agent/{agent_id}")
async def websocket_agent(websocket: WebSocket, agent_id: str):
    await ws_agent_manager.connect(agent_id, websocket)
    try:
        # 首次推送当前 agent 状态
        agent = next((a for a in agents if a.id == agent_id), None)
        if agent:
            await websocket.send_json({"agent": agent.dict()})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_agent_manager.disconnect(agent_id, websocket)

# ========== Simulation 控制 ========== #
@app.get("/api/simulation")
def get_simulation_status():
    return ResponseModel(
        data={
            "status": simulation_status,
            "agents": [a.dict() for a in agents],
            "events": [e.dict() for e in events],
        }
    )

@app.post("/api/simulation")
def control_simulation(action: str = Query(...)):
    global simulation_status, simulation_thread, stop_event
    if action == 'start':
        if simulation_status != "running":
            simulation_status = "running"
            stop_event.clear()
            if simulation_thread is None or not simulation_thread.is_alive():
                simulation_thread = threading.Thread(target=main_loop, daemon=True)
                simulation_thread.start()
        return ResponseModel(data={"status": "running"})
    elif action == 'pause':
        simulation_status = "paused"
        return ResponseModel(data={"status": "paused"})
    elif action == 'reset':
        simulation_status = "idle"
        stop_event.set()
        events.clear()
        return ResponseModel(data={"status": "idle"})
    else:
        raise HTTPException(status_code=400, detail="无效的操作")

@app.put("/api/simulation")
def update_simulation_settings(settings: SimulationSettings = Body(...)):
    # TODO: 更新设置逻辑
    return ResponseModel(data={"settings": settings.dict()})

# ========== Event 增删查 ========== #
@app.get("/api/event")
def get_events(type: Optional[str] = None, limit: Optional[int] = None, offset: int = 0):
    filtered = events
    if type:
        filtered = [e for e in events if e.type == type]
    if offset or limit:
        filtered = filtered[offset:offset+limit if limit else None]
    return ResponseModel(data=[e.dict() for e in filtered])

@app.post("/api/event")
def add_event(event: Event):
    events.append(event)
    return ResponseModel(data=event.dict())

@app.delete("/api/event/{event_id}")
def delete_event(event_id: str):
    global events
    events = [e for e in events if e.id != event_id]
    return ResponseModel(data={"success": True, "message": f"事件已删除: {event_id}"})

# ========== Agent 日志 ========== #
@app.get("/api/agents/log")
def get_agent_log(id: str):
    agent_events = [e for e in events if id in e.affectedAgents]
    agent_events.sort(key=lambda e: e.startTime)
    return ResponseModel(data=[e.dict() for e in agent_events])

@app.post("/api/agent/{agent_id}/llm_decide")
def agent_llm_decide(agent_id: str, req: LLMDecideRequest):
    agent = next((a for a in agents if a.id == agent_id), None)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent不存在")
    try:
        mem = LLMService().llm_decide(agent, req.prompt)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM调用失败: {e}")
    return ResponseModel(data={"response": mem.content, "memory_id": mem.id})

@app.post("/api/reload_config")
def reload_config():
    ConfigManager.reload()
    # 重新加载 agents（如需热更新 agent 实例，可在此处实现）
    global agents
    agents.clear()
    agents.extend([Agent(**a) for a in ConfigManager.get_agent_presets()])
    return {"status": "reloaded"}

def init_default_agents():
    res = supabase.table("agents").select("id").execute()
    if not res.data:  # 表为空
        presets = ConfigManager.get_agent_presets()
        db_fields = {"id", "name", "position", "state", "avatar", "personality", "traits", "attributes", "emotion", "relationships"}
        agents_to_insert = []
        for a in presets:
            agent_data = {k: v for k, v in a.items() if k in db_fields}
            # 补全缺省字段
            for f in db_fields:
                if f not in agent_data:
                    if f in ["traits", "relationships"]:
                        agent_data[f] = [] if f == "traits" else {}
                    elif f == "attributes":
                        agent_data[f] = {"energy": 100, "mood": 50, "sociability": 50}
                    else:
                        agent_data[f] = ""
            agents_to_insert.append(agent_data)
        if agents_to_insert:
            supabase.table("agents").insert(agents_to_insert).execute()

# 注册数据库持久化API路由
app.include_router(agent_router)
app.include_router(event_router)
app.include_router(simulation_router)
app.include_router(llm_router)
app.include_router(log_router)
app.include_router(websocket_router)
app.include_router(memory_router)

# FastAPI app初始化后调用
init_default_agents() 