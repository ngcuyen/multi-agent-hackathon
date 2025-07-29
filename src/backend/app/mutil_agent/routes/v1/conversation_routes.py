import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse

from app.mutil_agent.agents.conversation_agent.state import ConversationState
from app.mutil_agent.exceptions import DefaultException
from app.mutil_agent.models.message_dynamodb import MessageDynamoDB as Message, MessageTypesDynamoDB as MessageTypes
from app.mutil_agent.repositories.conversation_repository import ConversationRepository
from app.mutil_agent.schemas.base import (
    ConversationRequest,
    SuccessResponse,
    ResponseStatus,
)

from app.mutil_agent.services.conversation_service import stream_chat

router = APIRouter()


@router.post("/chat", response_model=SuccessResponse)
async def chat(
    request: ConversationRequest,
):
    """
    This endpoint is used to create a new conversation or continue a conversation.
    """
    try:
        if request.conversation_id is None:
            # For now, return a simple new conversation ID
            # TODO: Migrate ConversationRepository to DynamoDB if needed
            from uuid import uuid4
            new_conversation = {
                "conversation_id": str(uuid4())
            }
            print(
                f"[CONVERSATION_ROUTER] - New conversation created: {json.dumps(new_conversation)}"
            )
            return JSONResponse(
                status_code=200,
                content={"status": ResponseStatus.SUCCESS, "data": new_conversation},
            )

        # Save human message to DynamoDB (no session needed)
        message = Message(
            conversation_id=UUID(request.conversation_id),
            message=request.message,
            type=MessageTypes.HUMAN,
        )
        await message.save()

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

        logging.info(f"[CONVERSATION] Initial state messages: {initial_state.messages}")
        logging.info(f"[CONVERSATION] Message type: {type(initial_state.messages[-1])}")

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
        # Save error message to DynamoDB (no session needed)
        error_message = Message(
            conversation_id=UUID(request.conversation_id),
            message=emitted_error.message,
            type=MessageTypes.SYSTEM,
        )
        await error_message.save()
        return JSONResponse(
            status_code=400, content={"status": ResponseStatus.ERROR, "message": str(e)}
        )
