"""
VPBank Strands Agents Routes - Simplified Routing Logic
Focus on supervisor routing without complex validation
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from typing import Dict, Any, Optional
import logging
import json
from datetime import datetime

# Import Pure Strands system (Updated to clean architecture)
from app.mutil_agent.agents.pure_strands_vpbank_system import (
    pure_strands_vpbank_system,
    process_pure_strands_request,
    get_pure_strands_system_status
)

logger = logging.getLogger(__name__)

# Create router
strands_router = APIRouter(prefix="/strands", tags=["VPBank Strands Supervisor"])

# ================================
# MAIN SUPERVISOR ENDPOINT - SIMPLIFIED
# ================================

@strands_router.post("/process")
async def process_strands_request(
    message: str = Form(..., description="User message - determines routing to appropriate agent"),
    file: Optional[UploadFile] = File(None, description="Optional file upload"),
    conversation_id: Optional[str] = Form("default_session", description="Optional conversation ID"),
    context: Optional[str] = Form(None, description="Optional context as JSON string")
):
    """
    VPBank Strands Supervisor Agent - Intelligent Routing
    
    **Routing Logic:**
    - Text Summary: "tóm tắt", "summarize", "summary"
    - Chat Knowledge: "kiểm tra", "tuân thủ", "compliance", "check", "validate", "tư vấn", "thông tin"
    - Risk Assessment: "phân tích", "rủi ro", "risk", "analysis", "assess", "đánh giá"
    
    **Example requests:**
    - "Tóm tắt tài liệu này" → Text Summary Agent
    - "Kiểm tra tuân thủ quy định" → Chat Knowledge Agent  
    - "Phân tích rủi ro tín dụng" → Risk Assessment Agent
    """
    try:
        logger.info(f"[STRANDS_SUPERVISOR] Processing: {message[:100]}...")
        
        # Process file if uploaded
        file_content = None
        if file:
            logger.info(f"[STRANDS_SUPERVISOR] Processing file: {file.filename}")
            file_bytes = await file.read()
            file_content = await _extract_file_content(file, file_bytes)
        
        # Parse context
        parsed_context = {}
        if context:
            try:
                parsed_context = json.loads(context)
            except:
                parsed_context = {"raw_context": context}
        
        # Add file to context if available
        if file_content:
            parsed_context["file_content"] = file_content
            parsed_context["file_name"] = file.filename
        
        # Enhanced message with file content
        enhanced_message = message
        if file_content:
            enhanced_message += f"\n\nFile content ({file.filename}):\n{file_content[:1500]}..."
        
        # Process through Pure Strands supervisor (Updated architecture)
        result = await process_pure_strands_request(
            user_message=enhanced_message,
            conversation_id=conversation_id or "default_session",
            context=parsed_context
        )
        
        # Return simplified response
        return {
            "status": result.get("status", "success"),
            "response": result.get("response", "No response generated"),
            "agent_used": _detect_agent_from_response(result.get("response", "")),
            "file_processed": file.filename if file else None,
            "processing_time": result.get("processing_time", 0),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"[STRANDS_SUPERVISOR] Error: {str(e)}")
        
        # Return error response with required fields
        return {
            "status": "error",
            "response": f"Error processing request: {str(e)}",
            "agent_used": "error_handler",
            "file_processed": file.filename if file else None,
            "processing_time": 0,
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# ================================
# HELPER FUNCTIONS
# ================================

async def _extract_file_content(file: UploadFile, file_bytes: bytes) -> str:
    """Extract text content from uploaded file"""
    try:
        filename = file.filename.lower() if file.filename else ""
        
        # Text files
        if filename.endswith('.txt'):
            return file_bytes.decode('utf-8', errors='ignore')
        
        # CSV files  
        elif filename.endswith('.csv'):
            return file_bytes.decode('utf-8', errors='ignore')
        
        # JSON files
        elif filename.endswith('.json'):
            return file_bytes.decode('utf-8', errors='ignore')
        
        # PDF files (placeholder)
        elif filename.endswith('.pdf'):
            return f"[PDF File: {file.filename} - {len(file_bytes)} bytes]\n[PDF text extraction would be implemented here]"
        
        # DOCX files (placeholder)
        elif filename.endswith('.docx'):
            return f"[DOCX File: {file.filename} - {len(file_bytes)} bytes]\n[DOCX text extraction would be implemented here]"
        
        # Other files
        else:
            return f"[File: {file.filename} - {len(file_bytes)} bytes - {file.content_type}]"
            
    except Exception as e:
        return f"[Error reading file {file.filename}: {str(e)}]"

def _detect_agent_from_response(response: str) -> str:
    """Detect which Pure Strands agent was used based on response content"""
    response_lower = response.lower()
    
    # Check for text summary keywords
    if any(keyword in response_lower for keyword in ["tóm tắt tài liệu", "text_summary_agent", "document summary"]):
        return "text_summary_agent"
    
    # Check for compliance/knowledge keywords  
    elif any(keyword in response_lower for keyword in ["kiểm tra tuân thủ", "tư vấn khách hàng", "compliance_knowledge_agent", "vpbank"]):
        return "compliance_knowledge_agent"
    
    # Check for risk/analysis keywords
    elif any(keyword in response_lower for keyword in ["phân tích rủi ro", "risk_analysis_agent", "báo cáo phân tích"]):
        return "risk_analysis_agent"
    
    else:
        return "supervisor_direct"

# ================================
# UTILITY ENDPOINTS
# ================================

@strands_router.get("/health")
async def health_check():
    """Simple health check"""
    try:
        status = get_pure_strands_system_status()
        return {
            "status": "healthy",
            "system": "VPBank Pure Strands Supervisor",
            "architecture": "clean_no_langgraph",
            "file_upload": True,
            "agents_available": len(status.get("available_agents", [])),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@strands_router.get("/routing-info")
async def get_routing_info():
    """Get information about routing logic"""
    return {
        "routing_logic": {
            "text_summary_agent": {
                "triggers": ["tóm tắt", "summarize", "summary"],
                "description": "Direct text summarization with Pure Strands"
            },
            "compliance_knowledge_agent": {
                "triggers": ["kiểm tra", "tuân thủ", "compliance", "check", "validate"],
                "description": "Banking compliance and customer service with Pure Strands"
            },
            "risk_analysis_agent": {
                "triggers": ["phân tích", "rủi ro", "risk", "analysis", "assess"],
                "description": "Financial risk assessment with Pure Strands"
            }
        },
        "file_support": ["txt", "csv", "json", "pdf", "docx"],
        "usage": {
            "endpoint": "/mutil_agent/api/strands/process",
            "method": "POST",
            "required": ["message"],
            "optional": ["file", "conversation_id", "context"]
        }
    }

# Export router
__all__ = ["strands_router"]
