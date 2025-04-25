from fastapi import WebSocket
from typing import Set, Dict

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

class EventWSManager(ConnectionManager):
    def __init__(self):
        super().__init__()
        self.last_event_id = None

    async def broadcast_new_events(self, events):
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