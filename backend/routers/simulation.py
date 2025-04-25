from fastapi import APIRouter, Query, Body, HTTPException, Depends
from backend.models import ResponseModel, SimulationSettings
from backend.services.simulation_service import SimulationService

router = APIRouter()

def get_simulation_service():
    return SimulationService()

@router.get("/api/simulation")
def get_simulation_status(service: SimulationService = Depends(get_simulation_service)):
    return ResponseModel(data=service.get_status())

@router.post("/api/simulation")
def control_simulation(action: str = Query(...), service: SimulationService = Depends(get_simulation_service)):
    try:
        result = service.control(action)
        return ResponseModel(data=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/api/simulation")
def update_simulation_settings(settings: SimulationSettings = Body(...), service: SimulationService = Depends(get_simulation_service)):
    return ResponseModel(data=service.update_settings(settings.dict())) 