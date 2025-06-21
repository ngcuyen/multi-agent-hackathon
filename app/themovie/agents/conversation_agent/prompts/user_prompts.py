def user_prompt_chat_node(user_input) -> str:
    return f"""
        {user_input}
    """


def user_prompt_chat_recommendation_node(movie_data, user_input) -> str:
    return f"""THÔNG TIN PHIM KHUYẾN NGHỊ:
{movie_data}

QUAN TRỌNG: Danh sách phim trên đã được sắp xếp theo thứ tự ưu tiên khuyến nghị từ cao đến thấp. KHÔNG ĐƯỢC thay đổi thứ tự này trong câu trả lời.

CÂU HỎI CỦA NGƯỜI DÙNG:
"{user_input.strip()}"

Hãy trả lời câu hỏi dựa trên thông tin phim được cung cấp, giữ nguyên thứ tự ưu tiên và giải thích tại sao các bộ phim này phù hợp."""
