from fastapi import APIRouter

from app.riskassessment.routes.v1.conversation_routes import router as conversation_router
from app.riskassessment.routes.v1.text_routes import router as text_router
from app.riskassessment.routes.v1.compliance_routes import router as compliance_router

router = APIRouter()

router.include_router(conversation_router, prefix="/v1/conversation")
router.include_router(text_router, prefix="/v1/text")
router.include_router(compliance_router, prefix="/v1/compliance")
