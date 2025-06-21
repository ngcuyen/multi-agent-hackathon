import json
import logging

from app.themovie.schemas.base import ResponseStatus
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

import os
from typing import Optional, List
from pydantic import BaseModel

from app.themovie.databases.postgres import PostgreSQLSingleton, get_postgres_service
from app.themovie.services.movie_service import MovieRecommender
from app.themovie.databases.postgres import get_postgres_service, PostgreSQLSingleton


router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../services/gcn_model.pth")


class RecommendationResponse(BaseModel):
    movie_id: int
    score: float
    title: Optional[str] = None


@router.post("/train-model")
async def train_model(
    epochs: int = 200,
):
    try:
        recommender = MovieRecommender(model_path=MODEL_PATH)
        users, items, ratings, feature_matrix = recommender.prepare()
        if feature_matrix is None or ratings.empty:
            raise HTTPException(
                status_code=400, detail="Not enough data to train model."
            )
        train_loss = recommender.train_model(
            ratings_data=ratings,
            feature_matrix=feature_matrix,
            model_path=MODEL_PATH,
            epochs=epochs,
            learning_rate=0.0005,
            weight_decay=1e-5,
        )
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": {"train_loss": train_loss},
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Error training model: {str(e)}",
            },
        )


@router.post("/pre-train-model")
async def pre_train_model(
    epochs: int = 200,
):
    try:
        recommender = MovieRecommender(model_path=MODEL_PATH)
        _, _, ratings, feature_matrix = recommender.prepare()
        if feature_matrix is None or ratings.empty:
            raise HTTPException(
                status_code=400, detail="Not enough data to train model."
            )
        train_loss = recommender.train_model(
            ratings_data=ratings,
            feature_matrix=feature_matrix,
            model_path=MODEL_PATH,
            epochs=epochs,
            learning_rate=0.0005,
            weight_decay=1e-5,
        )
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": {"train_loss": train_loss},
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Error training model: {str(e)}",
            },
        )


@router.post("/update-model")
async def update_model(
    epochs: int = 200,
):
    try:
        recommender = MovieRecommender(model_path=MODEL_PATH)
        new_ratings = recommender.get_new_ratings(batch_size=5)
        if new_ratings.empty:
            return JSONResponse(
                status_code=200,
                content={
                    "status": ResponseStatus.SUCCESS,
                    "message": "No new ratings to update.",
                },
            )
        if len(new_ratings) >= 5:
            print(f"Found {len(new_ratings)} new ratings. Updating model...")
            _, _, ratings, feature_matrix = recommender.prepare()
            train_loss = recommender.train_model(
                ratings_data=ratings,
                feature_matrix=feature_matrix,
                model_path=MODEL_PATH,
                epochs=epochs,
                learning_rate=0.0005,
                weight_decay=1e-5,
            )
            recommender.update_ratings(new_ratings)
            return JSONResponse(
                status_code=200,
                content={
                    "status": ResponseStatus.SUCCESS,
                    "message": f"Found {len(new_ratings)} new ratings. Updating model. Loss:{train_loss}",
                },
            )
        else:
            print(
                f"Only {len(new_ratings)} new ratings found. Waiting for more ratings..."
            )
            return JSONResponse(
                status_code=200,
                content={
                    "status": ResponseStatus.ERROR,
                    "message": f"Only {len(new_ratings)} new ratings found. Waiting for more ratings...",
                },
            )
    except Exception as e:
        logging.error(f"Error updating model: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Error updating model: {str(e)}",
            },
        )


@router.get("/recommendations/{user_id}", response_model=List[RecommendationResponse])
async def get_recommendations(
    user_id: int,
    top_k: int = 10,
    # pg_service: PostgreSQLSingleton = Depends(get_postgres_service),
):
    """Get movie recommendations for a specific user."""
    try:
        # Initialize the movie recommender with the model
        recommender = MovieRecommender(model_path=MODEL_PATH)

        # Get recommendations
        raw_recommendations = recommender.get_recommendations(user_id, top_k=top_k)

        # if not raw_recommendations:
        #     return []

        # # Get movie titles for the recommended movie IDs
        # movie_ids = [rec[0] for rec in raw_recommendations]
        # placeholders = ", ".join(["%s"] * len(movie_ids))

        # query = f"""
        #     SELECT movie_id, movie_title
        #     FROM core_movie
        #     WHERE movie_id IN ({placeholders})
        # """

        # columns, movie_data = pg_service.execute_query(query, tuple(movie_ids))
        # movie_titles = {row[0]: row[1] for row in movie_data} if movie_data else {}

        # # Format the recommendations with titles
        # recommendations = [
        #     RecommendationResponse(
        #         movie_id=rec[0],
        #         score=rec[1],
        #         title=movie_titles.get(rec[0], "Unknown Title"),
        #     )
        #     for rec in raw_recommendations
        # ]
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": {"recommendations": raw_recommendations},
            },
        )

    except Exception as e:
        logging.error(f"Error getting recommendations: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "status": ResponseStatus.ERROR,
                "message": f"Error getting recommendations: {str(e)}",
            },
        )


@router.get("/get-users")
async def get_users(pg_service: PostgreSQLSingleton = Depends(get_postgres_service)):
    query = "SELECT * FROM core_user LIMIT 10"
    columns, data = pg_service.execute_query(query)
    result = []
    if data:
        # Convert data to dictionary format
        result = [dict(zip(columns, row)) for row in data]
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": {"users": result},
            },
        )


@router.get("/get-movies")
async def get_users(pg_service: PostgreSQLSingleton = Depends(get_postgres_service)):
    query = "SELECT * FROM core_movie LIMIT 10"
    columns, data = pg_service.execute_query(query)
    result = []
    if data:
        # Convert data to dictionary format
        result = [dict(zip(columns, row)) for row in data]
        return JSONResponse(
            status_code=200,
            content={
                "status": ResponseStatus.SUCCESS,
                "data": {"movies": result},
            },
        )
