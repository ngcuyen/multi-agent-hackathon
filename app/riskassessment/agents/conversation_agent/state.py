from app.riskassessment.agents.state import BaseState


class ConversationState(BaseState):
    conversation_id: str
    user_id: str
    next_node: str
