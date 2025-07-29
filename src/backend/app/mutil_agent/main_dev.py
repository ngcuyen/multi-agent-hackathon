import warnings
import os

warnings.filterwarnings(
    "ignore", category=UserWarning, module="pydantic._internal._fields"
)
from fastapi import FastAPI
from fastapi_pagination import add_pagination
from app.mutil_agent.middleware.custom_middleware import CustomMiddleware
from app.mutil_agent.routes.v1_public_routes import router as v1_public_routes

app = FastAPI(
    title="AI Risk Assessment API",
    description="Multi-agent hackathon project for risk assessment",
    version="1.0.0"
)


@app.on_event("startup")
async def start_database():
    """
    Startup event handler - gracefully handle AWS connection failures for development
    """
    print("[STARTUP] Starting AI Risk Assessment API...")
    
    # Try to initialize DynamoDB but don't fail if it's not available
    try:
        from app.mutil_agent.databases.dynamodb import initiate_dynamodb
        from app.mutil_agent.models.message_dynamodb import MessageDynamoDB
        
        await initiate_dynamodb()
        await MessageDynamoDB.create_table_if_not_exists()
        print("[STARTUP] DynamoDB tables initialized successfully")
    except Exception as e:
        print(f"[STARTUP] Warning: Could not initialize DynamoDB: {e}")
        print("[STARTUP] Running in development mode without AWS services")
    
    # Try to include full routes if AWS is available, otherwise just public routes
    try:
        from app.mutil_agent.routes.v1_routes import router as v1_router
        app.include_router(v1_router, prefix="/riskassessment/api", tags=["v1"])
        print("[STARTUP] Full API routes loaded")
    except Exception as e:
        print(f"[STARTUP] Warning: Could not load full API routes: {e}")
        print("[STARTUP] Only public routes available")


# Add middleware and public routes (these should always work)
app.add_middleware(CustomMiddleware)
app.include_router(v1_public_routes, prefix="/riskassessment/public/api", tags=["public-v1"])
add_pagination(app)

# Add a simple root endpoint
@app.get("/")
async def root():
    return {
        "message": "AI Risk Assessment API", 
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }
