import logging
from uuid import UUID
from typing import Dict, Any

from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.types import StreamWriter

from app.mutil_agent.agents.conversation_agent.state import ConversationState
from app.mutil_agent.databases.dynamodb import get_db_session_with_context
from app.mutil_agent.services.compliance_service import ComplianceValidationService
from app.mutil_agent.models.message_dynamodb import MessageDynamoDB as Message, MessageTypesDynamoDB as MessageTypes
from app.mutil_agent.utils.helpers import StreamWriter as ConversationStreamWriter

logger = logging.getLogger(__name__)

async def compliance_chat_node(
    state: ConversationState, 
    config: RunnableConfig, 
    writer: StreamWriter
) -> ConversationState:
    """
    Compliance chat node - handles UCP 600 regulation queries and compliance questions
    """
    conversation_id = state.conversation_id
    user_message = state.messages[-1] if state.messages else ""
    node_name = config.get("metadata", {}).get("langgraph_node")
    
    try:
        logger.info(f"[COMPLIANCE_CHAT] Processing request for conversation {conversation_id}")
        
        # Determine if this is a regulation query or general compliance question
        query_type = _determine_query_type(user_message)
        
        if query_type == "regulation_query":
            response = await _handle_regulation_query(user_message)
        elif query_type == "compliance_help":
            response = await _handle_compliance_help(user_message)
        else:
            response = await _handle_general_compliance_chat(user_message)
        
        # Stream response
        writer(
            ConversationStreamWriter(
                messages=[response],
                node_name=node_name,
                type=MessageTypes.AI,
            ).to_dict()
        )
        
        # Save to database
        await _save_message_to_db(conversation_id, response, MessageTypes.AI)
        
        # Update state
        state.node_name = "compliance_chat_node"
        
        logger.info(f"[COMPLIANCE_CHAT] Completed for conversation {conversation_id}")
        return state
        
    except Exception as e:
        logger.error(f"[COMPLIANCE_CHAT] Node error: {str(e)}")
        error_response = "Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi về tuân thủ. Vui lòng thử lại sau."
        
        writer(
            ConversationStreamWriter(
                messages=[error_response],
                node_name=node_name,
                type=MessageTypes.AI,
            ).to_dict()
        )
        await _save_message_to_db(conversation_id, error_response, MessageTypes.AI)
        
        return state


def _determine_query_type(message: str) -> str:
    """
    Determine the type of compliance query
    """
    message_lower = message.lower()
    
    # UCP 600 regulation queries
    ucp_keywords = [
        'ucp 600', 'ucp600', 'uniform customs', 'letter of credit regulation',
        'isbp 821', 'isbp821', 'international standard banking practice',
        'sbv', 'state bank of vietnam', 'ngân hàng nhà nước'
    ]
    
    # Compliance help keywords
    compliance_keywords = [
        'tuân thủ', 'compliance', 'quy định', 'regulation',
        'kiểm tra', 'validate', 'verification', 'xác minh'
    ]
    
    if any(keyword in message_lower for keyword in ucp_keywords):
        return "regulation_query"
    elif any(keyword in message_lower for keyword in compliance_keywords):
        return "compliance_help"
    else:
        return "general_chat"


async def _handle_regulation_query(message: str) -> str:
    """
    Handle UCP 600 regulation queries using ComplianceValidationService
    """
    try:
        compliance_service = ComplianceValidationService()
        
        # Extract the actual query from the message
        query = _extract_query_from_message(message)
        
        # Query regulations directly
        result = await compliance_service.query_regulations_directly(query)
        
        if result and result.get('answer'):
            response = f"**Thông tin quy định UCP 600:**\n\n{result['answer']}\n\n"
            
            if result.get('confidence'):
                response += f"**Độ tin cậy:** {result['confidence']}%\n\n"
            
            if result.get('sources'):
                response += "**Nguồn tham khảo:**\n"
                for source in result['sources'][:3]:  # Limit to 3 sources
                    response += f"• {source}\n"
        else:
            response = "Xin lỗi, tôi không tìm thấy thông tin phù hợp về quy định này. Vui lòng thử lại với câu hỏi cụ thể hơn."
        
        return response
        
    except Exception as e:
        logger.error(f"Error handling regulation query: {e}")
        return f"Có lỗi xảy ra khi truy vấn quy định: {str(e)}"


async def _handle_compliance_help(message: str) -> str:
    """
    Handle general compliance help questions
    """
    try:
        # Common compliance topics
        help_topics = {
            'letter of credit': """
**Letter of Credit (LC) - Thư tín dụng:**

**Định nghĩa:** Công cụ thanh toán quốc tế được ngân hàng phát hành để đảm bảo thanh toán cho người thụ hưởng khi đáp ứng các điều kiện.

**Các loại LC chính:**
• Revocable LC (có thể hủy ngang)
• Irrevocable LC (không thể hủy ngang)
• Confirmed LC (được xác nhận)
• Standby LC (LC dự phòng)

**Quy định áp dụng:**
• UCP 600 (Uniform Customs and Practice)
• ISBP 821 (International Standard Banking Practice)
• Quy định của SBV (Ngân hàng Nhà nước Việt Nam)
            """,
            
            'ucp 600': """
**UCP 600 - Uniform Customs and Practice:**

**Là gì:** Bộ quy tắc quốc tế về thư tín dụng do ICC (International Chamber of Commerce) ban hành.

**Nội dung chính:**
• Định nghĩa và thuật ngữ
• Nghĩa vụ và trách nhiệm của các bên
• Trình bày chứng từ
• Kiểm tra và thanh toán
• Chuyển nhượng LC

**Ứng dụng:** Áp dụng cho tất cả LC có ghi rõ "subject to UCP 600"
            """,
            
            'document check': """
**Kiểm tra chứng từ LC:**

**Nguyên tắc cơ bản:**
• Kiểm tra bề mặt chứng từ (on its face)
• Tuân thủ nghiêm ngặt điều khoản LC
• Thời hạn nộp chứng từ
• Tính nhất quán giữa các chứng từ

**Chứng từ thường gặp:**
• Commercial Invoice (Hóa đơn thương mại)
• Bill of Lading (Vận đơn)
• Insurance Policy (Bảo hiểm)
• Certificate of Origin (Chứng nhận xuất xứ)
• Packing List (Danh sách đóng gói)
            """
        }
        
        message_lower = message.lower()
        
        # Find matching topic
        for topic, content in help_topics.items():
            if topic in message_lower:
                return content
        
        # Default compliance help
        return """
**Hỗ trợ Tuân thủ Ngân hàng:**

Tôi có thể giúp bạn về:

**Letter of Credit (LC):**
• Quy trình xử lý LC
• Kiểm tra chứng từ
• Các loại LC và ứng dụng

**Quy định:**
• UCP 600 - Quy tắc quốc tế về LC
• ISBP 821 - Thực hành ngân hàng chuẩn
• Quy định SBV Việt Nam

**Kiểm tra tuân thủ:**
• Validation chứng từ
• Risk assessment
• Compliance checking

Hãy hỏi tôi về chủ đề cụ thể bạn quan tâm!
        """
        
    except Exception as e:
        logger.error(f"Error handling compliance help: {e}")
        return "Có lỗi xảy ra khi cung cấp thông tin hỗ trợ tuân thủ."


async def _handle_general_compliance_chat(message: str) -> str:
    """
    Handle general compliance chat
    """
    return """
**Chào bạn! Tôi là Compliance Assistant.**

Tôi chuyên hỗ trợ về:
• Letter of Credit (LC) và quy trình xử lý
• Quy định UCP 600, ISBP 821, SBV
• Kiểm tra tuân thủ chứng từ ngân hàng
• Đánh giá rủi ro và compliance

Bạn có thể hỏi tôi về:
• "UCP 600 quy định gì về thời hạn nộp chứng từ?"
• "Cách kiểm tra Bill of Lading trong LC?"
• "Quy trình validate LC document?"

Hãy đặt câu hỏi cụ thể để tôi hỗ trợ bạn tốt nhất!
    """


def _extract_query_from_message(message: str) -> str:
    """
    Extract the actual query from user message
    """
    # Remove common prefixes
    prefixes_to_remove = [
        "hỏi về", "câu hỏi về", "query about", "ask about",
        "tôi muốn biết", "cho tôi biết", "tell me about"
    ]
    
    query = message.lower()
    for prefix in prefixes_to_remove:
        if query.startswith(prefix):
            query = query.replace(prefix, "", 1).strip()
            break
    
    return query if query else message


async def _save_message_to_db(conversation_id: str, content: str, message_type: MessageTypes):
    """
    Save message to database
    """
    try:
        async with get_db_session_with_context() as session:
            message = Message(
                conversation_id=UUID(conversation_id),
                type=message_type,
                message=content
            )
            await message.save()
            
    except Exception as e:
        logger.error(f"Failed to save compliance message to DB: {e}")


# Routing function for workflow
def should_use_compliance_node(message: str) -> bool:
    """
    Check if message should go to compliance node
    """
    message_lower = message.lower()
    
    compliance_triggers = [
        'ucp 600', 'ucp600', 'isbp 821', 'isbp821',
        'letter of credit', 'thư tín dụng', 'lc',
        'tuân thủ', 'compliance', 'quy định',
        'kiểm tra chứng từ', 'document check',
        'ngân hàng nhà nước', 'sbv',
        'bill of lading', 'commercial invoice',
        'certificate of origin', 'insurance policy'
    ]
    
    return any(trigger in message_lower for trigger in compliance_triggers)
