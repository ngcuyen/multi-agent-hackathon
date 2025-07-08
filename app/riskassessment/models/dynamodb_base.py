"""
Base model for DynamoDB documents.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, ClassVar
from uuid import UUID
from pydantic import BaseModel, Field
import boto3
from boto3.dynamodb.types import TypeSerializer, TypeDeserializer
from botocore.exceptions import ClientError

from app.riskassessment.config import (
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
)


class DynamoDBModel(BaseModel):
    """
    Base model for DynamoDB documents with common functionality.
    """
    
    # Table name should be defined in subclasses
    table_name: ClassVar[str] = ""
    
    # Common timestamp fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    
    # DynamoDB clients (class level)
    _client: ClassVar[Optional[Any]] = None
    _resource: ClassVar[Optional[Any]] = None
    _serializer: ClassVar[Optional[TypeSerializer]] = None
    _deserializer: ClassVar[Optional[TypeDeserializer]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            UUID: str
        }
    
    @classmethod
    def get_client(cls):
        """Get DynamoDB client singleton."""
        if cls._client is None:
            cls._client = boto3.client(
                "dynamodb",
                region_name=AWS_REGION,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            )
        return cls._client
    
    @classmethod
    def get_resource(cls):
        """Get DynamoDB resource singleton."""
        if cls._resource is None:
            cls._resource = boto3.resource(
                "dynamodb",
                region_name=AWS_REGION,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            )
        return cls._resource
    
    @classmethod
    def get_serializer(cls):
        """Get DynamoDB serializer."""
        if cls._serializer is None:
            cls._serializer = TypeSerializer()
        return cls._serializer
    
    @classmethod
    def get_deserializer(cls):
        """Get DynamoDB deserializer."""
        if cls._deserializer is None:
            cls._deserializer = TypeDeserializer()
        return cls._deserializer
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Convert model to DynamoDB item format."""
        data = self.dict()
        serializer = self.get_serializer()
        return {k: serializer.serialize(v) for k, v in data.items() if v is not None}
    
    @classmethod
    def from_dynamodb_item(cls, item: Dict[str, Any]):
        """Create model instance from DynamoDB item."""
        deserializer = cls.get_deserializer()
        data = {k: deserializer.deserialize(v) for k, v in item.items()}
        return cls(**data)
    
    async def save(self):
        """Save model to DynamoDB."""
        self.updated_at = datetime.now(timezone.utc)
        
        client = self.get_client()
        item = self.to_dynamodb_item()
        
        try:
            client.put_item(
                TableName=self.table_name,
                Item=item
            )
        except Exception as e:
            raise Exception(f"Failed to save {self.__class__.__name__}: {str(e)}")
    
    @classmethod
    async def find(cls, query_params: Dict[str, Any], **kwargs) -> List:
        """
        Find documents based on query parameters.
        This is a compatibility method to match MongoDB interface.
        """
        # This will be implemented in subclasses with specific query logic
        raise NotImplementedError("find() method must be implemented in subclasses")
    
    def sort(self, *args, **kwargs):
        """Compatibility method for MongoDB-style sorting."""
        # Return self to allow chaining, actual sorting handled in query
        return self
    
    def limit(self, count: int):
        """Compatibility method for MongoDB-style limiting."""
        # Return self to allow chaining, actual limiting handled in query
        return self
    
    async def to_list(self) -> List:
        """Compatibility method for MongoDB-style result conversion."""
        # This will be handled in the actual query methods
        return []


# For backward compatibility, alias to the original name
TimestampedModel = DynamoDBModel
