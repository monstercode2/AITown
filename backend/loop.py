from backend.state import agents, events, simulation_status, stop_event
from backend.models import Event, Memory
import time
from backend.services.event_service import EventService
from backend.services.llm_service import LLMService
from backend.services.agent_service import AgentService

def main_loop():
    global simulation_status
    event_service = EventService()
    llm_service = LLMService()
    agent_service = AgentService()
    def generate_and_persist_event_llm():
        # 组装context，包含所有agent状态和当前时间
        now = time.localtime()
        context = {
            "time": f"{now.tm_hour:02d}:{now.tm_min:02d}",
            "day": now.tm_mday,
            "hour": now.tm_hour,
            "agents": [
                {
                    "id": a.id,
                    "name": a.name,
                    "position": a.position,
                    "state": a.state,
                    "emotion": getattr(a, 'emotion', None),
                    "personality": getattr(a, 'personality', None),
                    "traits": getattr(a, 'traits', None),
                    "attributes": getattr(a, 'attributes', None),
                    "relationships": getattr(a, 'relationships', None)
                } for a in agents
            ]
        }
        # 1. 生成事件
        event_obj = llm_service.generate_event_via_llm(context)
        event = Event(
            id=event_obj.get('id', str(int(time.time() * 1000))),
            type=event_obj.get('type', 'LLM'),
            description=event_obj.get('description', ''),
            affectedAgents=event_obj.get('affectedAgents', event_obj.get('affected_agents', [])),
            startTime=event_obj.get('start_time', int(time.time() * 1000)),
            duration=event_obj.get('duration', 300000),
            impact=event_obj.get('impact', {}),
            meta=event_obj,
            scope=event_obj.get('scope'),
            position=event_obj.get('position'),
            content=event_obj.get('content', None)
        )
        event_service.add_event(event)
        # 2. 让所有受影响的agent依次反馈
        for agent_id in event.affectedAgents:
            agent = next((a for a in agents if a.id == agent_id), None)
            if agent:
                prompt = event.description
                try:
                    llm_service.llm_decide(agent, prompt, event=event)
                except Exception as e:
                    print(f"Agent {agent_id} 反馈事件时出错: {e}")
    # 启动时立即生成一次
    if simulation_status == "running":
        generate_and_persist_event_llm()
    while not stop_event.is_set():
        if simulation_status == "running":
            time.sleep(60)  # 每分钟一次
            generate_and_persist_event_llm()
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
        else:
            time.sleep(1) 