"""
Example: Cách sử dụng DynamoDB Message operations trong project
"""

from uuid import UUID
from app.riskassessment.models.message_dynamodb import MessageDynamoDB as Message, MessageTypesDynamoDB as MessageTypes

async def example_usage():
    conversation_id = UUID("12345678-1234-5678-9012-123456789012")
    
    # 1️⃣ LUU USER MESSAGE
    user_message = Message(
        conversation_id=conversation_id,
        message="Tôi muốn tóm tắt file PDF s3://my-bucket/document.pdf",
        type=MessageTypes.HUMAN,
        metadata={
            "node": "chat_node",
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0..."
        }
    )
    await user_message.save()
    
    # 2️⃣ LUU AI RESPONSE 
    ai_message = Message(
        conversation_id=conversation_id,
        message="Tôi sẽ phân tích và tóm tắt file PDF cho bạn...",
        type=MessageTypes.AI,
        metadata={
            "node": "text_summary_node",
            "model": "claude-3.7-sonnet",
            "processing_time": 2.5,
            "tokens_used": 1500
        }
    )
    await ai_message.save()
    
    # 3️⃣ LAY LICH SU CONVERSATION
    messages = await Message.find_by_conversation(
        conversation_id=conversation_id,
        limit=50
    )
    
    print(f"Found {len(messages)} messages")
    for msg in messages:
        print(f"[{msg.type}] {msg.message[:50]}...")
    
    # 4️⃣ QUERY ADVANCED
    # Lấy chỉ AI messages
    ai_messages = await Message.find_by_conversation(
        conversation_id=conversation_id,
        message_types=[MessageTypes.AI],
        limit=20
    )
    
    # 5️⃣ TIM KIEM THEO TIME RANGE
    from datetime import datetime, timedelta
    
    yesterday = datetime.now() - timedelta(days=1)
    recent_messages = await Message.find_by_conversation(
        conversation_id=conversation_id,
        after_timestamp=yesterday,
        limit=10
    )
