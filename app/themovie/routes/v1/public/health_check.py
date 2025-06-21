from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get(
    "/", summary="Health Check", response_description="Health status of the Service"
)
async def health_check():
    return JSONResponse(content={"status": "success"})
