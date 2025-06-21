import warnings

warnings.filterwarnings(
    "ignore", category=UserWarning, module="pydantic._internal._fields"
)
from fastapi import FastAPI
from fastapi_pagination import add_pagination
from app.themovie.middleware.custom_middleware import CustomMiddleware
from app.themovie.routes.v1_routes import router as v1_router
from app.themovie.routes.v1_public_routes import router as v1_public_routes
from app.themovie.databases.mongo import initiate_database

app = FastAPI()


@app.on_event("startup")
async def start_database():
    await initiate_database()


app.add_middleware(CustomMiddleware)
app.include_router(v1_public_routes, prefix="/themovie/public/api", tags=["public-v1"])
app.include_router(v1_router, prefix="/themovie/api", tags=["v1"])
add_pagination(app)
