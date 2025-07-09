from typing import Any
import logging
import re

from langgraph.constants import START, END

from app.mutil_agent.agents.conversation_agent.nodes.chat_knowledgebase_node import (
    chat_knowledgebase_node,
)
from app.mutil_agent.agents.conversation_agent.nodes.chat_node import chat_node
from app.mutil_agent.agents.conversation_agent.nodes.text_summary_node import text_summary_node
from app.mutil_agent.agents.conversation_agent.state import ConversationState
from app.mutil_agent.agents.workflow import BaseWorkflow


def determine_initial_routing(state: ConversationState) -> str:
    """
    Direct routing từ START - tối ưu performance
    
    Args:
        state: ConversationState với user message
        
    Returns:
        Node name để route đến
    """
    try:
        if not hasattr(state, 'messages') or not state.messages:
            logging.warning("[WORKFLOW] No messages in state, routing to knowledge base")
            return "chat_knowledgebase_node"
        # DEBUG: Log raw message
        raw_message = state.messages[-1]
        logging.info(f"[WORKFLOW DEBUG] Raw message: {repr(raw_message)}")
        logging.info(f"[WORKFLOW DEBUG] Message type: {type(raw_message)}")
        
        user_message = str(state.messages[-1]).lower()
        
        # DEBUG: Log message content
        logging.info(f"[WORKFLOW DEBUG] Processing message: '{user_message}'")
        logging.info(f"[WORKFLOW DEBUG] Message length: {len(user_message)}")
        
        # Text Summary triggers - simplified và optimized
        text_summary_patterns = [
            # S3 references (high priority)
            r's3://[^/\s]+/[^\s]+',                    # s3://bucket/path/file
            r'bucket:\s*[^,\s]+.*?file:\s*[^\s,]+',   # bucket: name, file: path
            r'bucket_name:\s*[^,\s]+.*?file_key:\s*[^\s,]+', # bucket_name: name, file_key: path
        ]
        
        # Check S3 patterns first (highest priority)
        for pattern in text_summary_patterns:
            if re.search(pattern, user_message, re.IGNORECASE):
                logging.info(f"[WORKFLOW] S3 pattern detected, routing to text_summary_node")
                return "text_summary_node"
        
        # Text Summary keywords (medium priority)
        text_summary_keywords = [
            'tóm tắt', 'summarize', 'summary',
            'phân tích tài liệu', 'analyze document', 'document analysis',
            'đọc file', 'read file', 'extract text',
            'pdf', '.pdf', 'csv', '.csv'
        ]
        
        # DEBUG: Check each keyword
        logging.info(f"[WORKFLOW DEBUG] Checking keywords...")
        for keyword in text_summary_keywords:
            if keyword in user_message:
                logging.info(f"[WORKFLOW] Text summary keyword '{keyword}' detected - ROUTING TO text_summary_node")
                return "text_summary_node"
            else:
                logging.debug(f"[WORKFLOW DEBUG] Keyword '{keyword}' not found in message")
        
        # Default routing
        logging.info("[WORKFLOW] Default routing to chat_knowledgebase_node")
        return "chat_knowledgebase_node"
        
    except Exception as e:
        logging.error(f"[WORKFLOW] ❌ EXCEPTION in routing: {str(e)}")
        logging.error(f"[WORKFLOW] Exception type: {type(e)}")
        import traceback
        logging.error(f"[WORKFLOW] Traceback: {traceback.format_exc()}")
        return "chat_knowledgebase_node"  # Safe fallback


def validate_state_transition(state: ConversationState, target_node: str) -> bool:
    """
    Validate state transitions để đảm bảo workflow integrity
    
    Args:
        state: Current conversation state
        target_node: Target node to transition to
        
    Returns:
        True if transition is valid
    """
    try:
        # Validate required fields
        if not hasattr(state, 'conversation_id') or not state.conversation_id:
            logging.error("[WORKFLOW] Invalid state: missing conversation_id")
            return False
        
        if not hasattr(state, 'messages') or not state.messages:
            logging.error("[WORKFLOW] Invalid state: missing messages")
            return False
        
        # Validate target node
        valid_nodes = ["text_summary_node", "chat_knowledgebase_node"]
        if target_node not in valid_nodes:
            logging.error(f"[WORKFLOW] Invalid target node: {target_node}")
            return False
        
        # Additional validation for text_summary_node
        if target_node == "text_summary_node":
            user_message = str(state.messages[-1])
            if len(user_message.strip()) == 0:
                logging.error("[WORKFLOW] Empty message for text_summary_node")
                return False
        
        return True
        
    except Exception as e:
        logging.error(f"[WORKFLOW] State validation error: {str(e)}")
        return False


def get_conversation_graph(state: ConversationState, checkpointer: Any):
    """
    Tạo conversation graph với chat_node làm central router
    """
    conversation_workflow = BaseWorkflow(state)
    
    # Add nodes - bao gồm chat_node
    conversation_workflow.add_node("chat_node", chat_node)  # Central router
    conversation_workflow.add_node("text_summary_node", text_summary_node)
    conversation_workflow.add_node("chat_knowledgebase_node", chat_knowledgebase_node)
    
    # Flow: START → chat_node (central processing)
    conversation_workflow.add_edge(START, "chat_node")
    
    # Routing từ chat_node đến specialized nodes
    conversation_workflow.add_conditional_edges(
        "chat_node",
        route_from_chat_node  # Function routing từ chat_node
    )
    
    # Both specialized nodes end workflow
    conversation_workflow.add_edge("text_summary_node", END)
    conversation_workflow.add_edge("chat_knowledgebase_node", END)
    
    conversation_graph = conversation_workflow.get_graph()
    return conversation_graph.compile(checkpointer=None)  # Disable DynamoDB checkpointer


def route_from_chat_node(state: ConversationState) -> str:
    """
    Routing function từ chat_node đến specialized nodes
    
    Args:
        state: ConversationState với next_node được set bởi chat_node
        
    Returns:
        Target node name
    """
    print(f"🔥 ROUTE_FROM_CHAT_NODE - next_node: {state.next_node}")
    
    # Chat node đã set next_node, sử dụng nó
    if hasattr(state, 'next_node') and state.next_node:
        target_node = state.next_node
        print(f"🔥 Using chat_node decision: {target_node}")
        return target_node
    
    # Fallback routing nếu chat_node không set next_node
    print("🔥 Chat node didn't set next_node, using fallback routing")
    return determine_initial_routing(state)


def route_from_start(state: ConversationState) -> str:
    """
    Simplified routing function từ START
    
    Args:
        state: ConversationState
        
    Returns:
        Target node name
    """
    # FORCE LOG - này sẽ luôn xuất hiện
    print("🚨 ROUTE_FROM_START CALLED!")
    print(f"🚨 State messages: {state.messages}")
    
    try:
        # Determine routing
        target_node = determine_initial_routing(state)
        
        # FORCE LOG routing result
        print(f"🚨 ROUTING RESULT: {target_node}")
        
        # Validate transition
        if not validate_state_transition(state, target_node):
            logging.warning("[WORKFLOW] State validation failed, using fallback")
            target_node = "chat_knowledgebase_node"
            print(f"🚨 VALIDATION FAILED - FALLBACK TO: {target_node}")
        
        # Log routing decision
        logging.info(f"[WORKFLOW] Routing from START to {target_node}")
        
        # Set routing info in state
        if not hasattr(state, 'routing_info'):
            state.routing_info = {}
        
        state.routing_info.update({
            'routing_method': 'direct_from_start',
            'target_node': target_node,
            'timestamp': int(__import__('time').time()),
            'message_preview': str(state.messages[-1])[:100] if state.messages else ""
        })
        
        return target_node
        
    except Exception as e:
        logging.error(f"[WORKFLOW] Critical routing error: {str(e)}")
        # Emergency fallback
        return "chat_knowledgebase_node"


def handle_node_error(state: ConversationState, error: Exception, node_name: str) -> ConversationState:
    """
    Centralized error handling cho workflow nodes
    
    Args:
        state: Current state
        error: Exception that occurred
        node_name: Name of the node where error occurred
        
    Returns:
        Updated state with error information
    """
    try:
        error_message = f"Error in {node_name}: {str(error)}"
        logging.error(f"[WORKFLOW] {error_message}")
        
        # Set error state
        if not hasattr(state, 'error_info'):
            state.error_info = {}
        
        state.error_info.update({
            'last_error': {
                'node': node_name,
                'error': str(error),
                'timestamp': int(__import__('time').time()),
                'conversation_id': getattr(state, 'conversation_id', 'unknown')
            }
        })
        
        # Set fallback response
        if node_name == "text_summary_node":
            state.next_node = "Xin lỗi, có lỗi xảy ra khi xử lý tài liệu. Vui lòng thử lại sau."
        else:
            state.next_node = "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau."
        
        return state
        
    except Exception as e:
        logging.critical(f"[WORKFLOW] Error in error handler: {str(e)}")
        # Last resort fallback
        state.next_node = "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."
        return state


def get_conversation_workflow(state, checkpointer):
    """
    Wrapper function với error handling
    """
    try:
        return get_conversation_graph(state=state, checkpointer=checkpointer)
    except Exception as e:
        logging.error(f"[WORKFLOW] Error creating workflow: {str(e)}")
        raise


def get_workflow_info():
    """
    Trả về thông tin về optimized workflow structure
    """
    return {
        "version": "2.0_optimized",
        "nodes": [
            {
                "name": "text_summary_node",
                "description": "Text summarization and S3 document analysis",
                "type": "processing",
                "triggers": ["S3 references", "Summary keywords", "Document analysis"]
            },
            {
                "name": "chat_knowledgebase_node", 
                "description": "Knowledge base integration for Q&A",
                "type": "processing",
                "triggers": ["Default routing", "General queries"]
            }
        ],
        "flow": "START → [direct routing] → [text_summary_node | chat_knowledgebase_node] → END",
        "optimizations": [
            "Direct routing từ START (loại bỏ chat_node intermediary)",
            "Simplified routing logic với regex patterns",
            "State validation trước khi routing",
            "Centralized error handling",
            "Performance optimized với early pattern matching"
        ],
        "routing_logic": {
            "high_priority": ["S3 patterns (s3://, bucket:, bucket_name:)"],
            "medium_priority": ["Summary keywords", "Document analysis keywords"],
            "default": ["All other cases → chat_knowledgebase_node"]
        },
        "error_handling": [
            "State validation",
            "Node error recovery",
            "Fallback routing",
            "Error logging và tracking"
        ]
    }
