import io
import json
import asyncio
from contextlib import asynccontextmanager
from uuid import UUID

from app.mutil_agent.agents.conversation_agent.state import ConversationState
from app.mutil_agent.agents.conversation_agent.workflow import get_conversation_workflow
from app.mutil_agent.config import (
    DYNAMODB_CHECKPOINT_TABLE,
    DYNAMODB_WRITES_TABLE,
)
from app.mutil_agent.databases.dynamodb import (
    AsyncDynamoDBSaver
)
from app.mutil_agent.models.message_dynamodb import MessageDynamoDB as Message, MessageTypesDynamoDB as MessageTypes
from app.mutil_agent.schemas.base import (
    ConversationRequest,
    ResponseStatus,
)


@asynccontextmanager
async def conversation_checkpointer_context():
    async with AsyncDynamoDBSaver(
        checkpoint_table=DYNAMODB_CHECKPOINT_TABLE,
        checkpoint_writes_table=DYNAMODB_WRITES_TABLE,
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

                yield f"data: {json.dumps(data_response, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.01)

        # Save message to DynamoDB (no session needed)
        message = Message(
            conversation_id=UUID(request.conversation_id),
            message=buffer.getvalue(),
            type=MessageTypes.AI,
        )
        await message.save()
    except Exception as e:
        raise e
    finally:
        buffer.close()
