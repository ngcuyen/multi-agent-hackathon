from fastapi import APIRouter, HTTPException, UploadFile, File
from app.riskassessment.models.risk import (
    RiskAssessmentRequest, RiskAssessmentResponse, RiskMonitorResponse, RiskAlertRequest, RiskScoreHistoryResponse, MarketDataResponse, CreditAssessmentResponseShort
)
from app.mutil_agent.services.risk_service import (
    assess_risk, get_monitor_status, receive_alert_webhook, get_score_history, get_market_data
)
from app.riskassessment.helpers.improved_pdf_extractor import ImprovedPDFExtractor
from app.riskassessment.helpers import extract_text_from_docx

router = APIRouter()

@router.post("/assess", response_model=RiskAssessmentResponse)
async def assess_risk_endpoint(request: RiskAssessmentRequest):
    try:
        result = await assess_risk(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assess-file", response_model=RiskAssessmentResponse)
async def assess_risk_file_endpoint(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        text = ''
        if file.content_type == "application/pdf":
            extractor = ImprovedPDFExtractor()
            result = extractor.extract_text_from_pdf(file_bytes)
            text = result.get('text', '').strip()
        elif file.content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            text = extract_text_from_docx(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF hoặc DOCX")
        if not text:
            raise HTTPException(status_code=400, detail="Không thể trích xuất nội dung từ file")
        from app.riskassessment.models.risk import RiskAssessmentRequest
        dummy_request = RiskAssessmentRequest(
            entity_id="from_file",
            entity_type="unknown",
            financials={},
            market_data={},
            custom_factors={},
            applicant_name=f"Đơn xin vay từ file {file.filename}",
            business_type="unknown",
            requested_amount=0,
            currency="VND",
            loan_term=0,
            loan_purpose=text,
            collateral_type="unknown",
            assessment_type="file_upload"
        )
        result = await assess_risk(dummy_request)
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