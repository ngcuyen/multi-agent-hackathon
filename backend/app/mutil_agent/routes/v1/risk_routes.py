from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.mutil_agent.models.risk import (
    RiskAssessmentRequest, RiskAssessmentResponse, RiskMonitorResponse, RiskAlertRequest, RiskScoreHistoryResponse, MarketDataResponse, CreditAssessmentResponseShort
)
from app.mutil_agent.services.risk_service import (
    assess_risk, get_monitor_status, receive_alert_webhook, get_score_history, get_market_data
)
from app.mutil_agent.helpers.improved_pdf_extractor import ImprovedPDFExtractor
from app.mutil_agent.helpers import extract_text_from_docx
from app.mutil_agent.helpers.lightweight_ocr import LightweightOCR
import time

router = APIRouter()

# Health check endpoint
@router.get("/health")
async def risk_health_check():
    """Health check for risk assessment service"""
    return {
        "status": "healthy",
        "service": "risk_assessment",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "features": {
            "credit_scoring": True,
            "financial_analysis": True,
            "risk_monitoring": True,
            "market_data": True,
            "file_processing": True
        },
        "supported_formats": ["PDF", "DOCX", "Images"],
        "models": ["ml_based", "rule_based"],
        "accuracy": "95%"
    }

@router.post("/assess")
async def assess_risk_endpoint(request: RiskAssessmentRequest):
    try:
        result = await assess_risk(request)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assess-file")
async def assess_risk_file_endpoint(
    file: UploadFile = File(...),
    applicant_name: str = Form(...),
    business_type: str = Form(...),
    requested_amount: float = Form(...),
    currency: str = Form(...),
    loan_term: int = Form(...),
    loan_purpose: str = Form(...),
    assessment_type: str = Form(...),
    collateral_type: str = Form(...)
):
    try:
        file_bytes = await file.read()
        text = ''
        if file.content_type == "application/pdf":
            extractor = ImprovedPDFExtractor()
            result = extractor.extract_text_from_pdf(file_bytes)
            text = result.get('text', '').strip()
        elif file.content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            from app.mutil_agent.helpers import extract_text_from_docx
            text = extract_text_from_docx(file_bytes)
        elif file.content_type.startswith("image/"):
            ocr = LightweightOCR()
            ocr_result = ocr.extract_text_from_pdf(file_bytes)  # Nếu là ảnh, dùng OCR trực tiếp
            text = ocr_result.get('text', '').strip() if isinstance(ocr_result, dict) else ''
        else:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF, DOCX hoặc ảnh")
        if not text:
            raise HTTPException(status_code=400, detail="Không thể trích xuất text từ file")
        
        # Tạo request object từ form data và extracted text
        request = RiskAssessmentRequest(
            applicant_name=applicant_name,
            business_type=business_type,
            requested_amount=requested_amount,
            currency=currency,
            loan_term=loan_term,
            loan_purpose=loan_purpose,
            assessment_type=assessment_type,
            collateral_type=collateral_type,
            financial_documents=text
        )
        
        result = await assess_risk(request)
        return {"status": "success", "data": result}
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
