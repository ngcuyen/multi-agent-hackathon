import logging
from uuid import UUID
from typing import Dict, Any

from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.types import StreamWriter

from app.riskassessment.agents.conversation_agent.state import ConversationState
from app.riskassessment.databases.dynamodb import get_db_session_with_context
from app.riskassessment.models.message_dynamodb import MessageDynamoDB as Message, MessageTypesDynamoDB as MessageTypes
from app.riskassessment.utils.helpers import StreamWriter as ConversationStreamWriter

logger = logging.getLogger(__name__)

async def risk_assessment_node(
    state: ConversationState, 
    config: RunnableConfig, 
    writer: StreamWriter
) -> ConversationState:
    """
    Clean risk assessment - handles analysis
    """
    conversation_id = state.conversation_id
    user_message = state.messages[-1] if state.messages else ""
    node_name = config.get("metadata", {}).get("langgraph_node")
    
    try:
        logger.info(f"[RISK_ASSESSMENT] Processing request for conversation {conversation_id}")
        
        
        
    except Exception as e:
        logger.error(f"[RISK_ASSESSMENT] Node error: {str(e)}")
        
        return state


    


