from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.services.websocket_service import ConnectionManager, EventWSManager, AgentWSManager
from backend.state import events, agents, simulation_status

router = APIRouter()

# 单例实例
manager = ConnectionManager()
ws_event_manager = EventWSManager()
ws_agent_manager = AgentWSManager()

@router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await ws_event_manager.connect(websocket)
    try:
        await websocket.send_json({"history": [e.dict() for e in events]})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_event_manager.disconnect(websocket)

@router.websocket("/ws/agent/{agent_id}")
async def websocket_agent(websocket: WebSocket, agent_id: str):
    await ws_agent_manager.connect(agent_id, websocket)
    try:
        agent = next((a for a in agents if a.id == agent_id), None)
        if agent:
            await websocket.send_json({"agent": agent.dict()})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_agent_manager.disconnect(agent_id, websocket)

@router.websocket("/ws/simulation")
async def websocket_simulation(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "status": simulation_status,
            "agents": [a.dict() for a in agents],
            "events": [e.dict() for e in events],
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket) 