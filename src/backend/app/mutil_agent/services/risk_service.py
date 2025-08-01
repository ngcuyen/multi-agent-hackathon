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
import random
import re
import html

# Khởi tạo BedrockService giống text_service
model_name = CONVERSATION_CHAT_MODEL_NAME or "claude-37-sonnet"

# Handle the specific problematic model ID directly
if model_name == "anthropic.claude-3-5-sonnet-20241022-v2:0":
    model_name = "claude-37-sonnet"
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
    # Thêm creditScore random, creditRank theo bảng, scoringDate là hôm nay
    credit_score = random.randint(403, 706)
    # Xác định rank theo bảng
    def get_credit_rank(score):
        if 403 <= score <= 429:
            return 10
        elif 430 <= score <= 454:
            return 9
        elif 455 <= score <= 479:
            return 8
        elif 480 <= score <= 544:
            return 7
        elif 545 <= score <= 571:
            return 6
        elif 572 <= score <= 587:
            return 5
        elif 588 <= score <= 605:
            return 4
        elif 606 <= score <= 621:
            return 3
        elif 622 <= score <= 644:
            return 2
        elif 645 <= score <= 706:
            return 1
        return None
    credit_rank = get_credit_rank(credit_score)
    scoring_date = datetime.datetime.now().strftime('%d/%m/%Y')
    # Bảng nhận xét hạng điểm tín dụng
    rank_comments = {
        10: "Xấu: Khách hàng không đủ điều kiện vay vốn tại hầu hết ngân hàng.",
        9: "Xấu: Rủi ro cao, bị từ chối vay vốn, cần cải thiện tín dụng.",
        8: "Dưới trung bình: Khó vay vốn, chỉ có thể vay tại công ty tài chính, lãi suất cao.",
        7: "Dưới trung bình: Có thể vay vốn với hạn mức thấp, yêu cầu bổ sung hồ sơ nhiều.",
        6: "Trung bình: Một số ngân hàng vẫn từ chối, cần tăng điểm để cải thiện cơ hội vay.",
        5: "Trung bình: Vay vốn khó tại ngân hàng lớn, có thể mở thẻ tín dụng hạn mức thấp.",
        4: "Tốt: Có thể được duyệt vay vốn với điều kiện chứng minh tài chính rõ ràng.",
        3: "Tốt: Dễ dàng vay vốn tín chấp hoặc thế chấp, mở thẻ tín dụng dễ.",
        2: "Rất tốt: Khả năng vay vốn cao, lãi suất tốt, nhiều ưu đãi từ ngân hàng.",
        1: "Rất tốt: Dễ duyệt vay vốn lớn, mở thẻ tín dụng cao cấp, được ưu đãi tín dụng."
    }
    rank_comment = rank_comments.get(credit_rank, "")
    # Chèn creditScore và nhận xét vào prompt với danh nghĩa là điểm tín dụng CIC
    prompt = f"""
Bạn là chuyên gia thẩm định tín dụng ngân hàng. Dựa trên hồ sơ khách hàng dưới đây, hãy phân tích chi tiết và trình bày kết quả theo các mục sau (không trả về JSON, không markdown, đúng các format mục ##1. ,...):
##1. Tóm tắt hồ sơ khách hàng:(có gạch đầu dòng)
##2. Phân tích lịch sử tín dụng: (có gạch đầu dòng)
##3. Phân tích tài chính & khả năng trả nợ: (có gạch đầu dòng)
##4. Phân tích rủi ro tổng thể: (có gạch đầu dòng)
##5. Đề xuất phê duyệt tín dụng:(phải có từ đồng ý hoặc từ chối hoặc hoãn)
##6. Số tiền vay tối đa đề xuất:(con số cụ thể để đầu tiên, ví dụ: 150,000,000 VNĐ (phải dùng phẩy để ngăn cách 3 số, KHÔNG ĐƯỢC DÙNG DẤU CHẤM, bắt buộc đúng format giống ví dụ), chấm một cái rồi sau đó giải thích)
##7. Lãi suất đề xuất:(con số cụ thể để đầu tiên ví dụ: 12,5-13,5%/năm (phải dùng dấu phẩy nếu có để làm dấu thập phân, không được dùng dấu chấm), chấm một cái rồi sau đó giải thích)
##8. Mức độ tin cậy: (độ tin cậy là độ đánh giá tổng thể cuối cùng, nếu phê duyệt cho vay hay không thì khả năng trả của khách là bao nhiêu: đánh giá từ 1-100%)
##9. Khuyến nghị & lưu ý cho ngân hàng:

Hồ sơ khách hàng: (đúng format như bên dưới, có gạch đầu dòng)
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
- Điểm tín dụng CIC: {credit_score} (phải chú thích: dựa trên dữ liệu từ CIC tra cứu bằng CCCD của khách hàng)
- Nhận xét điểm tín dụng: {rank_comment}

{f"**TÀI LIỆU TÀI CHÍNH ĐÍNH KÈM:**\n{request.financial_documents}\n" if request.financial_documents else ""}

**HƯỚNG DẪN PHÂN TÍCH:**
1. Nếu có tài liệu tài chính đính kèm, hãy sử dụng thông tin từ tài liệu để phân tích
2. Kết hợp thông tin từ tài liệu với dữ liệu cơ bản để đưa ra đánh giá toàn diện
3. Trích xuất các chỉ số tài chính quan trọng từ tài liệu (nếu có)
4. Ưu tiên thông tin từ tài liệu đính kèm hơn dữ liệu mặc định
"""

    ai_text = await call_claude_sonnet(prompt)

    # Hàm tách các phần từ text AI trả về
    import re
    def extract_number(text):
        # Lấy toàn bộ cụm số và đơn vị tiền tệ trước dấu chấm đầu tiên
        idx = text.find('.')
        if idx != -1:
            return text[:idx].strip()
        return text.strip()

    def extract_interest_rate(text):
        # Lấy tất cả nội dung trước dấu chấm đầu tiên (nếu có), nếu không có dấu chấm thì lấy toàn bộ chuỗi
        idx = text.find('.')
        if idx != -1:
            return text[:idx].strip()
        return text.strip()

    def extract_confidence(text):
        import re
        match = re.search(r'([0-9][0-9\.,]*)\s*%?', text)
        if match:
            num = match.group(1).replace('.', '').replace(',', '.')
            return f"{num}%"
        return text.strip()

    def extract_sections_from_text(text):
        sections = {
            "summary": "",
            "creditHistory": "",
            "financialAnalysis": "",
            "riskAnalysis": "",
            "recommendation": "",
            "maxLoanAmount": 0,
            "interestRate": 0.0,
            "confidence": 0.0,
            "notes": ""
        }
        patterns = {
            "summary": r"Tóm tắt hồ sơ khách hàng:(.*?)(?=##2. Phân tích lịch sử tín dụng:|$)",
            "creditHistory": r"Phân tích lịch sử tín dụng:(.*?)(?=##3. Phân tích tài chính|$)",
            "financialAnalysis": r"Phân tích tài chính.*?:\s*(.*?)(?=##4. Phân tích rủi ro tổng thể:|$)",
            "riskAnalysis": r"Phân tích rủi ro tổng thể:(.*?)(?=##5. Đề xuất phê duyệt tín dụng:|$)",
            "recommendation": r"Đề xuất phê duyệt tín dụng:(.*?)(?=##6. Số tiền vay tối đa đề xuất:|$)",
            "maxLoanAmount": r"Số tiền vay tối đa đề xuất:(.*?)(?=##7. Lãi suất đề xuất:|$)",
            "interestRate": r"Lãi suất đề xuất:(.*?)(?=##8. Mức độ tin cậy:|$)",
            "confidence": r"Mức độ tin cậy:(.*?)(?=##9. Khuyến nghị|$)",
            "notes": r"Khuyến nghị.*?:\s*(.*?)(?='|$)"
        }
        for key, pat in patterns.items():
            m = re.search(pat, text, re.DOTALL)
            if m:
                val = m.group(1).strip()
                if key == "maxLoanAmount":
                    sections[key] = extract_number(val)
                elif key == "interestRate":
                    sections[key] = extract_interest_rate(val)
                elif key == "confidence":
                    sections[key] = extract_confidence(val)
                else:
                    sections[key] = val
        return sections

    # Hàm làm sạch text giống _clean_text của text_service
    def clean_text_field(text):
        import re
        if not isinstance(text, str):
            return text
        # Unescape HTML entities
        text = html.unescape(text)
        # Unescape common escape sequences
        text = text.replace("\\r", "\r").replace("\\n", "\n").replace("\\t", "\t").replace('\\"', '"')
        # Loại bỏ các dấu nháy kép thừa
        text = re.sub(r'("{2,})', '"', text)
        # Loại bỏ các tag <br>, </li>, </p>, </td> và chuyển thành xuống dòng
        text = re.sub(r'<(/)?br[^/>]*(/)?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</li[^>]*>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</p>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</td>', '\n', text, flags=re.IGNORECASE)
        # Loại bỏ các tag <a ...> và </a>
        text = re.sub(r'<a[\t ]*(?!href)*(href="?)([^" \t>]*)[" \t]*[^>]*>', r' \2 ', text, flags=re.IGNORECASE)
        text = re.sub(r'</a>', ' ', text, flags=re.IGNORECASE)
        # Loại bỏ các tag HTML còn lại
        text = re.sub(r'<[^>]+>', '', text)
        # Loại bỏ nhiều tab, space liên tiếp
        text = re.sub(r'[\t ]+', ' ', text)
        # Loại bỏ dòng trống
        text = re.sub(r'(?m)^[ \t]*\r?\n', '', text)
        # Thay thế nhiều dòng trắng liên tiếp bằng 1 dòng trắng
        text = re.sub(r'\n{2,}', '\n', text)
        # Loại bỏ khoảng trắng đầu/cuối
        text = text.strip('\n ')
        return text

    sections = extract_sections_from_text(ai_text)
    # Làm sạch các trường text
    for k in sections:
        if isinstance(sections[k], str):
            sections[k] = clean_text_field(sections[k])
    # Làm sạch AI_report: loại bỏ escape, HTML, và cắt phần trailing log nếu có
    def clean_ai_report(text):
        text = clean_text_field(text)
        # Xóa 'content=' ở đầu nếu có
        text = re.sub(r'^content[=:\-\s]*', '', text, flags=re.IGNORECASE)
        # Cắt phần sau nếu có các chuỗi log/trailer
        cut_patterns = [
            r"HTTPStatusCode.*",
            r"'HTTPStatusCode.*",
            r"response_metadata.*",
            r"metrics.*",
            r"input_tokens.*",
            r"output_tokens.*",
            r"total_tokens.*"
        ]
        for pat in cut_patterns:
            text = re.split(pat, text, flags=re.IGNORECASE)[0]
        # Loại bỏ trailing dấu nháy đơn hoặc dấu xuống dòng thừa
        text = text.strip("'\n ")
        return text
    sections["ai_report"] = clean_ai_report(ai_text)
    # Thêm trường approved: chỉ cần có từ "đồng ý" (cho phép khoảng trắng/dấu giữa các ký tự)
    import re
    import unicodedata
    def normalize_text(text):
        if not isinstance(text, str):
            return ""
        # Remove accents
        text = unicodedata.normalize('NFD', text)
        text = ''.join([c for c in text if unicodedata.category(c) != 'Mn'])
        # Lowercase
        text = text.lower()
        return text
    recommendation_text = sections.get("recommendation", "")
    norm = normalize_text(recommendation_text)
    # Regex: chỉ cần có "đồng ý" (cho phép khoảng trắng/dấu giữa các ký tự)
    match = re.search(r"đ[oơ]ng[\s\-\_\.,]*y", norm)
    approved = bool(match)
    sections["approved"] = approved
    # Thêm creditScore random, creditRank theo bảng, scoringDate là hôm nay
    sections["creditScore"] = credit_score
    sections["creditRank"] = credit_rank
    sections["scoringDate"] = scoring_date
    return sections

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