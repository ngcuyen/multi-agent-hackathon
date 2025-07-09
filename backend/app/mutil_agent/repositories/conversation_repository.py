from motor.motor_asyncio import AsyncIOMotorClientSession
from app.mutil_agent.models.conversation import Conversation


class ConversationRepository:
    @staticmethod
    async def create_new_conversation(
        request,
        session: AsyncIOMotorClientSession,
    ) -> dict:
        """
        Creates a new conversation and stores the first message.
        """
        conversation = await Conversation(
            conversation_name="conversation_name",
        ).create(session=session)

        return {
            "conversation_id": str(conversation.conversation_id),
        }
