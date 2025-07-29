from fastapi import APIRouter

from app.mutil_agent.routes.v1.public.health_check import router as health_check

router = APIRouter()

router.include_router(health_check, prefix="/v1/health-check")

# Add root endpoint for API information
@router.get("/")
async def api_info():
    """
    VPBank K-MULT Agent Studio API Information
    """
    return {
        "name": "VPBank K-MULT Agent Studio API",
        "version": "1.0.0",
        "description": "Multi-Agent AI for Banking Process Automation",
        "features": [
            "Document Intelligence & OCR",
            "Risk Assessment & Analysis", 
            "Compliance Validation",
            "Multi-Agent Coordination",
            "Vietnamese NLP Processing",
            "Banking Workflow Automation"
        ],
        "endpoints": {
            "health": "/mutil_agent/public/api/v1/health-check/health",
            "documentation": "/mutil_agent/docs",
            "openapi": "/mutil_agent/openapi.json"
        },
        "status": "operational"
    }

@router.get("/v1/endpoints")
async def list_endpoints():
    """
    List all available API endpoints
    """
    return {
        "status": "success",
        "endpoints": {
            "health_check": {
                "GET /mutil_agent/public/api/v1/health-check/health": "System health status"
            },
            "text_processing": {
                "POST /mutil_agent/api/v1/text/summary/document": "Document summarization",
                "POST /mutil_agent/api/v1/text/summary/text": "Text summarization", 
                "GET /mutil_agent/api/v1/text/summary/types": "Available summary types",
                "GET /mutil_agent/api/v1/text/summary/health": "Text service health"
            },
            "risk_assessment": {
                "POST /mutil_agent/api/risk/assess": "Comprehensive risk assessment",
                "GET /mutil_agent/api/risk/monitor/{entity_id}": "Risk monitoring"
            },
            "compliance": {
                "POST /mutil_agent/api/v1/compliance/validate": "Document compliance validation"
            },
            "conversation": {
                "POST /mutil_agent/api/v1/conversation/chat": "AI chat conversation"
            },
            "multi_agent": {
                "POST /mutil_agent/api/v1/agents/coordinate": "Agent coordination",
                "GET /mutil_agent/api/v1/agents/list": "List available agents",
                "GET /mutil_agent/api/v1/agents/status/{task_id}": "Task status"
            },
            "knowledge_base": {
                "POST /mutil_agent/api/v1/knowledge/query": "Query knowledge base",
                "GET /mutil_agent/api/v1/knowledge/categories": "Knowledge categories"
            }
        }
    }
