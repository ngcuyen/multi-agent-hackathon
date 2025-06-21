from fastapi import APIRouter

from app.themovie.routes.v1.conversation_routes import router as conversation_router
from app.themovie.routes.v1.movie_routes import router as movie_router

router = APIRouter()

router.include_router(conversation_router, prefix="/v1/conversation")
router.include_router(movie_router, prefix="/v1/movie")
