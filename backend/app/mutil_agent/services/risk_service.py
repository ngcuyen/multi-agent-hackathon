from app.mutil_agent.models.risk import (
    RiskAssessmentRequest, RiskAssessmentResponse, RiskMonitorResponse, RiskAlertRequest, RiskScoreHistoryResponse, MarketDataResponse, Threat
)
from app.mutil_agent.services.bedrock_service import BedrockService
from app.mutil_agent.config import (
    MODEL_MAPPING,
    CONVERSATION_CHAT_MODEL_NAME,
    CONVERSATION_CHAT_TOP_P,
    CONVERSATION_CHAT_TEMPERATURE,
    LLM_MAX_TOKENS
)
import datetime
import json

# Khởi tạo BedrockService giống text_service
model_name = CONVERSATION_CHAT_MODEL_NAME or "claude-37-sonnet"
temperature = float(CONVERSATION_CHAT_TEMPERATURE or "0.6")
top_p = float(CONVERSATION_CHAT_TOP_P or "0.6")
max_tokens = int(LLM_MAX_TOKENS or "8192")
if model_name in MODEL_MAPPING:
    bedrock_model_id = MODEL_MAPPING[model_name]
else:
    bedrock_model_id = MODEL_MAPPING["claude-37-sonnet"]

bedrock_service = BedrockService(
    model_id=bedrock_model_id,
    temperature=temperature,
    top_p=top_p,
    max_tokens=max_tokens
)

async def call_claude_sonnet(prompt: str) -> str:
    response = await bedrock_service.ai_ainvoke(prompt)
    # Nếu response là dict hoặc object, lấy text phù hợp
    if isinstance(response, dict):
        return response.get("completion") or response.get("result") or str(response)
    return str(response)

async def assess_risk(request: RiskAssessmentRequest) -> RiskAssessmentResponse:
    # Tính toán risk_score, threats, ... (mock demo)
    score = 72
    threats = [Threat(type="market_volatility", score=8, description="Thị trường biến động mạnh")]
    # Prompt tiếng Việt cho Claude Sonnet
    prompt = (
        f"Bạn là chuyên gia phân tích rủi ro tài chính. Hãy phân tích rủi ro cho đối tượng sau:\n"
        f"ID: {request.entity_id}\n"
        f"Loại đối tượng: {request.entity_type}\n"
        f"Thông tin tài chính: {json.dumps(request.financials, ensure_ascii=False)}\n"
        f"Dữ liệu thị trường: {json.dumps(request.market_data, ensure_ascii=False)}\n"
        f"Yếu tố khác: {json.dumps(request.custom_factors, ensure_ascii=False)}\n"
        "Hãy nhận diện các rủi ro chính, đánh giá điểm rủi ro tổng thể (0-100), phân tích tác động, liệt kê các mối đe dọa và đề xuất biện pháp giảm thiểu. Trình bày ngắn gọn, rõ ràng bằng tiếng Việt."
    )
    ai_report = await call_claude_sonnet(prompt)
    return RiskAssessmentResponse(
        status="success",
        risk_score=score,
        risk_level="medium",
        impact_assessment={"liquidity": "low", "market": "medium", "credit": "high"},
        threats=threats,
        recommendations=["Giảm tỷ lệ nợ vay", "Theo dõi biến động lãi suất"],
        ai_report=ai_report
    )

async def get_monitor_status(entity_id: str) -> RiskMonitorResponse:
    # TODO: Lấy trạng thái giám sát thực tế
    return RiskMonitorResponse(
        status="active",
        last_score=68,
        alerts=[{"time": "2024-07-05T10:00:00Z", "type": "credit", "message": "Tăng trưởng nợ bất thường"}]
    )

async def receive_alert_webhook(request: RiskAlertRequest):
    # TODO: Xử lý alert thực tế (ghi log, gửi notification...)
    print(f"Received alert: {request}")
    return

async def get_score_history(entity_id: str) -> RiskScoreHistoryResponse:
    # TODO: Lấy lịch sử điểm rủi ro thực tế
    return RiskScoreHistoryResponse(
        entity_id=entity_id,
        history=[
            {"date": "2024-07-01", "score": 70},
            {"date": "2024-07-02", "score": 68},
            {"date": "2024-07-03", "score": 72}
        ]
    )

async def get_market_data() -> MarketDataResponse:
    # TODO: Tích hợp API thị trường thực tế
    return MarketDataResponse(
        data={"stock_price": 45.2, "exchange_rate": 24500},
        timestamp=datetime.datetime.utcnow().isoformat()
    ) 