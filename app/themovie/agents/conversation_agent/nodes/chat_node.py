import logging
import re
from uuid import UUID

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.types import StreamWriter

from app.themovie.agents.conversation_agent.prompts.system_prompts import (
    system_prompt_chat_node,
)
from app.themovie.agents.conversation_agent.prompts.user_prompts import (
    user_prompt_chat_node,
)
from app.themovie.agents.conversation_agent.state import ConversationState
from app.themovie.config import (
    CONVERSATION_CHAT_MODEL_NAME,
    CONVERSATION_CHAT_TOP_P,
    CONVERSATION_CHAT_TEMPERATURE,
    MESSAGES_LIMIT,
)
from app.themovie.exceptions import StreamingException
from app.themovie.factories.ai_model_factory import AIModelFactory
from app.themovie.models.message import Message
from app.themovie.models.message import MessageTypes
from app.themovie.utils.helpers import StreamWriter as ConversationStreamWriter
from app.themovie.databases.mongo import get_db_session_with_context


def determine_next_node(message_content: str) -> str:
    """
    Xác định node tiếp theo dựa trên nội dung message
    
    Args:
        message_content: Nội dung message từ user
        
    Returns:
        Tên node tiếp theo ("text_summary_node" hoặc "chat_knowledgebase_node")
    """
    message_lower = message_content.lower()
    
    # Text Summary triggers
    text_summary_keywords = [
        # S3 references
        's3://',
        'bucket:',
        'bucket_name:',
        
        # Summary keywords
        'tóm tắt',
        'summarize',
        'summary',
        
        # Document analysis
        'phân tích tài liệu',
        'analyze document',
        'document analysis',
        'phân tích file',
        'analyze file',
        
        # File operations
        'đọc file',
        'read file',
        'extract text',
        'trích xuất text',
        
        # PDF specific
        'pdf',
        '.pdf',
        
        # CSV specific  
        'csv',
        '.csv',
        
        # General file processing
        'xử lý file',
        'process file',
        'file processing'
    ]
    
    # Kiểm tra S3 patterns với regex
    s3_patterns = [
        r's3://[^/]+/.+',                           # s3://bucket/path/file
        r'bucket:\s*[^,\s]+.*?file:\s*[^\s,]+',     # bucket: name, file: path
        r'bucket_name:\s*[^,\s]+.*?file_key:\s*[^\s,]+' # bucket_name: name, file_key: path
    ]
    
    for pattern in s3_patterns:
        if re.search(pattern, message_content, re.IGNORECASE):
            logging.info(f"[CHAT_NODE] S3 pattern detected: {pattern}")
            return "text_summary_node"
    
    # Kiểm tra keywords
    for keyword in text_summary_keywords:
        if keyword in message_lower:
            logging.info(f"[CHAT_NODE] Text summary keyword detected: {keyword}")
            return "text_summary_node"
    
    # Default routing
    logging.info(f"[CHAT_NODE] Default routing to knowledge base")
    return "chat_knowledgebase_node"


async def chat_node(
    state: ConversationState, config: RunnableConfig, writer: StreamWriter
) -> ConversationState:
    """
    Main chat node với intelligent routing
    
    Chức năng:
    1. Nhận message từ user
    2. Phân tích nội dung để xác định routing
    3. Set next_node cho conditional routing
    4. Có thể xử lý AI response nếu cần
    """
    try:
        # Lấy message cuối cùng từ user
        user_message = state.messages[-1] if state.messages else ""
        user_message_str = str(user_message)
        
        logging.info(f"[CHAT_NODE] Processing message: {user_message_str[:100]}...")
        
        # Xác định node tiếp theo dựa trên nội dung
        next_node = determine_next_node(user_message_str)
        
        # Set next_node cho routing
        state.next_node = next_node
        
        logging.info(f"[CHAT_NODE] Routing to: {next_node}")
        
        # Lưu thông tin routing vào state (optional)
        if not hasattr(state, 'routing_info'):
            state.routing_info = {}
        
        state.routing_info['last_routing'] = {
            'from_node': 'chat_node',
            'to_node': next_node,
            'message_preview': user_message_str[:100],
            'routing_reason': 'automatic_detection'
        }
        
    except Exception as e:
        logging.error(
            f"[CHAT_NODE] - Error in chat_node: {str(e)}, conversation_id: {state.conversation_id}"
        )
        # Fallback routing trong trường hợp lỗi
        state.next_node = "chat_knowledgebase_node"
        raise StreamingException(config["metadata"].get("langgraph_node"))

    return state
