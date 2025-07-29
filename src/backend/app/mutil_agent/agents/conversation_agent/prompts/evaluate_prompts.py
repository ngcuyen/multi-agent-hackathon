def evaluate_prompt_summary(original_text, summary) -> str:
    return f"""
Bạn là một trợ lý kiểm định độ chính xác. Hãy so sánh nội dung gốc và bản tóm tắt sau đây.

Văn bản gốc:
{original_text}

Bản tóm tắt:
{summary}

Câu hỏi: Bản tóm tắt có phản ánh đúng nội dung của văn bản gốc không? Có thông tin nào bị bóp méo, thiếu quan trọng, hoặc bị thêm vào không chính xác không?

Chỉ trả lời:
- "YES" nếu bản tóm tắt chính xác về mặt nội dung
- "NO" nếu có sai lệch về nội dung

Nếu trả lời "NO", hãy liệt kê rõ các điểm sai và giải thích vì sao.

Trả lời:

    """
