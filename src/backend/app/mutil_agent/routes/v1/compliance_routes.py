import json
import logging
import os
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import JSONResponse

from app.mutil_agent.schemas.base import ResponseStatus
from app.mutil_agent.services.compliance_service import ComplianceValidationService
from app.mutil_agent.services.compliance_config import ComplianceConfig

router = APIRouter()

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ComplianceValidationRequest(BaseModel):
    """Request model for compliance validation - simplified for UCP 600 focus"""
    text: str = Field(..., description="Document text (from OCR or direct input)")
    document_type: Optional[str] = Field(None, description="Document type (auto-detected if not provided)")


class UCPQueryRequest(BaseModel):
    """Request model for UCP 600 knowledge base queries"""
    query: str = Field(..., description="Question about UCP 600 regulations")


@router.post("/validate", response_model=dict)
async def validate_document_compliance(request: ComplianceValidationRequest = Body(...)):
    """
    Validate document compliance against UCP 600 regulations
    
    Args:
        request: ComplianceValidationRequest with document text
        
    Returns:
        JSON response with compliance validation results
    """
    try:
        # Validate input text
        if not request.text or len(request.text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Văn bản quá ngắn để kiểm tra tuân thủ (tối thiểu 50 ký tự)"
            )
        
        # Initialize compliance service
        compliance_service = ComplianceValidationService()
        
        # Perform compliance validation
        validation_result = await compliance_service.validate_document_compliance(
            ocr_text=request.text,
            document_type=request.document_type
        )
        
        # Log result for debugging
        logger.info(f"Compliance validation completed: {validation_result.get('compliance_status')}")
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": validation_result,
                "message": "Kiểm tra tuân thủ hoàn tất"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in compliance validation: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi khi kiểm tra tuân thủ: {str(e)}"
            }
        )


@router.post("/query", response_model=dict)
async def query_ucp_regulations(request: UCPQueryRequest = Body(...)):
    """
    Query UCP 600 regulations using knowledge base
    
    Args:
        request: UCPQueryRequest with regulation query
        
    Returns:
        JSON response with regulation information
    """
    try:
        # Validate query
        if not request.query or len(request.query.strip()) < 5:
            raise HTTPException(
                status_code=400,
                detail="Câu hỏi quá ngắn (tối thiểu 5 ký tự)"
            )
        
        # Initialize compliance service
        compliance_service = ComplianceValidationService()
        
        # Query regulations
        query_result = await compliance_service.query_regulations_directly(request.query)
        
        # Log result
        logger.info(f"UCP query completed: {len(query_result.get('answer', ''))} characters")
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": query_result,
                "message": "Truy vấn quy định thành công"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in UCP query: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi khi truy vấn quy định: {str(e)}"
            }
        )


@router.post("/document", response_model=dict)
async def validate_document_file(
    file: UploadFile = File(..., description="Document file to validate"),
    document_type: Optional[str] = Form(None, description="Document type (auto-detected if not provided)")
):
    """
    Validate document file compliance (PDF, TXT, DOCX)
    
    Args:
        file: Uploaded document file
        document_type: Optional document type
        
    Returns:
        JSON response with compliance validation results
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Không có file được upload"
            )
        
        # Check file size (max 10MB)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(
                status_code=400,
                detail="File quá lớn. Kích thước tối đa là 10MB"
            )
        
        # Check file type
        allowed_extensions = ['.txt', '.pdf', '.docx', '.doc', '.csv']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Định dạng file không được hỗ trợ. Chỉ chấp nhận: {', '.join(allowed_extensions)}"
            )
        
        # Initialize compliance service
        compliance_service = ComplianceValidationService()
        
        # Extract text from document (reuse text service logic)
        from app.mutil_agent.services.text_service import TextSummaryService
        text_service = TextSummaryService()
        
        extracted_text = await text_service.extract_text_from_document(
            file_content=file_content,
            file_extension=file_extension,
            filename=file.filename
        )
        
        # Validate extracted text
        if not extracted_text or len(extracted_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Không thể trích xuất đủ văn bản từ file để kiểm tra tuân thủ"
            )
        
        # Perform compliance validation
        validation_result = await compliance_service.validate_document_compliance(
            ocr_text=extracted_text,
            document_type=document_type
        )
        
        # Add file info to result
        validation_result["file_info"] = {
            "filename": file.filename,
            "file_size": len(file_content),
            "file_type": file_extension,
            "extracted_text_length": len(extracted_text)
        }
        
        # Log result
        logger.info(f"Document file validation completed: {file.filename} - {validation_result.get('compliance_status')}")
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": validation_result,
                "message": f"Kiểm tra tuân thủ file {file.filename} hoàn tất"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in document file validation: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi khi kiểm tra tuân thủ file: {str(e)}"
            }
        )


@router.get("/health", response_model=dict)
async def health_check():
    """
    Health check endpoint for compliance service
    """
    try:
        # Initialize compliance service
        compliance_service = ComplianceValidationService()
        
        # Check knowledge base connection
        kb_status = "available" if compliance_service.knowledge_base_id else "not_configured"
        
        # Check bedrock service
        bedrock_status = "available" if compliance_service.bedrock_service else "not_configured"
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": {
                    "service": "compliance_validation",
                    "status": "healthy",
                    "knowledge_base_status": kb_status,
                    "bedrock_status": bedrock_status,
                    "knowledge_base_id": compliance_service.knowledge_base_id
                },
                "message": "Compliance service is healthy"
            }
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Health check failed: {str(e)}"
            }
        )


@router.get("/types", response_model=dict)
async def get_supported_document_types():
    """
    Get list of supported document types for compliance validation
    """
    try:
        document_types = ComplianceConfig.DOCUMENT_TYPE_DEFINITIONS
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": {
                    "supported_types": document_types,
                    "total_types": len(document_types)
                },
                "message": "Danh sách loại tài liệu được hỗ trợ"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting document types: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi khi lấy danh sách loại tài liệu: {str(e)}"
            }
        )
