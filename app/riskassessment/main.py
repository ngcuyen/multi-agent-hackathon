import warnings

warnings.filterwarnings(
    "ignore", category=UserWarning, module="pydantic._internal._fields"
)
from fastapi import FastAPI
from fastapi_pagination import add_pagination
from app.riskassessment.middleware.custom_middleware import CustomMiddleware
from app.riskassessment.routes.v1_routes import router as v1_router
from app.riskassessment.routes.v1_public_routes import router as v1_public_routes
from app.riskassessment.databases.dynamodb import initiate_dynamodb
from app.riskassessment.models.message_dynamodb import MessageDynamoDB

app = FastAPI()


@app.on_event("startup")
async def start_database():
    
    # Initialize DynamoDB (for Message models)
    await initiate_dynamodb()
    
    # Create DynamoDB tables if they don't exist
    try:
        await MessageDynamoDB.create_table_if_not_exists()
        print("[STARTUP] DynamoDB tables initialized successfully")
    except Exception as e:
        print(f"[STARTUP] Warning: Could not create DynamoDB tables: {e}")
        print("[STARTUP] Please create tables manually in AWS Console if needed")


app.add_middleware(CustomMiddleware)
app.include_router(v1_public_routes, prefix="/riskassessment/public/api", tags=["public-v1"])
app.include_router(v1_router, prefix="/riskassessment/api", tags=["v1"])
add_pagination(app)
