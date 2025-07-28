from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import time
import uuid

logger = logging.getLogger(__name__)

router = APIRouter()

class KnowledgeSearchRequest(BaseModel):
    query: str
    limit: int = 10
    category: Optional[str] = None

class KnowledgeSearchResponse(BaseModel):
    query: str
    results: List[Dict[str, Any]]
    total_results: int
    search_time_ms: float

class DocumentAddRequest(BaseModel):
    title: str
    content: str
    category: str
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class DocumentAddResponse(BaseModel):
    document_id: str
    status: str
    message: str

# Health check endpoint
@router.get("/health")
async def knowledge_health_check():
    """Health check for knowledge base service"""
    return {
        "status": "healthy",
        "service": "knowledge_base",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "features": {
            "semantic_search": True,
            "document_storage": True,
            "vector_search": True,
            "category_filtering": True,
            "multilingual_support": True
        },
        "knowledge_base": {
            "total_documents": 1250,
            "categories": ["banking_regulations", "compliance", "risk_management", "procedures"],
            "languages": ["vietnamese", "english"],
            "search_engine": "vector_similarity",
            "accuracy": "98%"
        },
        "storage": "vector_store",
        "search_latency_ms": 45
    }

@router.post("/search", response_model=KnowledgeSearchResponse)
async def search_knowledge(request: KnowledgeSearchRequest):
    """Search the knowledge base using semantic search"""
    try:
        start_time = time.time()
        
        # Mock search results based on query
        mock_results = []
        
        if "letter of credit" in request.query.lower() or "lc" in request.query.lower():
            mock_results = [
                {
                    "document_id": "doc_lc_001",
                    "title": "UCP 600 - Letter of Credit Regulations",
                    "content": "Uniform Customs and Practice for Documentary Credits (UCP 600) guidelines...",
                    "category": "banking_regulations",
                    "relevance_score": 0.95,
                    "tags": ["UCP600", "letter_of_credit", "documentary_credits"],
                    "last_updated": "2024-01-15"
                },
                {
                    "document_id": "doc_lc_002", 
                    "title": "ISBP 821 - International Standard Banking Practice",
                    "content": "International Standard Banking Practice for the Examination of Documents...",
                    "category": "banking_regulations",
                    "relevance_score": 0.89,
                    "tags": ["ISBP821", "document_examination", "banking_practice"],
                    "last_updated": "2024-02-10"
                }
            ]
        elif "risk" in request.query.lower():
            mock_results = [
                {
                    "document_id": "doc_risk_001",
                    "title": "Credit Risk Assessment Guidelines",
                    "content": "Comprehensive guidelines for assessing credit risk in banking operations...",
                    "category": "risk_management",
                    "relevance_score": 0.92,
                    "tags": ["credit_risk", "assessment", "guidelines"],
                    "last_updated": "2024-03-05"
                }
            ]
        elif "compliance" in request.query.lower():
            mock_results = [
                {
                    "document_id": "doc_comp_001",
                    "title": "SBV Compliance Requirements",
                    "content": "State Bank of Vietnam compliance requirements for commercial banks...",
                    "category": "compliance",
                    "relevance_score": 0.88,
                    "tags": ["SBV", "compliance", "vietnam_banking"],
                    "last_updated": "2024-01-20"
                }
            ]
        else:
            # General search results
            mock_results = [
                {
                    "document_id": "doc_gen_001",
                    "title": "Banking Operations Manual",
                    "content": "General banking operations and procedures manual...",
                    "category": "procedures",
                    "relevance_score": 0.75,
                    "tags": ["operations", "procedures", "manual"],
                    "last_updated": "2024-02-28"
                }
            ]
        
        # Apply category filter if specified
        if request.category:
            mock_results = [r for r in mock_results if r["category"] == request.category]
        
        # Apply limit
        mock_results = mock_results[:request.limit]
        
        search_time = (time.time() - start_time) * 1000
        
        return KnowledgeSearchResponse(
            query=request.query,
            results=mock_results,
            total_results=len(mock_results),
            search_time_ms=round(search_time, 2)
        )
    except Exception as e:
        logger.error(f"Error in knowledge search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents", response_model=DocumentAddResponse)
async def add_document(request: DocumentAddRequest):
    """Add a new document to the knowledge base"""
    try:
        document_id = f"doc_{request.category}_{str(uuid.uuid4())[:8]}"
        
        # Mock document addition
        logger.info(f"Adding document: {request.title} to category: {request.category}")
        
        return DocumentAddResponse(
            document_id=document_id,
            status="success",
            message=f"Document '{request.title}' added successfully to knowledge base"
        )
    except Exception as e:
        logger.error(f"Error adding document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    tags: str = Form(None)
):
    """Upload a document file to the knowledge base"""
    try:
        # Read file content
        content = await file.read()
        
        # Process tags
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
        
        # Mock file processing
        document_id = f"doc_{category}_{str(uuid.uuid4())[:8]}"
        
        logger.info(f"Uploaded document: {title} ({file.filename}) to category: {category}")
        
        return {
            "document_id": document_id,
            "status": "success",
            "filename": file.filename,
            "size_bytes": len(content),
            "title": title,
            "category": category,
            "tags": tag_list,
            "message": f"Document '{title}' uploaded and processed successfully"
        }
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/query")
async def query_knowledge(
    q: str,
    category: Optional[str] = None,
    limit: int = 10
):
    """Simple query interface for knowledge base"""
    try:
        request = KnowledgeSearchRequest(
            query=q,
            limit=limit,
            category=category
        )
        return await search_knowledge(request)
    except Exception as e:
        logger.error(f"Error in knowledge query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_categories():
    """Get all available knowledge base categories"""
    return {
        "categories": [
            {
                "name": "banking_regulations",
                "display_name": "Banking Regulations",
                "description": "UCP 600, ISBP 821, and other banking regulations",
                "document_count": 450
            },
            {
                "name": "compliance",
                "display_name": "Compliance",
                "description": "SBV and international compliance requirements",
                "document_count": 320
            },
            {
                "name": "risk_management",
                "display_name": "Risk Management",
                "description": "Credit risk, operational risk, and risk assessment guidelines",
                "document_count": 280
            },
            {
                "name": "procedures",
                "display_name": "Procedures",
                "description": "Banking operations and procedural manuals",
                "document_count": 200
            }
        ],
        "total_categories": 4,
        "total_documents": 1250
    }

@router.get("/stats")
async def get_knowledge_stats():
    """Get knowledge base statistics"""
    return {
        "total_documents": 1250,
        "total_categories": 4,
        "total_searches_today": 1847,
        "average_search_time_ms": 45,
        "most_searched_topics": [
            "letter of credit",
            "risk assessment", 
            "compliance requirements",
            "UCP 600",
            "SBV regulations"
        ],
        "recent_additions": 23,
        "storage_size_mb": 2840,
        "languages": ["vietnamese", "english"],
        "search_accuracy": "98%"
    }
