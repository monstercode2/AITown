import threading
from typing import Any
from backend.state import simulation_status, simulation_thread, stop_event, events
from backend.loop import main_loop

class SimulationService:
    def get_status(self) -> dict:
        return {
            "status": simulation_status,
            "events": [e.dict() for e in events],
        }

    def control(self, action: str) -> dict:
        global simulation_status, simulation_thread, stop_event
        if action == 'start':
            if simulation_status != "running":
                simulation_status = "running"
                stop_event.clear()
                if simulation_thread is None or not simulation_thread.is_alive():
                    simulation_thread = threading.Thread(target=main_loop, daemon=True)
                    simulation_thread.start()
            return {"status": "running"}
        elif action == 'pause':
            simulation_status = "paused"
            return {"status": "paused"}
        elif action == 'reset':
            simulation_status = "idle"
            stop_event.set()
            events.clear()
            return {"status": "idle"}
        else:
            raise ValueError("无效的操作")

    def update_settings(self, settings: Any) -> dict:
        # TODO: 实现设置更新逻辑
        return {"settings": settings} 