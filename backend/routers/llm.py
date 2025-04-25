from fastapi import APIRouter, HTTPException, Depends
from backend.models import LLMDecideRequest, ResponseModel, Memory
from backend.services.llm_service import LLMService
from backend.state import agents

router = APIRouter()

def get_llm_service():
    return LLMService()

@router.post("/api/agent/{agent_id}/llm_decide")
def agent_llm_decide(agent_id: str, req: LLMDecideRequest, service: LLMService = Depends(get_llm_service)):
    prompt = req.prompt
    agent = next((a for a in agents if a.id == agent_id), None)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent不存在")
    try:
        mem = service.llm_decide(agent, prompt)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM调用失败: {e}")
    return ResponseModel(data={"response": mem.content, "memory_id": mem.id}) 