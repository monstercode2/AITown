import requests
import time
import uuid

BASE = "http://localhost:8000"

# 新增Agent
def add_agent(name, x, y, avatar):
    agent_id = str(uuid.uuid4())
    agent_data = {
        "id": agent_id,
        "name": name,
        "position": {"x": x, "y": y},
        "avatar": avatar,
        "state": "idle",
        "personality": "友善",
        "traits": ["乐观", "外向"],
        "attributes": {"energy": 100, "mood": 50, "sociability": 50},
        "emotion": "平静",
        "relationships": {},
    }
    resp = requests.post(f"{BASE}/api/agent", json=agent_data)
    try:
        print("新增Agent:", resp.json())
    except Exception:
        print("新增Agent响应内容:", resp.text)
    return agent_id

# 获取所有Agent
def get_agents():
    resp = requests.get(f"{BASE}/api/agent")
    agents = resp.json().get('data', [])
    print(f"Agent列表({len(agents)}):", [a['name'] for a in agents])
    return agents

# 启动仿真
def start_sim():
    resp = requests.post(f"{BASE}/api/simulation?action=start")
    print("启动仿真:", resp.json())

# 获取事件列表
def get_events():
    resp = requests.get(f"{BASE}/api/event")
    events = resp.json().get('data', [])
    print(f"事件列表({len(events)}):", [e['type']+':'+e.get('content','') for e in events])
    return events

# 检查Agent情感和关系
def check_agent_emotion_relationship():
    agents = get_agents()
    for a in agents:
        print(f"Agent: {a['name']} 情感: {a.get('emotion','-')} 关系: {a.get('relationships',{})}")

if __name__ == "__main__":
    print("=== AI小镇后端API自动化调试 ===")
    aid = add_agent("测试Agent1", 200, 200, "😊")
    add_agent("测试Agent2", 400, 300, "😐")
    time.sleep(1)
    get_agents()
    start_sim()
    time.sleep(2)
    get_events()
    check_agent_emotion_relationship() 