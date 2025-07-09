"""
DynamoDB Message model - separate from MongoDB Message model.
"""
from enum import Enum
from uuid import UUID, uuid4
from typing import Any, Dict, List, Optional, ClassVar
from datetime import datetime

from pydantic import Field
from app.mutil_agent.models.dynamodb_base import DynamoDBModel
from app.mutil_agent.config import DYNAMODB_MESSAGE_TABLE


class MessageTypesDynamoDB(str, Enum):
    """Message types for DynamoDB - same as MongoDB version."""
    HUMAN = "human"
    AI = "ai"
    SYSTEM = "system"
    HIDDEN = "hidden"


class MessageQueryBuilder:
    """
    MongoDB-compatible query builder for DynamoDB Message operations.
    Supports chaining methods like sort() and limit().
    """
    
    def __init__(self, model_class, query: dict):
        self.model_class = model_class
        self.query = query
        self._sort_params = None
        self._limit_count = None
    
    def sort(self, sort_params: List[tuple]):
        """Set sort parameters (MongoDB-compatible)."""
        self._sort_params = sort_params
        return self
    
    def limit(self, count: int):
        """Set limit for results."""
        self._limit_count = count
        return self
    
    async def to_list(self) -> List["MessageDynamoDB"]:
        """Execute the query and return results as a list."""
        from app.mutil_agent.databases.dynamodb_message_ops import DynamoDBMessageOperations
        
        ops = DynamoDBMessageOperations()
        
        # Extract query parameters
        conversation_id = self.query.get("conversation_id")
        type_filter = self.query.get("type", {})
        
        if conversation_id and isinstance(type_filter, dict) and "$in" in type_filter:
            # Handle conversation + type filter query
            conversation_id_str = str(conversation_id)
            type_values = type_filter["$in"]
            limit = self._limit_count or 20
            
            messages_data = await ops.find_by_conversation_and_types(
                conversation_id_str, type_values, limit
            )
        else:
            # Handle other query types
            messages_data = await ops.scan_messages(
                filters=self.query,
                limit=self._limit_count
            )
        
        # Convert to MessageDynamoDB objects
        messages = [self.model_class.from_dynamodb_item(item) for item in messages_data]
        
        # Apply sorting if specified
        if self._sort_params:
            for field, direction in reversed(self._sort_params):
                reverse = direction == -1
                if field == "created_at":
                    messages.sort(key=lambda x: x.created_at, reverse=reverse)
        
        return messages


class MessageDynamoDB(DynamoDBModel):
    """
    DynamoDB Message model with MongoDB-compatible interface.
    Can be used as drop-in replacement for MongoDB Message.
    """
    
    # DynamoDB table name
    table_name: ClassVar[str] = DYNAMODB_MESSAGE_TABLE
    
    # Primary key for DynamoDB
    id: str = Field(default_factory=lambda: str(uuid4()))
    
    # Message fields
    conversation_id: UUID = Field(default_factory=uuid4)
    message_id: UUID = Field(default_factory=uuid4)
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    type: MessageTypesDynamoDB
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Hello, how are you?",
                "type": "human",
                "conversation_id": "a7f12eca-7a9d-4ca6-9210-5e6e7d2a9e1a",
                "message_id": "fc2cab14-ddac-4408-980c-0cb788a3a70c",
            }
        }
    
    @classmethod
    async def find_by_conversation(
        cls,
        conversation_id: UUID,
        message_types: List[MessageTypesDynamoDB],
        limit: int = 20
    ) -> List["MessageDynamoDB"]:
        """
        Find messages by conversation - optimized method.
        Alternative to using find() with complex queries.
        """
        from app.mutil_agent.databases.dynamodb_message_ops import DynamoDBMessageOperations
        
        # Convert UUIDs to strings for DynamoDB
        conversation_id_str = str(conversation_id)
        type_values = [t.value for t in message_types]
        
        # Use DynamoDB operations to query messages
        ops = DynamoDBMessageOperations()
        messages_data = await ops.find_by_conversation_and_types(
            conversation_id_str, type_values, limit
        )
        
        # Convert to MessageDynamoDB objects
        messages = [cls.from_dynamodb_item(item) for item in messages_data]
        return messages
    
    @classmethod
    def find(cls, query: dict):
        """
        MongoDB-compatible find method that returns a QueryBuilder for chaining.
        """
        return MessageQueryBuilder(cls, query)
    
    @classmethod
    def from_dynamodb_item(cls, item: Dict[str, Any]):
        """Create MessageDynamoDB instance from DynamoDB item."""
        # Handle UUID fields
        conversation_id = UUID(item["conversation_id"]) if isinstance(item["conversation_id"], str) else item["conversation_id"]
        message_id = UUID(item["message_id"]) if isinstance(item.get("message_id"), str) else item.get("message_id", uuid4())
        
        # Handle datetime fields
        created_at = datetime.fromisoformat(item["created_at"]) if isinstance(item["created_at"], str) else item["created_at"]
        updated_at = datetime.fromisoformat(item.get("updated_at", item["created_at"])) if isinstance(item.get("updated_at"), str) else item.get("updated_at", created_at)
        
        return cls(
            id=item.get("id"),
            conversation_id=conversation_id,
            message_id=message_id,
            message=item["message"],
            type=MessageTypesDynamoDB(item["type"]),
            metadata=item.get("metadata", {}),
            created_at=created_at,
            updated_at=updated_at,
            deleted_at=datetime.fromisoformat(item["deleted_at"]) if item.get("deleted_at") else None
        )
    
    @classmethod
    async def create_table_if_not_exists(cls):
        """Create DynamoDB table if it doesn't exist."""
        import boto3
        from botocore.exceptions import ClientError
        from app.mutil_agent.config import AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
        
        client_kwargs = {
            "region_name": AWS_REGION,
        }
        
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            client_kwargs.update({
                "aws_access_key_id": AWS_ACCESS_KEY_ID,
                "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
            })
            
            # Add session token if available (for temporary credentials)
            if AWS_SESSION_TOKEN:
                client_kwargs["aws_session_token"] = AWS_SESSION_TOKEN
        
        client = boto3.client("dynamodb", **client_kwargs)
        
        try:
            # Check if table exists
            client.describe_table(TableName=cls.table_name)
            print(f"[DynamoDB]: Table {cls.table_name} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"[DynamoDB]: Creating table {cls.table_name}")
                
                # Create table
                client.create_table(
                    TableName=cls.table_name,
                    KeySchema=[
                        {'AttributeName': 'id', 'KeyType': 'HASH'},  # Primary key
                    ],
                    AttributeDefinitions=[
                        {'AttributeName': 'id', 'AttributeType': 'S'},
                        {'AttributeName': 'conversation_id', 'AttributeType': 'S'},
                        {'AttributeName': 'created_at', 'AttributeType': 'S'},
                    ],
                    BillingMode='PAY_PER_REQUEST',
                    GlobalSecondaryIndexes=[
                        {
                            'IndexName': 'conversation_id-created_at-index',
                            'KeySchema': [
                                {'AttributeName': 'conversation_id', 'KeyType': 'HASH'},
                                {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
                            ],
                            'Projection': {'ProjectionType': 'ALL'}
                        }
                    ]
                )
                
                # Wait for table to be created
                waiter = client.get_waiter('table_exists')
                waiter.wait(TableName=cls.table_name)
                print(f"[DynamoDB]: Table {cls.table_name} created successfully")
            else:
                raise


# Compatibility aliases for easy migration
MessageTypes = MessageTypesDynamoDB  # For backward compatibility
Message = MessageDynamoDB  # Can be used as drop-in replacement
