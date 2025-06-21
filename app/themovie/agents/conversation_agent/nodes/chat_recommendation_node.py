import logging
from uuid import UUID

from app.themovie.databases.postgres import PostgreSQLSingleton, get_postgres_service
from app.themovie.routes.v1.movie_routes import MODEL_PATH
from app.themovie.services.movie_service import MovieRecommender
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.types import StreamWriter

from app.themovie.agents.conversation_agent.prompts.system_prompts import (
    system_prompt_chat_node,
    system_prompt_chat_recommendation_node,
)
from app.themovie.agents.conversation_agent.prompts.user_prompts import (
    user_prompt_chat_node,
    user_prompt_chat_recommendation_node,
)
from app.themovie.agents.conversation_agent.state import ConversationState
from app.themovie.config import (
    CONVERSATION_CHAT_MODEL_NAME,
    CONVERSATION_CHAT_TOP_P,
    CONVERSATION_CHAT_TEMPERATURE,
    MESSAGES_LIMIT,
)
from app.themovie.exceptions import StreamingException
from app.themovie.factories.ai_model_factory import AIModelFactory
from app.themovie.models.message import MessageTypes
from app.themovie.utils.helpers import StreamWriter as ConversationStreamWriter


async def chat_recommendation_node(
    state: ConversationState, config: RunnableConfig, writer: StreamWriter
) -> ConversationState:
    llm = AIModelFactory.create_model_service(
        model_name=CONVERSATION_CHAT_MODEL_NAME,
        temperature=CONVERSATION_CHAT_TEMPERATURE,
        top_p=CONVERSATION_CHAT_TOP_P,
    )
    conversation_id = state.conversation_id
    node_name = config.get("metadata", {}).get("langgraph_node")
    try:
        pg_service = PostgreSQLSingleton()
        recommender = MovieRecommender(model_path=MODEL_PATH)
        # Get recommendations
        raw_recommendations = recommender.get_recommendations(state.user_id, top_k=40)
        if not raw_recommendations:
            return []

        # Get movie titles for the recommended movie IDs
        movie_ids = [rec[0] for rec in raw_recommendations]
        placeholders = ", ".join(["%s"] * len(movie_ids))

        query = f"""
            SELECT 
                m.movie_id, m.movie_title, m.release_date, m.link_image, m.tmdb_id, m.overview, m.runtime, m.keywords, m.director, m.caster,
                STRING_AGG(g.genre_name, ', ') AS genres
            FROM core_movie m
            LEFT JOIN core_movie_genres mg ON m.movie_id = mg.movie_id
            LEFT JOIN core_genre g ON mg.genre_id = g.genre_id
            WHERE m.movie_id IN ({placeholders})
            GROUP BY m.movie_id, m.movie_title, m.release_date, m.link_image, m.tmdb_id, m.overview, m.runtime, m.keywords, m.director, m.caster
        """
        _, movie_data = pg_service.execute_query(query, tuple(movie_ids))
        movie_dict = {row[0]: row for row in movie_data}

        sorted_movie_data = [
            movie_dict[movie_id] for movie_id in movie_ids if movie_id in movie_dict
        ]

        user_prompt = user_prompt_chat_recommendation_node(
            sorted_movie_data, state.messages[-1]
        )
        system_prompt = system_prompt_chat_recommendation_node()

        async for chunk in llm.ai_astream(
            [SystemMessage(content=(system_prompt))]
            + [HumanMessage(content=user_prompt)]
        ):
            writer(
                ConversationStreamWriter(
                    messages=[llm.ai_chunk_stream(chunk)],
                    node_name=node_name,
                    type=MessageTypes.AI,
                ).to_dict()
            )

        state.type = MessageTypes.HIDDEN
        state.messages = ["[END]"]
        state.node_name = node_name
        return state

    except Exception as e:
        logging.error(
            f"[CONVERSATION_CHAT_NODE] - Error in chat_node: {str(e)}, conversation_id: {conversation_id}"
        )
        raise StreamingException(config["metadata"].get("langgraph_node"))
