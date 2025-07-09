from enum import Enum
from uuid import UUID, uuid4
from typing import Any, Dict

from pydantic import Field
from app.mutil_agent.models.base import TimestampedModel
from app.mutil_agent.config import MESSAGE_COLLECTION


class MessageTypes(str, Enum):
    HUMAN = "human"
    AI = "ai"
    SYSTEM = "system"
    HIDDEN = "hidden"


class Message(TimestampedModel):
    conversation_id: UUID = Field(default_factory=uuid4)
    message_id: UUID = Field(default_factory=uuid4)
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    type: MessageTypes

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Hello, how are you?",
                "type": "human",
                "conversation_id": "a7f12eca-7a9d-4ca6-9210-5e6e7d2a9e1a",
                "message_id": "fc2cab14-ddac-4408-980c-0cb788a3a70c",
            }
        }

    class Settings:
        name = MESSAGE_COLLECTION
        indexes = [
            [("message_id", 1)],
            [("conversation_id", 1)],
        ]
