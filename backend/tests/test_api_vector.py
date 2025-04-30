import requests
import pytest

BASE_URL = "http://localhost:8000"

@pytest.mark.parametrize("text", ["测试记忆", "AI小镇历史", "重要对话"])
def test_api_memory_vector_search(text):
    resp = requests.post(f"{BASE_URL}/api/llm/embedding", json={"text": text})
    data = resp.json()
    emb = data.get("data", {}).get("embedding")
    assert emb and isinstance(emb, list)
    resp2 = requests.post(f"{BASE_URL}/api/memory/search_by_vector", json={"embedding": emb, "top_k": 3})
    assert resp2.status_code == 200
    assert isinstance(resp2.json().get("data"), list)

@pytest.mark.parametrize("text", ["事件内容", "经济危机", "政策调整"])
def test_api_event_vector_search(text):
    resp = requests.post(f"{BASE_URL}/api/llm/embedding", json={"text": text})
    data = resp.json()
    emb = data.get("data", {}).get("embedding")
    assert emb and isinstance(emb, list)
    resp2 = requests.post(f"{BASE_URL}/api/event/search_by_vector", json={"embedding": emb, "top_k": 3})
    assert resp2.status_code == 200
    assert isinstance(resp2.json().get("data"), list)

@pytest.mark.parametrize("text", ["李四", "虚拟居民", "AI角色"])
def test_api_agent_vector_search(text):
    resp = requests.post(f"{BASE_URL}/api/llm/embedding", json={"text": text})
    data = resp.json()
    emb = data.get("data", {}).get("embedding")
    assert emb and isinstance(emb, list)
    resp2 = requests.post(f"{BASE_URL}/api/agent/search_by_vector", json={"embedding": emb, "top_k": 3})
    assert resp2.status_code == 200
    assert isinstance(resp2.json().get("data"), list) 