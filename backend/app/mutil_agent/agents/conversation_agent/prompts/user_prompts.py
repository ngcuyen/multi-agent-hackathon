def user_prompt_chat_node(user_input) -> str:
    return f"""
        NGƯỜI DÙNG YÊU CẦU:
        "{user_input.strip()}"
        
        Vui lòng phân tích và xác định ý định của người dùng để chọn tính năng phù hợp.
    """

def user_prompt_document_analysis_node(file_data_summary, user_input) -> str:
    return f"""DỮ LIỆU TÀI LIỆU:
{file_data_summary}

CÂU HỎI CỦA NGƯỜI DÙNG:
"{user_input.strip()}"

NHIỆM VỤ:
Phân tích tài liệu và trích xuất thông tin cần thiết để trả lời câu hỏi hoặc tạo tóm tắt/báo cáo theo yêu cầu của người dùng. Đảm bảo chỉ sử dụng dữ liệu đã được cung cấp trong tài liệu."""
