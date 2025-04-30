import pytest
from backend.services.llm_service import LLMService
from backend.services.memory_service import MemoryService
from backend.services.event_service import EventService
from backend.services.agent_service import AgentService

@pytest.mark.parametrize("text", ["测试文本", "AI小镇记忆", "事件描述", "Agent自我介绍"])
def test_embedding_generation(text):
    llm = LLMService()
    emb = llm.get_embedding(text)
    assert isinstance(emb, list)
    assert len(emb) > 0

@pytest.mark.parametrize("query", ["记忆内容测试", "历史对话", "重要事件"])
def test_memory_vector_search(query):
    llm = LLMService()
    mem_service = MemoryService()
    emb = llm.get_embedding(query)
    results = mem_service.search_memories_by_embedding(emb, 3)
    assert isinstance(results, list)

@pytest.mark.parametrize("query", ["事件内容测试", "经济变动", "政策发布"])
def test_event_vector_search(query):
    llm = LLMService()
    event_service = EventService()
    emb = llm.get_embedding(query)
    results = event_service.search_events_by_embedding(emb, 3)
    assert isinstance(results, list)

@pytest.mark.parametrize("query", ["张三", "AI小镇居民", "虚拟角色"])
def test_agent_vector_search(query):
    llm = LLMService()
    agent_service = AgentService()
    emb = llm.get_embedding(query)
    results = agent_service.search_agents_by_embedding(emb, 3)
    assert isinstance(results, list) 