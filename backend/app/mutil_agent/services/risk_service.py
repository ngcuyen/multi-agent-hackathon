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

async def assess_risk(request: RiskAssessmentRequest) -> dict:
    # 1. Gọi LLM sinh bản phân tích tổng hợp (ai_report)
    ai_report_prompt = f'''
Bạn là chuyên gia phân tích tín dụng ngân hàng. Hãy phân tích hồ sơ tín dụng sau một cách tổng hợp, chi tiết, nhận định rủi ro, điểm mạnh/yếu, và đưa ra lời bình luận, kết luận cuối cùng về khả năng cấp tín dụng. Không trả về JSON, không markdown, không code block, chỉ trả về văn bản tự nhiên.

Dữ liệu hồ sơ:
- Tên: {request.applicant_name}
- Loại hình kinh doanh: {request.business_type}
- Số tiền vay: {request.requested_amount}
- Loại tiền: {request.currency}
- Kỳ hạn vay: {request.loan_term}
- Mục đích vay: {request.loan_purpose}
- Tài sản đảm bảo: {request.collateral_type}
- Thông tin tài chính: {json.dumps(request.financials, ensure_ascii=False)}
- Dữ liệu thị trường: {json.dumps(request.market_data, ensure_ascii=False)}
- Yếu tố khác: {json.dumps(request.custom_factors, ensure_ascii=False)}
'''
    ai_report = await call_claude_sonnet(ai_report_prompt)

    # 2. Gọi LLM sinh recommendations ngắn gọn (max_loan, đề xuất, quyết định)
    recommendations_prompt = f'''
Bạn là chuyên gia tín dụng ngân hàng. Dựa trên hồ sơ sau, hãy trả lời thật ngắn gọn (không quá 5 dòng) các ý sau:
- Hạn mức vay tối đa đề xuất
- Điều kiện phê duyệt chính (nếu có)
- Đề xuất quyết định cho vay (duyệt, duyệt có điều kiện, từ chối...)
- Nhấn mạnh rủi ro chính cần lưu ý
Chỉ trả về văn bản tự nhiên, không markdown, không code block, không liệt kê.

Dữ liệu hồ sơ:
- Tên: {request.applicant_name}
- Loại hình kinh doanh: {request.business_type}
- Số tiền vay: {request.requested_amount}
- Loại tiền: {request.currency}
- Kỳ hạn vay: {request.loan_term}
- Mục đích vay: {request.loan_purpose}
- Tài sản đảm bảo: {request.collateral_type}
- Thông tin tài chính: {json.dumps(request.financials, ensure_ascii=False)}
- Dữ liệu thị trường: {json.dumps(request.market_data, ensure_ascii=False)}
- Yếu tố khác: {json.dumps(request.custom_factors, ensure_ascii=False)}
'''
    recommendations = await call_claude_sonnet(recommendations_prompt)

    # 3. Sinh threats mẫu dựa trên recommendations (hoặc để rỗng nếu muốn LLM sinh riêng)
    threats = [
        {
            "type": "summary",
            "score": 0,
            "description": "Xem trường recommendations để biết các rủi ro chính."
        }
    ]

    return {
        "status": "success",
        "threats": threats,
        "ai_report": ai_report.strip(),
        "recommendations": [recommendations.strip()]
    }

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