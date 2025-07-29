import logging
from uuid import UUID

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.runnables.config import RunnableConfig
from langgraph.types import StreamWriter

from app.mutil_agent.agents.conversation_agent.prompts.system_prompts import (
    system_prompt_chat_node,
)
from app.mutil_agent.agents.conversation_agent.prompts.user_prompts import (
    user_prompt_chat_node,
)
from app.mutil_agent.agents.conversation_agent.state import ConversationState
from app.mutil_agent.config import (
    BEDROCK_KNOWLEDGEBASE,
    KNOWLEDGEBASE_ID,
    MESSAGES_LIMIT,
)
from app.mutil_agent.exceptions import StreamingException
from app.mutil_agent.factories.ai_model_factory import AIModelFactory
from app.mutil_agent.models.message_dynamodb import MessageDynamoDB as Message, MessageTypesDynamoDB as MessageTypes
from app.mutil_agent.utils.helpers import StreamWriter as ConversationStreamWriter
from app.mutil_agent.databases.dynamodb import get_db_session_with_context

async def chat_knowledgebase_node(
    state: ConversationState, config: RunnableConfig, writer: StreamWriter
) -> ConversationState:
    conversation_id = state.conversation_id
    node_name = config.get("metadata", {}).get("langgraph_node")
    try:
        async with get_db_session_with_context() as session:
            messages = (
                await Message.find(
                    {
                        "conversation_id": UUID(conversation_id),
                        "type": {
                            "$in": [
                                MessageTypes.HUMAN,
                                MessageTypes.AI,
                                MessageTypes.HIDDEN,
                            ]
                        },
                    },
                    session=session,
                )
                .sort([("created_at", 1)])
                .limit(MESSAGES_LIMIT)
                .to_list()
            )

        user_input = messages[-1].message if messages else ""
        system_prompt = system_prompt_chat_node()
        user_prompt = user_prompt_chat_node(user_input)

        context_messages = [
            (
                HumanMessage(content=msg.message)
                if msg.type == MessageTypes.HUMAN
                else AIMessage(content=msg.message)
            )
            for msg in messages[:-1]
        ]
        print(
            f"[CONVERSATION_CHAT_NODE] - LENGTH_OF_CONTEXT_MESSAGES: {len(context_messages)}, conversation_id: {conversation_id}"
        )

        response = BEDROCK_KNOWLEDGEBASE.retrieve_and_generate_stream(
            input={"text": state.messages[-1]},
            retrieveAndGenerateConfiguration={
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": "BXLELVJRVQ",
                    "modelArn": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
                },
                "type": "KNOWLEDGE_BASE",
            },
        )
        for event in response["stream"]:
            output = event.get("output")
            if output and "text" in output:
                writer(
                    ConversationStreamWriter(
                        messages=[output["text"]],
                        node_name=node_name,
                        type=MessageTypes.AI,
                    ).to_dict()
                )

        state.type = MessageTypes.HIDDEN
        state.messages = ["[END]"]
        state.node_name = node_name

    except Exception as e:
        logging.error(
            f"[CONVERSATION_CHAT_NODE] - Error in chat_node: {str(e)}, conversation_id: {conversation_id}"
        )
        raise StreamingException(config["metadata"].get("langgraph_node"))

    return state