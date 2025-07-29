import warnings

warnings.filterwarnings(
    "ignore", category=UserWarning, module="pydantic._internal._fields"
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import add_pagination
from app.mutil_agent.middleware.custom_middleware import CustomMiddleware
from app.mutil_agent.routes.v1_routes import router as v1_router
from app.mutil_agent.routes.v1_public_routes import router as v1_public_routes
from app.mutil_agent.databases.dynamodb import initiate_dynamodb
from app.mutil_agent.models.message_dynamodb import MessageDynamoDB

app = FastAPI()

# Add CORS middleware FIRST (very important!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware AFTER CORS
app.add_middleware(CustomMiddleware)


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


# Routes
app.include_router(v1_public_routes, prefix="/mutil_agent/public/api", tags=["public-v1"])
app.include_router(v1_router, prefix="/mutil_agent/api", tags=["v1"])
add_pagination(app)
