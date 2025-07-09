from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone
from typing import Optional
from beanie import Document
from pydantic import Field
from fastapi_pagination import Page
from typing import TypeVar, Any, Dict
from app.mutil_agent.schemas.base import ResponseStatus

Base = declarative_base()

T = TypeVar("T")


class TimestampedModel(Document):
    """
    Base document model with timestamp fields and soft delete functionality
    """

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None

    class Config:
        json_encoders = {datetime: lambda dt: dt.isoformat()}

    class Settings:
        use_state_management = True

    async def on_save(self):
        """
        Event handler called before saving the document
        """
        self.updated_at = datetime.now(timezone.utc)

    async def on_create(self):
        """
        Event handler called before creating the document
        """
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at


def format_paginated_response(paginated_result: Page[T]) -> Dict[str, Any]:
    """
    Convert paginated results to a standard response format exclude id

    Args:
        paginated_result: Pagination result from fastapi_pagination

    Returns:
        Dict[str, Any]: Formatted response
    """
    items = []
    for item in paginated_result.items:
        if hasattr(item, "model_dump"):
            item_dict = item.model_dump(exclude={"id"})
        else:
            item_dict = item.dict(exclude={"id"})

        if "_id" in item_dict:
            del item_dict["_id"]

        items.append(item_dict)

    # Create response in required format
    return {
        "status": ResponseStatus.SUCCESS,
        "data": {
            "items": items,
            "total": paginated_result.total,
            "page": paginated_result.page,
            "size": paginated_result.size,
            "pages": paginated_result.pages,
        },
    }
