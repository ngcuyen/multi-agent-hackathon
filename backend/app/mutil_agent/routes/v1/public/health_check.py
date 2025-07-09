from fastapi import APIRouter
from fastapi.responses import JSONResponse
import time

router = APIRouter()


@router.get(
    "/health", 
    summary="Health Check", 
    response_description="Health status of the Service"
)
async def health_check():
    """
    Health check endpoint for Docker and load balancers
    """
    return JSONResponse(content={
        "status": "healthy",
        "service": "ai-risk-assessment-api",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "features": {
            "text_summary": True,
            "s3_integration": True,
            "knowledge_base": True
        }
    })


@router.get(
    "/", 
    summary="Root Health Check", 
    response_description="Basic health status"
)
async def root_health_check():
    """
    Basic health check endpoint
    """
    return JSONResponse(content={"status": "success"})
