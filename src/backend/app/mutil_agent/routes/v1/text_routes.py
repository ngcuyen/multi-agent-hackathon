import json
import logging
import os
from typing import Optional, List, Union
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.mutil_agent.schemas.base import ResponseStatus
from app.mutil_agent.services.text_service import TextSummaryService
from app.mutil_agent.helpers.dynamic_summary_config import analyze_document_for_summary

router = APIRouter()

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SummaryRequest(BaseModel):
    text: str = Field(..., description="Text content to summarize")
    summary_type: Optional[str] = Field(default="general", description="Type of summary: general, bullet_points, key_insights")
    max_length: Optional[int] = Field(default=300, description="Maximum length of summary in words")
    language: Optional[str] = Field(default="vietnamese", description="Language for summary output")


class SummaryResponse(BaseModel):
    original_length: int = Field(..., description="Length of original text in characters")
    summary_length: int = Field(..., description="Length of summary in characters")
    summary: str = Field(..., description="Generated summary")
    summary_type: str = Field(..., description="Type of summary generated")
    compression_ratio: float = Field(..., description="Compression ratio (original/summary)")


class URLSummaryRequest(BaseModel):
    url: str = Field(..., description="URL to summarize")
    summary_type: Optional[str] = Field(default="general", description="Type of summary")
    max_length: Optional[int] = Field(default=300, description="Maximum length in words")
    language: Optional[str] = Field(default="vietnamese", description="Output language")


@router.post("/summary/text", response_model=dict)
async def summarize_text(request: SummaryRequest):
    """
    Tóm tắt văn bản được cung cấp trực tiếp
    
    Args:
        request: SummaryRequest object containing text and parameters
        
    Returns:
        JSON response with summarized text and metadata
    """
    try:
        # Validate input text
        if not request.text or len(request.text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Văn bản quá ngắn để tóm tắt (tối thiểu 50 ký tự)"
            )
        
        # Initialize text summary service
        text_service = TextSummaryService()
        
        # Generate summary
        summary_result = await text_service.summarize_text(
            text=request.text,
            summary_type=request.summary_type,
            max_length=request.max_length,
            language=request.language
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": summary_result,
                "message": "Tóm tắt văn bản thành công"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in text summarization: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi khi tóm tắt văn bản: {str(e)}"
            }
        )


@router.options("/summary/document")
async def options_document_summary():
    """Handle CORS preflight for document summary"""
    return JSONResponse(
        status_code=200,
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )


@router.post("/summary/document", response_model=dict)
async def summarize_document(
    file: UploadFile = File(..., description="Document file to summarize"),
    summary_type: str = Form(default="general"),
    max_length: int = Form(default=300),
    language: str = Form(default="vietnamese"),
    max_pages: Optional[int] = Form(default=None, description="Maximum pages to process (None = all pages)")
):
    """
    Tóm tắt tài liệu từ file upload (hỗ trợ .txt, .pdf, .docx)
    
    Args:
        file: Uploaded file
        summary_type: Type of summary to generate
        max_length: Maximum length in words
        language: Output language
        
    Returns:
        JSON response with document summary and metadata
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
        allowed_extensions = ['.txt', '.pdf', '.docx', '.doc']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Định dạng file không được hỗ trợ. Chỉ chấp nhận: {', '.join(allowed_extensions)}"
            )
        
        # Initialize text summary service
        text_service = TextSummaryService()
        
        # Extract text from document
        extracted_text = await text_service.extract_text_from_document(
            file_content=file_content,
            file_extension=file_extension,
            filename=file.filename,
            max_pages=max_pages        )
        
        # Validate extracted text
        if len(extracted_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Không thể trích xuất đủ nội dung từ tài liệu để tóm tắt"
            )
        
        # Generate summary
        summary_result = await text_service.summarize_text(
            text=extracted_text,
            summary_type=summary_type,
            max_length=max_length,
            language=language
        )
        
        # Add document info to response
        summary_result["document_info"] = {
            "filename": file.filename,
            "file_size": len(file_content),
            "file_type": file_extension,
            "extracted_text_length": len(extracted_text),
            "max_pages_processed": max_pages or "all"        }
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": summary_result,
                "message": f"Tóm tắt tài liệu '{file.filename}' thành công"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in document summarization: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi khi tóm tắt tài liệu: {str(e)}"
            }
        )


@router.get("/summary/types", response_model=dict)
async def get_summary_types():
    """
    Lấy danh sách các loại tóm tắt có sẵn và thông tin hỗ trợ
    
    Returns:
        JSON response with available summary types and supported formats
    """
    try:
        summary_types = {
            "general": {
                "name": "Tóm tắt chung",
                "description": "Tóm tắt tổng quan nội dung chính của văn bản",
                "use_case": "Phù hợp cho việc hiểu nhanh nội dung tổng thể"
            },
            "bullet_points": {
                "name": "Điểm chính",
                "description": "Liệt kê các điểm chính dưới dạng bullet points",
                "use_case": "Phù hợp cho báo cáo, danh sách yêu cầu"
            },
            "key_insights": {
                "name": "Thông tin quan trọng",
                "description": "Trích xuất những thông tin và insight quan trọng nhất",
                "use_case": "Phù hợp cho phân tích, nghiên cứu"
            },
            "executive_summary": {
                "name": "Tóm tắt điều hành",
                "description": "Tóm tắt ngắn gọn dành cho lãnh đạo và quản lý",
                "use_case": "Phù hợp cho báo cáo lãnh đạo, tài liệu kinh doanh"
            },
            "detailed": {
                "name": "Tóm tắt chi tiết",
                "description": "Tóm tắt chi tiết nhưng vẫn súc tích hơn bản gốc",
                "use_case": "Phù hợp khi cần giữ lại nhiều thông tin"
            }
        }
        
        supported_info = {
            "summary_types": summary_types,
            "supported_languages": [
                {
                    "code": "vietnamese",
                    "name": "Tiếng Việt",
                    "description": "Tóm tắt bằng tiếng Việt"
                },
                {
                    "code": "english", 
                    "name": "English",
                    "description": "Summarize in English"
                }
            ],
            "supported_file_types": [
                {
                    "extension": ".txt",
                    "name": "Text File",
                    "description": "Plain text files"
                },
                {
                    "extension": ".pdf",
                    "name": "PDF Document", 
                    "description": "Portable Document Format files"
                },
                {
                    "extension": ".docx",
                    "name": "Word Document",
                    "description": "Microsoft Word documents (new format)"
                },
                {
                    "extension": ".doc",
                    "name": "Word Document (Legacy)",
                    "description": "Microsoft Word documents (legacy format)"
                }
            ],
            "limits": {
                "max_file_size": "10MB",
                "min_text_length": "50 characters",
                "max_summary_length": "1000 words",
                "url_timeout": "30 seconds"
            }
        }
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": supported_info,
                "message": "Lấy thông tin loại tóm tắt thành công"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting summary types: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi khi lấy thông tin loại tóm tắt: {str(e)}"
            }
        )


@router.get("/summary/health", response_model=dict)
async def health_check():
    """
    Kiểm tra tình trạng hoạt động của dịch vụ tóm tắt
    
    Returns:
        JSON response with service health status
    """
    try:
        # Initialize text summary service
        text_service = TextSummaryService()
        
        # Check AI services availability
        ai_services_status = {
            "bedrock": text_service.bedrock_service is not None
        }
        
        # Overall health status
        is_healthy = any(ai_services_status.values())
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": {
                    "service_status": "healthy" if is_healthy else "degraded",
                    "ai_services": ai_services_status,
                    "fallback_available": True,
                    "timestamp": "2024-06-22T08:00:00Z"
                },
                "message": "Dịch vụ tóm tắt đang hoạt động"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi kiểm tra tình trạng dịch vụ: {str(e)}"
            }
        )


# Legacy endpoint for backward compatibility
@router.post("/summary")
async def legacy_summary_endpoint():
    """
    Legacy endpoint - redirects to new summary endpoints
    """
    return JSONResponse(
        status_code=301,
        content={
            "status": ResponseStatus.ERROR,
            "message": "Endpoint này đã được thay thế. Vui lòng sử dụng:",
            "new_endpoints": {
                "text_summary": "/api/v1/text/summary/text",
                "document_summary": "/api/v1/text/summary/document", 
                "url_summary": "/api/v1/text/summary/url",
                "summary_types": "/api/v1/text/summary/types"
            }
        }
    )

@router.post("/summary/analyze", response_model=dict)
async def analyze_document_for_summary_endpoint(
    file: UploadFile = File(..., description="Document file to analyze")
):
    """
    Phân tích tài liệu và đưa ra gợi ý về max_length phù hợp
    
    Args:
        file: Uploaded file to analyze
        
    Returns:
        JSON response with document analysis and recommendations
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
        allowed_extensions = ['.txt', '.pdf', '.docx', '.doc']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Định dạng file không được hỗ trợ. Chỉ chấp nhận: {', '.join(allowed_extensions)}"
            )
        
        # Initialize text summary service
        text_service = TextSummaryService()
        
        # Extract text from document
        extracted_text = await text_service.extract_text_from_document(
            file_content=file_content,
            file_extension=file_extension,
            filename=file.filename
        )
        
        # Analyze document
        from app.mutil_agent.helpers.dynamic_summary_config import analyze_document_for_summary
        analysis = analyze_document_for_summary(extracted_text)
        
        # Add file info
        analysis["file_info"] = {
            "filename": file.filename,
            "file_size": len(file_content),
            "file_type": file_extension,
            "extracted_text_length": len(extracted_text)
        }
        
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": analysis,
                "message": f"Phân tích tài liệu '{file.filename}' thành công"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in document analysis: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Lỗi khi phân tích tài liệu: {str(e)}"
            }
        )
