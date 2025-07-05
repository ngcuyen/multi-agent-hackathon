from fastapi import APIRouter

from app.riskassessment.routes.v1.public.health_check import router as health_check

router = APIRouter()

router.include_router(health_check, prefix="/v1/health-check")
