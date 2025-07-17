from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class KnowledgeQueryRequest(BaseModel):
    query: str
    max_results: int = 5
    category: Optional[str] = None

class KnowledgeResult(BaseModel):
    title: str
    content: str
    relevance_score: float
    source: str
    category: str

class KnowledgeQueryResponse(BaseModel):
    status: str
    query: str
    results: List[KnowledgeResult]
    total_results: int
    message: str

@router.post("/query", response_model=KnowledgeQueryResponse)
async def query_knowledge_base(request: KnowledgeQueryRequest):
    """
    Query the banking knowledge base for relevant information
    """
    try:
        # Simulate knowledge base query with banking-specific responses
        banking_knowledge = {
            "letter of credit": [
                {
                    "title": "UCP 600 Requirements for Letter of Credit",
                    "content": "Letter of Credit must comply with UCP 600 standards including proper documentation, beneficiary details, and expiry dates.",
                    "relevance_score": 0.95,
                    "source": "UCP 600 Guidelines",
                    "category": "Trade Finance"
                },
                {
                    "title": "LC Processing Workflow",
                    "content": "Standard LC processing involves document verification, compliance checking, and payment authorization.",
                    "relevance_score": 0.88,
                    "source": "Banking Operations Manual",
                    "category": "Operations"
                }
            ],
            "credit assessment": [
                {
                    "title": "Credit Risk Assessment Framework",
                    "content": "Comprehensive credit assessment includes financial analysis, collateral evaluation, and repayment capacity analysis.",
                    "relevance_score": 0.92,
                    "source": "Risk Management Guidelines",
                    "category": "Risk Management"
                }
            ],
            "compliance": [
                {
                    "title": "SBV Banking Regulations",
                    "content": "State Bank of Vietnam regulations for banking operations, capital adequacy, and customer protection.",
                    "relevance_score": 0.90,
                    "source": "SBV Circular 01/2024",
                    "category": "Compliance"
                }
            ]
        }
        
        query_lower = request.query.lower()
        results = []
        
        for key, knowledge_items in banking_knowledge.items():
            if key in query_lower or any(word in query_lower for word in key.split()):
                results.extend(knowledge_items[:request.max_results])
        
        if not results:
            # Default banking information
            results = [
                {
                    "title": "General Banking Information",
                    "content": "VPBank provides comprehensive banking services including corporate banking, trade finance, and risk management solutions.",
                    "relevance_score": 0.70,
                    "source": "VPBank Service Guide",
                    "category": "General"
                }
            ]
        
        return KnowledgeQueryResponse(
            status="success",
            query=request.query,
            results=[KnowledgeResult(**result) for result in results[:request.max_results]],
            total_results=len(results),
            message=f"Tìm thấy {len(results)} kết quả liên quan"
        )
        
    except Exception as e:
        logger.error(f"Error querying knowledge base: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_knowledge_categories():
    """
    Get available knowledge base categories
    """
    return {
        "status": "success",
        "categories": [
            {
                "id": "trade_finance",
                "name": "Trade Finance",
                "description": "Letter of Credit, Trade Documentation, UCP 600"
            },
            {
                "id": "risk_management", 
                "name": "Risk Management",
                "description": "Credit Assessment, Risk Analysis, Compliance"
            },
            {
                "id": "operations",
                "name": "Banking Operations", 
                "description": "Process Workflows, Documentation, Procedures"
            },
            {
                "id": "compliance",
                "name": "Regulatory Compliance",
                "description": "SBV Regulations, International Standards, Policies"
            }
        ]
    }
