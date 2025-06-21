import io
import json
import asyncio
from contextlib import asynccontextmanager
from uuid import UUID

from app.themovie.agents.conversation_agent.state import ConversationState
from app.themovie.agents.conversation_agent.workflow import get_conversation_workflow
from app.themovie.config import (
    MONGODB_URI,
    MONGO_DB_NAME,
    CONVERSATION_CHECKPOINT_COLLECTION,
    CONVERSATION_CHECKPOINT_WRITE_COLLECTION,
)
from app.themovie.databases.mongo import (
    AsyncMongoDBSaverCustom,
    get_db_session_with_context,
)
from app.themovie.models.message import Message
from app.themovie.models.message import MessageTypes
from app.themovie.schemas.base import (
    ConversationRequest,
    ResponseStatus,
)


@asynccontextmanager
async def conversation_checkpointer_context():
    async with AsyncMongoDBSaverCustom.from_conn_string(
        MONGODB_URI,
        MONGO_DB_NAME,
        CONVERSATION_CHECKPOINT_COLLECTION,
        CONVERSATION_CHECKPOINT_WRITE_COLLECTION,
    ) as memory:
        yield memory


async def stream_chat(
    request: ConversationRequest,
    initial_state: ConversationState,
):
    """
    Streams chatbot responses in real time.
    """
    buffer = io.StringIO()
    skip_first = True
    async with get_db_session_with_context() as session:
        try:
            async with conversation_checkpointer_context() as memory:
                conversation_workflow = get_conversation_workflow(
                    state=ConversationState,
                    checkpointer=memory,
                )
                async for event in conversation_workflow.astream(
                    initial_state,
                    {"configurable": {"thread_id": initial_state.conversation_id}},
                    stream_mode=["values", "custom"],
                ):
                    if skip_first:
                        skip_first = False
                        continue
                    _, event_content = event
                    messages = event_content.get("messages", [])
                    message_type = event_content.get("type")

                    if message_type == MessageTypes.AI:
                        buffer.write(f"{messages[-1]}")

                    data_response = {
                        "status": ResponseStatus.SUCCESS,
                        "data": {
                            "message": messages[-1],
                            "type": message_type,
                        },
                    }

                    yield f"data: {json.dumps(data_response)}\n\n"
                    await asyncio.sleep(0.01)

            await Message(
                conversation_id=UUID(request.conversation_id),
                message=buffer.getvalue(),
                type=MessageTypes.AI,
            ).create(session=session)
        except Exception as e:
            raise e
        finally:
            buffer.close()
