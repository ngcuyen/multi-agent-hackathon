"""
VPBank K-MULT Agent Studio - Strands Agent Routes
Multi-Agent Hackathon 2025 - Group 181

FastAPI routes for Strands Agent tools integration
"""

import json
import logging
import os
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import JSONResponse

from app.mutil_agent.schemas.base import ResponseStatus
from app.mutil_agent.services.strands_agent_service import strands_service

router = APIRouter()

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class StrandsComplianceRequest(BaseModel):
    """Request model for Strands compliance validation agent"""
    document_text: str = Field(..., description="Document text to validate")
    document_type: Optional[str] = Field(None, description="Document type (optional)")


class StrandsRiskAssessmentRequest(BaseModel):
    """Request model for Strands risk assessment agent"""
    applicant_name: str = Field(..., description="Name of the loan applicant")
    business_type: str = Field(..., description="Type of business/industry")
    requested_amount: float = Field(..., description="Loan amount requested")
    currency: str = Field("VND", description="Currency")
    loan_term: int = Field(12, description="Loan term in months")
    loan_purpose: str = Field("business_expansion", description="Purpose of the loan")
    assessment_type: str = Field("comprehensive", description="Type of assessment")
    collateral_type: str = Field("real_estate", description="Type of collateral")
    financial_documents: str = Field("", description="Financial documents text")


class StrandsDocumentRequest(BaseModel):
    """Request model for Strands document intelligence agent"""
    document_content: str = Field(..., description="Document content to process")
    document_type: Optional[str] = Field(None, description="Document type hint")


class StrandsSupervisorRequest(BaseModel):
    """Request model for Strands supervisor agent"""
    user_request: str = Field(..., description="User's request or question")
    context: Optional[Dict[str, Any]] = Field(None, description="Optional context information")


# ============================================================================
# STRANDS AGENT ENDPOINTS
# ============================================================================

@router.post("/supervisor/process", response_model=dict)
async def strands_supervisor_orchestration(request: StrandsSupervisorRequest = Body(...)):
    """
    Process request through Strands Supervisor Agent (Master Orchestrator)
    
    The supervisor agent coordinates all specialized agents:
    - Compliance Validation Agent
    - Risk Assessment Agent  
    - Document Intelligence Agent
    
    Enhanced with:
    - Multi-agent orchestration
    - Intelligent workflow routing
    - Context-aware processing
    - Comprehensive result synthesis
    
    Args:
        request: StrandsSupervisorRequest with user request
        
    Returns:
        Orchestrated multi-agent response
    """
    try:
        logger.info(f"🎯 Strands Supervisor Agent: Processing request - {request.user_request[:100]}...")
        
        # Validate input
        if not request.user_request or len(request.user_request.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="User request too short (minimum 5 characters)"
            )
        
        # Process through Strands Agent service
        result = await strands_service.process_supervisor_request(
            user_request=request.user_request,
            context=request.context
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": result,
                "message": "Strands Supervisor Agent orchestration completed",
                "agent_info": {
                    "agent_type": "strands_supervisor_orchestrator",
                    "framework": "strands_agents_sdk",
                    "version": "1.0.0",
                    "coordinated_agents": ["compliance_validation", "risk_assessment", "document_intelligence"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Strands Supervisor Agent error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Strands Supervisor Agent failed: {str(e)}"
            }
        )


@router.post("/supervisor/process-with-file", response_model=dict)
async def strands_supervisor_with_file_upload(
    user_request: str = Form(..., description="User's banking request or question"),
    file: Optional[UploadFile] = File(None, description="Optional document file to process"),
    context: Optional[str] = Form(None, description="Optional context information (JSON string)")
):
    """
    Process request through Strands Supervisor Agent with File Upload Support
    
    Enhanced supervisor endpoint that supports:
    - Text message processing
    - File upload (PDF, DOCX, TXT, Images)
    - Context information
    - Multi-agent orchestration
    
    The supervisor will:
    1. Extract text from uploaded file (if provided)
    2. Combine with user request
    3. Route to appropriate specialized agents
    4. Orchestrate multi-agent workflow
    5. Synthesize comprehensive response
    
    Args:
        user_request: User's banking request or question
        file: Optional document file (PDF, DOCX, TXT, JPG, PNG)
        context: Optional context information as JSON string
        
    Returns:
        Orchestrated multi-agent response with file processing results
    """
    try:
        logger.info(f"🎯 Strands Supervisor Agent (File Upload): Processing request - {user_request[:100]}...")
        
        # Validate input
        if not user_request or len(user_request.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="User request too short (minimum 5 characters)"
            )
        
        # Parse context if provided
        parsed_context = None
        if context:
            try:
                import json
                parsed_context = json.loads(context)
            except json.JSONDecodeError:
                logger.warning("Invalid JSON context provided, ignoring")
                parsed_context = {"raw_context": context}
        
        # Process uploaded file if provided
        file_content = ""
        file_info = {}
        
        if file and file.filename:
            try:
                # Validate file
                file_bytes = await file.read()
                file_size = len(file_bytes)
                
                # Check file size (max 10MB)
                if file_size > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=400,
                        detail="File too large. Maximum size is 10MB"
                    )
                
                # Check file type
                allowed_extensions = ['.txt', '.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.csv']
                file_extension = os.path.splitext(file.filename)[1].lower()
                
                if file_extension not in allowed_extensions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
                    )
                
                # Extract text from file using existing text service
                from app.mutil_agent.services.text_service import TextSummaryService
                text_service = TextSummaryService()
                
                file_content = await text_service.extract_text_from_document(
                    file_content=file_bytes,
                    file_extension=file_extension,
                    filename=file.filename
                )
                
                file_info = {
                    "filename": file.filename,
                    "file_size": file_size,
                    "file_type": file_extension,
                    "extracted_text_length": len(file_content) if file_content else 0,
                    "processing_status": "success" if file_content else "failed"
                }
                
                logger.info(f"📄 File processed: {file.filename} - {len(file_content)} characters extracted")
                
            except Exception as e:
                logger.error(f"❌ File processing error: {str(e)}")
                file_info = {
                    "filename": file.filename if file else "unknown",
                    "processing_status": "error",
                    "error": str(e)
                }
        
        # Enhance user request with file content
        enhanced_request = user_request
        if file_content:
            enhanced_request += f"\n\n--- DOCUMENT CONTENT ---\n{file_content}\n--- END DOCUMENT ---"
        
        # Enhance context with file information
        if parsed_context is None:
            parsed_context = {}
        
        if file_info:
            parsed_context["file_info"] = file_info
            parsed_context["has_document"] = bool(file_content)
            parsed_context["document_length"] = len(file_content) if file_content else 0
        
        # Process through Strands Agent service
        result = await strands_service.process_supervisor_request(
            user_request=enhanced_request,
            context=parsed_context
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        
        # Add file processing info to result
        result["file_processing"] = file_info
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": result,
                "message": "Strands Supervisor Agent with file processing completed",
                "agent_info": {
                    "agent_type": "strands_supervisor_orchestrator_with_file",
                    "framework": "strands_agents_sdk",
                    "version": "1.0.0",
                    "coordinated_agents": ["compliance_validation", "risk_assessment", "document_intelligence"],
                    "file_processing": True,
                    "supported_formats": allowed_extensions
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Strands Supervisor Agent (File Upload) error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Strands Supervisor Agent with file processing failed: {str(e)}"
            }
        )


# ============================================================================
# MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/agents/status", response_model=dict)
async def get_strands_agents_status():
    """
    Get status of all Strands Agents
    
    Returns:
        Status information for all available Strands Agents
    """
    try:
        result = await strands_service.get_agent_status()
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": result,
                "message": "Strands Agents status retrieved successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Strands Agents status error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Failed to get Strands Agents status: {str(e)}"
            }
        )


@router.get("/tools/list", response_model=dict)
async def list_strands_agent_tools():
    """
    List all available Strands Agent tools
    
    Returns:
        List of available tools with descriptions and parameters
    """
    try:
        result = await strands_service.list_available_tools()
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": result,
                "message": "Strands Agent tools listed successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Strands Agent tools list error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Failed to list Strands Agent tools: {str(e)}"
            }
        )


