from enum import Enum
from typing import Any
from typing import Generic, TypeVar, Optional
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    status: str
    data: Optional[T]


class MessageType(str, Enum):
    HUMAN = "human"
    AI = "ai"
    SYSTEM = "system"
    HIDDEN = "hidden"


class ResponseStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    HIDDEN = "hidden"


class ConversationRequest(BaseModel):
    conversation_id: Optional[str] = None
    user_id: str
    message: Optional[str] = None
