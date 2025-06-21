from typing import Any

from langgraph.constants import START, END

from app.themovie.agents.conversation_agent.nodes.chat_knowledgebase_node import (
    chat_knowledgebase_node,
)
from app.themovie.agents.conversation_agent.nodes.chat_node import chat_node
from app.themovie.agents.conversation_agent.nodes.chat_recommendation_node import (
    chat_recommendation_node,
)
from app.themovie.agents.conversation_agent.state import ConversationState
from app.themovie.agents.workflow import BaseWorkflow


def get_conversation_graph(state: ConversationState, checkpointer: Any):
    conversation_workflow = BaseWorkflow(state)
    conversation_workflow.add_node("chat_node", chat_node)
    conversation_workflow.add_node("chat_recommendation_node", chat_recommendation_node)
    conversation_workflow.add_node("chat_knowledgebase_node", chat_knowledgebase_node)

    conversation_workflow.add_edge(START, "chat_node")
    conversation_workflow.add_conditional_edges("chat_node", condition_chat_node)
    conversation_workflow.add_edge("chat_knowledgebase_node", END)
    conversation_workflow.add_edge("chat_recommendation_node", END)

    conversation_graph = conversation_workflow.get_graph()
    return conversation_graph.compile(checkpointer=checkpointer)


def condition_chat_node(state: ConversationState):
    if state.next_node in [
        "chat_recommendation_node",
        "chat_knowledgebase_node",
    ]:
        return state.next_node
    return "chat_knowledgebase_node"


def get_conversation_workflow(state, checkpointer):
    return get_conversation_graph(state=state, checkpointer=checkpointer)
