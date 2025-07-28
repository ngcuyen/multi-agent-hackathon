"""
VPBank Pure Strands Agents Routes - Unified Endpoint
Single endpoint handles both file and non-file requests
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional, Union
import logging
import json
from datetime import datetime

# Import Pure Strands system
from app.mutil_agent.agents.pure_strands_vpbank_system import (
    process_pure_strands_request
)

logger = logging.getLogger(__name__)

# Create router
pure_strands_router = APIRouter(prefix="/pure-strands")

# ================================
# UNIFIED PROCESSING ENDPOINT
# ================================

@pure_strands_router.post("/process")
async def process_request(
    message: str = Form(..., description="User message for intelligent routing"),
    file: Optional[UploadFile] = File(default=None, description="Optional file upload - can be None"),
    conversation_id: Optional[str] = Form(default="default_session", description="Conversation ID"),
    context: Optional[str] = Form(default=None, description="Optional context as JSON string")
):
    """
    🏦 **VPBank K-MULT Agent Studio - Unified Processing Endpoint**
    
    **Handles both scenarios:**
    1. **Text-only**: `message="hello, bạn là ai?"` (no file)
    2. **File + Text**: `message="tóm tắt file này"` + file upload
    
    **Intelligent Routing:**
    - "tóm tắt" → text_summary_agent (with/without file)
    - "kiểm tra", "tuân thủ" → compliance_knowledge_agent  
    - "phân tích", "rủi ro" → risk_analysis_agent
    - General chat → supervisor handles routing
    
    **File Support:** PDF, DOCX, TXT, CSV (optional)
    """
    try:
        start_time = datetime.now()
        logger.info(f"[UNIFIED_ENDPOINT] Processing: {message[:100]}...")
        
        # Initialize variables
        enhanced_message = message
        uploaded_file_data = None
        file_info = "No file"
        
        # Handle file upload (if provided)
        if file is not None and hasattr(file, 'filename') and file.filename:
            logger.info(f"[UNIFIED_ENDPOINT] File detected: {file.filename}")
            try:
                file_bytes = await file.read()
                
                if len(file_bytes) == 0:
                    logger.warning(f"[UNIFIED_ENDPOINT] Empty file: {file.filename}")
                    file_info = f"Empty file: {file.filename}"
                else:
                    # Prepare file data for agents
                    uploaded_file_data = {
                        "filename": file.filename,
                        "size": len(file_bytes),
                        "content_type": file.content_type or "application/octet-stream",
                        "raw_bytes": file_bytes
                    }
                    
                    # Add file context to message
                    enhanced_message += f"\n\n[📎 File: {file.filename} ({len(file_bytes)} bytes)]"
                    file_info = f"File: {file.filename} ({len(file_bytes)} bytes)"
                    
                    logger.info(f"[UNIFIED_ENDPOINT] File processed successfully: {file_info}")
                    
            except Exception as file_error:
                logger.error(f"[UNIFIED_ENDPOINT] File processing error: {file_error}")
                return {
                    "status": "error",
                    "response": f"❌ **Lỗi xử lý file**: {str(file_error)}",
                    "agent_used": "error_handler",
                    "file_processed": file.filename if file else None,
                    "processing_time": 0,
                    "timestamp": datetime.now().isoformat(),
                    "error": f"File processing failed: {str(file_error)}"
                }
        else:
            logger.info("[UNIFIED_ENDPOINT] Text-only message (no file)")
        
        # Parse context if provided
        parsed_context = {}
        if context:
            try:
                parsed_context = json.loads(context)
                logger.info(f"[UNIFIED_ENDPOINT] Context parsed: {len(parsed_context)} keys")
            except json.JSONDecodeError as e:
                logger.warning(f"[UNIFIED_ENDPOINT] Context parse error: {e}")
                parsed_context = {"raw_context": context}
        
        # Process through Pure Strands system
        logger.info(f"[UNIFIED_ENDPOINT] Routing to Pure Strands system...")
        result = await process_pure_strands_request(
            user_message=enhanced_message,
            conversation_id=conversation_id or "default_session",
            context=parsed_context,
            uploaded_file=uploaded_file_data  # None if no file
        )
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Return unified response
        response = {
            "status": result.get("status", "success"),
            "response": result.get("response", "No response generated"),
            "agent_used": result.get("agent_used", "supervisor"),
            "file_processed": uploaded_file_data.get("filename") if uploaded_file_data else None,
            "processing_time": round(processing_time, 2),
            "timestamp": datetime.now().isoformat(),
            "conversation_id": conversation_id or "default_session",
            "request_type": "file_upload" if uploaded_file_data else "text_only",
            "file_info": file_info
        }
        
        logger.info(f"[UNIFIED_ENDPOINT] Success: {result.get('agent_used')} in {processing_time:.2f}s")
        return response
        
    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        logger.error(f"[UNIFIED_ENDPOINT] Error: {str(e)}")
        
        return {
            "status": "error",
            "response": f"❌ **Lỗi xử lý yêu cầu**: {str(e)}",
            "agent_used": "error_handler",
            "file_processed": file.filename if file and hasattr(file, 'filename') else None,
            "processing_time": round(processing_time, 2),
            "timestamp": datetime.now().isoformat(),
            "conversation_id": conversation_id or "default_session",
            "error": str(e)
        }
        
    except Exception as e:
        logger.error(f"[PURE_STRANDS] Error: {str(e)}")
        
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
# SYSTEM STATUS ENDPOINT
# ================================

@pure_strands_router.get("/status")
async def get_system_status():
    """Get Pure Strands system status and available agents"""
    try:
        from app.mutil_agent.agents.pure_strands_vpbank_system import get_pure_strands_system_status
        
        status = get_pure_strands_system_status()
        return {
            "status": "active",
            "system_info": status,
            "endpoints": {
                "process": "/pure-strands/process - Unified endpoint for text/file processing",
                "status": "/pure-strands/status - System status"
            },
            "usage_examples": {
                "text_only": "POST /pure-strands/process with message='hello, bạn là ai?'",
                "with_file": "POST /pure-strands/process with message='tóm tắt file này' + file upload",
                "compliance": "POST /pure-strands/process with message='UCP 600 là gì?'",
                "risk_analysis": "POST /pure-strands/process with message='phân tích rủi ro công ty ABC'"
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Export router
__all__ = ["pure_strands_router"]
