import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClientSession

from app.themovie.agents.conversation_agent.state import ConversationState
from app.themovie.exceptions import DefaultException
from app.themovie.models.message import Message
from app.themovie.models.message import MessageTypes
from app.themovie.repositories.conversation_repository import ConversationRepository
from app.themovie.schemas.base import (
    ConversationRequest,
    SuccessResponse,
    ResponseStatus,
)
from app.themovie.databases.mongo import get_db_session_dependency

from app.themovie.services.conversation_service import stream_chat

router = APIRouter()


@router.post("/chat", response_model=SuccessResponse)
async def chat(
    request: ConversationRequest,
    session: AsyncIOMotorClientSession = Depends(get_db_session_dependency),
):
    """
    This endpoint is used to create a new conversation or continue a conversation.
    """
    try:
        if request.conversation_id is None:
            new_conversation = await ConversationRepository.create_new_conversation(
                request, session
            )
            print(
                f"[CONVERSATION_ROUTER] - New conversation created: {json.dumps(new_conversation)}"
            )
            return JSONResponse(
                status_code=200,
                content={"status": ResponseStatus.SUCCESS, "data": new_conversation},
            )

        await Message(
            conversation_id=UUID(request.conversation_id),
            message=request.message,
            type=MessageTypes.HUMAN,
        ).create(session=session)

        initial_state = ConversationState(
            conversation_id=request.conversation_id,
            user_id=request.user_id,
            messages=[request.message],
            node_name="",
            next_node="chat_knowledgebase_node",
            type=MessageTypes.HUMAN,
        )
        print(
            f"[CONVERSATION_ROUTER] - Initial state for chat: {json.dumps(initial_state.dict())}"
        )

        return StreamingResponse(
            stream_chat(
                request,
                initial_state,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Connection": "keep-alive",
                "Transfer-Encoding": "chunked",
            },
        )

    except Exception as e:
        logging.error(
            f"[CONVERSATION_ROUTER] - Error in chat: {str(e)} - conversation_id: {request.conversation_id}"
        )
        emitted_error = DefaultException(message="ERROR")
        await Message(
            conversation_id=UUID(request.conversation_id),
            message=emitted_error.message,
            type=MessageTypes.SYSTEM,
        ).create(session=session)
        return JSONResponse(
            status_code=400, content={"status": ResponseStatus.ERROR, "message": str(e)}
        )
