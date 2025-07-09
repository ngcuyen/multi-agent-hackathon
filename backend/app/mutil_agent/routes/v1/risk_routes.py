from fastapi import APIRouter, HTTPException, UploadFile, File
from app.mutil_agent.models.risk import (
    RiskAssessmentRequest, RiskAssessmentResponse, RiskMonitorResponse, RiskAlertRequest, RiskScoreHistoryResponse, MarketDataResponse
)
from app.mutil_agent.services.risk_service import (
    assess_risk, get_monitor_status, receive_alert_webhook, get_score_history, get_market_data
)

router = APIRouter()

@router.post("/assess", response_model=RiskAssessmentResponse)
async def assess_risk_endpoint(request: RiskAssessmentRequest):
    try:
        result = await assess_risk(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/monitor/{entity_id}", response_model=RiskMonitorResponse)
async def monitor_risk_endpoint(entity_id: str):
    try:
        return await get_monitor_status(entity_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alert/webhook", response_model=dict)
async def alert_webhook_endpoint(request: RiskAlertRequest):
    try:
        await receive_alert_webhook(request)
        return {"status": "received"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/score/history/{entity_id}", response_model=RiskScoreHistoryResponse)
async def score_history_endpoint(entity_id: str):
    try:
        return await get_score_history(entity_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-data", response_model=MarketDataResponse)
async def market_data_endpoint():
    try:
        return await get_market_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 