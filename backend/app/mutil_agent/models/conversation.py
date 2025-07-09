from typing import Dict, Any
from uuid import UUID, uuid4

from pydantic import Field

from app.mutil_agent.config import CONVERSATION_COLLECTION
from app.mutil_agent.models.base import TimestampedModel


class Conversation(TimestampedModel):
    conversation_id: UUID = Field(default_factory=uuid4)
    conversation_name: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        json_schema_extra = {
            "example": {
                "conversation_id": "a7f12eca-7a9d-4ca6-9210-5e6e7d2a9e1a",
                "conversation_name": "Conversation 1",
                "metadata": {},
            }
        }

    class Settings:
        name = CONVERSATION_COLLECTION
        indexes = [
            [("conversation_id", 1)],
        ]
