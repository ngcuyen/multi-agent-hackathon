import logging
import re
from uuid import UUID
from datetime import datetime
from typing import List

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
    CONVERSATION_CHAT_MODEL_NAME,
    CONVERSATION_CHAT_TOP_P,
    CONVERSATION_CHAT_TEMPERATURE,
    MESSAGES_LIMIT,
)
from app.mutil_agent.exceptions import StreamingException
from app.mutil_agent.factories.ai_model_factory import AIModelFactory
from app.mutil_agent.models.message_dynamodb import MessageDynamoDB as Message, MessageTypesDynamoDB as MessageTypes
from app.mutil_agent.utils.helpers import StreamWriter as ConversationStreamWriter


async def chat_node(
    state: ConversationState, config: RunnableConfig, writer: StreamWriter
) -> ConversationState:
    llm = AIModelFactory.create_model_service(
        model_name=CONVERSATION_CHAT_MODEL_NAME,
        temperature=CONVERSATION_CHAT_TEMPERATURE,
        top_p=CONVERSATION_CHAT_TOP_P,
    )
    try:
        user_prompt = state.messages[-1]
        system_prompt = system_prompt_chat_node()
        output = await llm.ai_ainvoke(
            [SystemMessage(content=(system_prompt))]
            + [HumanMessage(content=user_prompt)]
        )
        state.next_node = output.content
    except Exception as e:
        logging.error(
            f"[CONVERSATION_CHAT_NODE] - Error in chat_node: {str(e)}, conversation_id: {state.conversation_id}"
        )
        raise StreamingException(config["metadata"].get("langgraph_node"))

    return state