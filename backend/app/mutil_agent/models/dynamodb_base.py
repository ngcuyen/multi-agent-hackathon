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

from app.mutil_agent.config import (
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
            # Import VERIFY_HTTPS from config
            from app.mutil_agent.config import VERIFY_HTTPS, AWS_SESSION_TOKEN
            
            client_kwargs = {
                "region_name": AWS_REGION,
                "aws_access_key_id": AWS_ACCESS_KEY_ID,
                "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
                "verify": VERIFY_HTTPS,  # Use SSL verification setting from config
            }
            
            # Add session token if available
            if AWS_SESSION_TOKEN:
                client_kwargs["aws_session_token"] = AWS_SESSION_TOKEN
            
            cls._client = boto3.client("dynamodb", **client_kwargs)
        return cls._client
    
    @classmethod
    def get_resource(cls):
        """Get DynamoDB resource singleton."""
        if cls._resource is None:
            # Import VERIFY_HTTPS from config
            from app.mutil_agent.config import VERIFY_HTTPS, AWS_SESSION_TOKEN
            
            resource_kwargs = {
                "region_name": AWS_REGION,
                "aws_access_key_id": AWS_ACCESS_KEY_ID,
                "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
                "verify": VERIFY_HTTPS,  # Use SSL verification setting from config
            }
            
            # Add session token if available
            if AWS_SESSION_TOKEN:
                resource_kwargs["aws_session_token"] = AWS_SESSION_TOKEN
            
            cls._resource = boto3.resource("dynamodb", **resource_kwargs)
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
        
        # Convert datetime objects to ISO strings for DynamoDB compatibility
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, UUID):
                data[key] = str(value)
        
        serializer = self.get_serializer()
        return {k: serializer.serialize(v) for k, v in data.items() if v is not None}
    
    @classmethod
    def from_dynamodb_item(cls, item: Dict[str, Any]):
        """Create model instance from DynamoDB item."""
        deserializer = cls.get_deserializer()
        data = {k: deserializer.deserialize(v) for k, v in item.items()}
        
        # Convert ISO strings back to datetime objects
        datetime_fields = ['created_at', 'updated_at', 'deleted_at']
        for field in datetime_fields:
            if field in data and isinstance(data[field], str):
                try:
                    # Handle both ISO format with and without timezone
                    if data[field].endswith('Z'):
                        data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                    else:
                        data[field] = datetime.fromisoformat(data[field])
                except (ValueError, AttributeError):
                    # If parsing fails, keep as string or set to None
                    pass
        
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
