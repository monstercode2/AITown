from backend.state import agents, events, simulation_status, stop_event
from backend.models import Event, Memory
import time

def main_loop():
    global simulation_status
    while not stop_event.is_set():
        if simulation_status == "running":
            event = Event(
                id=str(int(time.time() * 1000)),
                type="ENVIRONMENTAL",
                description="自动生成的事件",
                affectedAgents=[a.id for a in agents],
                startTime=int(time.time() * 1000),
                duration=10000,
                impact={"mood": 1}
            )
            events.append(event)
            for agent in agents:
                if agent.id in event.affectedAgents:
                    mem = Memory(
                        id=f"{event.id}-{agent.id}",
                        content=f"参与事件: {event.description}",
                        timestamp=event.startTime,
                        importance=2,
                        type="EVENT",
                        relatedAgents=event.affectedAgents,
                        tags=[event.type.lower()]
                    )
                    agent.memories.append(mem)
                    agent.attributes.mood += event.impact.get("mood", 0)
                    agent.currentAction = f"响应事件 {event.id}"
                    # 连锁事件等逻辑可继续补充
        time.sleep(5) 