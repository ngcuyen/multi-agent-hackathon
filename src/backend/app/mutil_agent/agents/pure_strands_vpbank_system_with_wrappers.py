"""
VPBank K-MULT Agent Studio - Pure Strands with Endpoint Wrappers
Uses existing API endpoints as tools for maximum accuracy and consistency
"""

from strands import Agent
from strands.models import BedrockModel
import boto3
import asyncio
import json
import logging
import os
import ssl
import urllib3
from typing import Dict, Any, Optional, List
from datetime import datetime

# Import VPBank configurations
from app.mutil_agent.config import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_BEDROCK_REGION,
    DEFAULT_MODEL_NAME,
    MODEL_MAPPING,
    VERIFY_HTTPS
)

# Import endpoint wrapper tools
from app.mutil_agent.agents.endpoint_wrapper_tools import (
    compliance_document_tool,
    text_summary_document_tool,
    risk_assessment_tool
)

logger = logging.getLogger(__name__)

# ================================
# SSL CONFIGURATION FOR STRANDS
# ================================
if not VERIFY_HTTPS:
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    ssl._create_default_https_context = ssl._create_unverified_context
    logger.info("SSL verification disabled for Strands Agent")

# ================================
# AWS BEDROCK MODEL CONFIGURATION
# ================================
try:
    bedrock_client = boto3.client(
        'bedrock-runtime',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_BEDROCK_REGION
    )
    logger.info(f"AWS Bedrock client initialized for region: {AWS_BEDROCK_REGION}")
except Exception as e:
    logger.error(f"Failed to initialize AWS Bedrock client: {e}")
    bedrock_client = None

# ================================
# ENHANCED SUPERVISOR PROMPT
# ================================
SUPERVISOR_PROMPT = """
You are a VPBank K-MULT INTELLIGENT routing supervisor. Your PRIMARY job is to route user requests to the correct specialized tool that wraps existing API endpoints.

ROUTING RULES (STRICT PRIORITY ORDER):
1. COMPLIANCE QUERIES → compliance_document_tool
   - Keywords: "kiểm tra", "tuân thủ", "compliance", "check", "validate", "verify", "quy định", "regulation", "UCP", "LC", "letter of credit"
   - File uploads for document validation
   - Banking regulation questions
   - Wraps: /mutil_agent/api/v1/compliance/document

2. TEXT SUMMARY QUERIES → text_summary_document_tool  
   - Keywords: "tóm tắt", "summarize", "summary", "analyze document", "extract", "phân tích tài liệu"
   - File uploads for document summarization
   - Text analysis requests
   - Wraps: /mutil_agent/api/v1/text/summary/document

3. RISK ANALYSIS QUERIES → risk_assessment_tool
   - Keywords: "phân tích", "rủi ro", "risk", "assess", "credit", "financial", "đánh giá", "tín dụng"
   - Financial analysis requests
   - Credit assessment queries
   - Wraps: /mutil_agent/api/v1/risk/assess

TOOL CAPABILITIES:
- compliance_document_tool: Direct wrapper for compliance/document endpoint. Validates documents against UCP 600, ISBP 821, SBV regulations.
- text_summary_document_tool: Direct wrapper for text/summary/document endpoint. Summarizes documents with statistics.
- risk_assessment_tool: Direct wrapper for risk/assess endpoint. Analyzes financial risk with Basel III compliance.

ROUTING EXAMPLES:
User: "kiểm tra tuân thủ tài liệu LC" → compliance_document_tool
User: "tóm tắt văn bản này" → text_summary_document_tool
User: "phân tích rủi ro tín dụng" → risk_assessment_tool
User: "UCP 600 quy định gì?" → compliance_document_tool
User: "đánh giá khả năng trả nợ" → risk_assessment_tool

CRITICAL INSTRUCTIONS:
- You MUST call exactly ONE tool for every request
- You CANNOT provide direct answers or explanations
- You MUST analyze the user's intent and route to the appropriate tool
- Tools preserve EXACT logic from existing API endpoints
- If unclear, default to compliance_document_tool for banking-related queries

Your response should ONLY be the tool execution result. No additional commentary.
"""

# ================================
# CREATE SUPERVISOR AGENT
# ================================
supervisor_agent = Agent(
    system_prompt=SUPERVISOR_PROMPT,
    tools=[compliance_document_tool, text_summary_document_tool, risk_assessment_tool],
    model=BedrockModel(
        model_id=MODEL_MAPPING.get(DEFAULT_MODEL_NAME, DEFAULT_MODEL_NAME),
        client=bedrock_client,
        temperature=0.1,
        max_tokens=4000
    )
)

# ================================
# PURE STRANDS VPBANK SYSTEM CLASS
# ================================
class PureStrandsVPBankSystemWithWrappers:
    def __init__(self):
        self.supervisor = supervisor_agent
        self.processing_stats = {
            "total_requests": 0,
            "successful_responses": 0,
            "errors": 0,
            "agent_usage": {
                "compliance_document_tool": 0,
                "text_summary_document_tool": 0,
                "risk_assessment_tool": 0
            }
        }
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        return {
            "system": "VPBank K-MULT Pure Strands with ENDPOINT WRAPPERS",
            "supervisor_status": "active",
            "available_tools": [
                "compliance_document_tool (→ /compliance/document DIRECT)",
                "text_summary_document_tool (→ /text/summary/document DIRECT)", 
                "risk_assessment_tool (→ /risk/assess DIRECT)"
            ],
            "endpoint_integration": {
                "compliance_document_tool": "Wraps /mutil_agent/api/v1/compliance/document endpoint DIRECTLY",
                "text_summary_document_tool": "Wraps /mutil_agent/api/v1/text/summary/document endpoint DIRECTLY",
                "risk_assessment_tool": "Wraps /mutil_agent/api/v1/risk/assess endpoint DIRECTLY"
            },
            "processing_stats": self.processing_stats,
            "active_sessions": 0
        }
    
    async def process_request(
        self, 
        user_message: str, 
        conversation_id: str,
        context: Optional[Dict[str, Any]] = None,
        uploaded_file: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process user request with ENHANCED ROUTING + ENDPOINT WRAPPERS"""
        try:
            self.processing_stats["total_requests"] += 1
            start_time = datetime.now()
            
            logger.info(f"[PURE_STRANDS_WRAPPERS] Processing request for conversation {conversation_id}")
            
            # ENHANCED MANUAL ROUTING - Primary approach for reliability
            message_lower = user_message.lower()
            selected_tool = None
            
            # Enhanced keyword detection with priority scoring
            compliance_keywords = [
                'kiểm tra', 'tuân thủ', 'compliance', 'check', 'validate', 'verify', 'conform',
                'quy định', 'regulation', 'ucp', 'isbp', 'sbv', 'letter of credit', 'lc',
                'banking regulation', 'document validation', 'compliance check'
            ]
            
            summary_keywords = [
                'tóm tắt', 'summarize', 'summary', 'analyze document', 'extract', 'document analysis',
                'phân tích tài liệu', 'trích xuất', 'tổng hợp', 'rút gọn', 'document summary'
            ]
            
            risk_keywords = [
                'phân tích rủi ro', 'rủi ro', 'risk', 'analysis', 'credit', 'assess', 'financial',
                'đánh giá', 'tín dụng', 'credit assessment', 'risk analysis', 'financial analysis',
                'basel', 'credit score', 'loan assessment'
            ]
            
            # Calculate keyword match scores
            compliance_score = sum(1 for keyword in compliance_keywords if keyword in message_lower)
            summary_score = sum(1 for keyword in summary_keywords if keyword in message_lower)
            risk_score = sum(1 for keyword in risk_keywords if keyword in message_lower)
            
            # Determine primary intent based on highest score
            max_score = max(compliance_score, summary_score, risk_score)
            
            if max_score > 0:
                if compliance_score == max_score:
                    selected_tool = "compliance"
                    logger.info(f"[PURE_STRANDS_WRAPPERS] Manual routing: COMPLIANCE detected (score: {compliance_score})")
                elif summary_score == max_score:
                    selected_tool = "summary"
                    logger.info(f"[PURE_STRANDS_WRAPPERS] Manual routing: SUMMARY detected (score: {summary_score})")
                elif risk_score == max_score:
                    selected_tool = "risk"
                    logger.info(f"[PURE_STRANDS_WRAPPERS] Manual routing: RISK detected (score: {risk_score})")
            
            # Special handling for file uploads
            if uploaded_file and not selected_tool:
                file_ext = uploaded_file.get('filename', '').lower().split('.')[-1]
                if file_ext in ['pdf', 'docx', 'txt']:
                    # Default to compliance for banking documents
                    selected_tool = "compliance"
                    logger.info("[PURE_STRANDS_WRAPPERS] Manual routing: FILE UPLOAD → defaulting to COMPLIANCE")
            
            # Execute single tool with MANUAL ROUTING + ENDPOINT WRAPPERS (Primary approach)
            if selected_tool:
                logger.info(f"[PURE_STRANDS_WRAPPERS] Using MANUAL routing to {selected_tool} tool with ENDPOINT WRAPPER")
                
                try:
                    if selected_tool == "compliance":
                        response = compliance_document_tool(user_message, file_data=uploaded_file)
                        tool_used = "compliance_document_tool"
                    elif selected_tool == "summary":
                        response = text_summary_document_tool(user_message, file_data=uploaded_file)
                        tool_used = "text_summary_document_tool"
                    elif selected_tool == "risk":
                        response = risk_assessment_tool(user_message, file_data=uploaded_file)
                        tool_used = "risk_assessment_tool"
                    
                    # Update usage stats
                    self.processing_stats["agent_usage"][tool_used] += 1
                    self.processing_stats["successful_responses"] += 1
                    
                    processing_time = (datetime.now() - start_time).total_seconds()
                    
                    logger.info(f"[PURE_STRANDS_WRAPPERS] MANUAL routing successful: {tool_used} in {processing_time:.2f}s")
                    
                    return {
                        "status": "success",
                        "response": response,
                        "agent_used": tool_used,
                        "processing_time": processing_time,
                        "timestamp": datetime.now().isoformat(),
                        "conversation_id": conversation_id,
                        "request_type": "file_upload" if uploaded_file else "text_query",
                        "routing_method": "manual_enhanced",
                        "file_info": f"File: {uploaded_file.get('filename')} ({len(uploaded_file.get('raw_bytes', b''))} bytes)" if uploaded_file else None
                    }
                    
                except Exception as manual_error:
                    logger.error(f"[PURE_STRANDS_WRAPPERS] Manual routing error: {manual_error}")
                    # Fall through to supervisor routing
            
            # FALLBACK: Use supervisor agent routing with ENDPOINT WRAPPERS
            logger.info("[PURE_STRANDS_WRAPPERS] Using SUPERVISOR routing with ENDPOINT WRAPPERS as fallback")
            
            try:
                if uploaded_file:
                    # Create file-aware tools for supervisor
                    from strands import tool
                    
                    @tool
                    def compliance_with_file(query: str) -> str:
                        return compliance_document_tool(query, file_data=uploaded_file)
                    
                    @tool  
                    def summary_with_file(query: str) -> str:
                        return text_summary_document_tool(query, file_data=uploaded_file)
                    
                    @tool
                    def risk_with_file(query: str) -> str:
                        return risk_assessment_tool(query, file_data=uploaded_file)
                    
                    # Create file-aware supervisor
                    file_supervisor = Agent(
                        system_prompt=SUPERVISOR_PROMPT,
                        tools=[compliance_with_file, summary_with_file, risk_with_file],
                        model=BedrockModel(
                            model_id=MODEL_MAPPING.get(DEFAULT_MODEL_NAME, DEFAULT_MODEL_NAME),
                            client=bedrock_client,
                            temperature=0.1,
                            max_tokens=4000
                        )
                    )
                    
                    supervisor_response = await file_supervisor.run_async(user_message)
                else:
                    supervisor_response = await self.supervisor.run_async(user_message)
                
                # Extract tool used from response
                tool_used = "supervisor_routed"
                if "compliance" in str(supervisor_response).lower():
                    tool_used = "compliance_document_tool"
                    self.processing_stats["agent_usage"]["compliance_document_tool"] += 1
                elif "summary" in str(supervisor_response).lower() or "tóm tắt" in str(supervisor_response).lower():
                    tool_used = "text_summary_document_tool"
                    self.processing_stats["agent_usage"]["text_summary_document_tool"] += 1
                elif "risk" in str(supervisor_response).lower() or "rủi ro" in str(supervisor_response).lower():
                    tool_used = "risk_assessment_tool"
                    self.processing_stats["agent_usage"]["risk_assessment_tool"] += 1
                
                self.processing_stats["successful_responses"] += 1
                processing_time = (datetime.now() - start_time).total_seconds()
                
                logger.info(f"[PURE_STRANDS_WRAPPERS] SUPERVISOR routing successful: {tool_used} in {processing_time:.2f}s")
                
                return {
                    "status": "success",
                    "response": str(supervisor_response),
                    "agent_used": tool_used,
                    "processing_time": processing_time,
                    "timestamp": datetime.now().isoformat(),
                    "conversation_id": conversation_id,
                    "request_type": "file_upload" if uploaded_file else "text_query",
                    "routing_method": "supervisor_enhanced",
                    "file_info": f"File: {uploaded_file.get('filename')} ({len(uploaded_file.get('raw_bytes', b''))} bytes)" if uploaded_file else None
                }
                
            except Exception as supervisor_error:
                logger.error(f"[PURE_STRANDS_WRAPPERS] Supervisor routing error: {supervisor_error}")
                self.processing_stats["errors"] += 1
                
                return {
                    "status": "error",
                    "response": f"❌ **Lỗi hệ thống**: {str(supervisor_error)}",
                    "agent_used": "error_handler",
                    "processing_time": (datetime.now() - start_time).total_seconds(),
                    "timestamp": datetime.now().isoformat(),
                    "conversation_id": conversation_id,
                    "error": str(supervisor_error)
                }
        
        except Exception as e:
            logger.error(f"[PURE_STRANDS_WRAPPERS] Critical error: {str(e)}")
            self.processing_stats["errors"] += 1
            
            return {
                "status": "error",
                "response": f"❌ **Lỗi nghiêm trọng**: {str(e)}",
                "agent_used": "error_handler",
                "processing_time": (datetime.now() - start_time).total_seconds(),
                "timestamp": datetime.now().isoformat(),
                "conversation_id": conversation_id,
                "error": str(e)
            }

# ================================
# GLOBAL INSTANCE
# ================================
pure_strands_vpbank_system_with_wrappers = PureStrandsVPBankSystemWithWrappers()

# ================================
# EXPORT FOR API USAGE
# ================================
__all__ = [
    'pure_strands_vpbank_system_with_wrappers',
    'compliance_document_tool',
    'text_summary_document_tool', 
    'risk_assessment_tool'
]
