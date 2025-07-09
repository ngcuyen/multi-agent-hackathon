"""
DynamoDB CRUD operations for checkpoints and writes.
"""
import logging
from typing import Optional, Tuple, Dict, Any, AsyncIterator
from boto3.dynamodb.types import TypeDeserializer
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import Checkpoint, CheckpointMetadata


class DynamoDBOperations:
    """Handle DynamoDB CRUD operations."""
    
    def __init__(self, client, deserializer: TypeDeserializer, serde):
        self.client = client
        self.deserializer = deserializer
        self.serde = serde
    
    async def get_checkpoint(self, table_name: str, thread_id: str, checkpoint_id: str) -> Optional[Checkpoint]:
        """Get a checkpoint from DynamoDB."""
        if not checkpoint_id:
            return None
            
        try:
            response = self.client.get_item(
                TableName=table_name,
                Key={
                    "thread_id": {"S": thread_id},
                    "checkpoint_id": {"S": checkpoint_id}
                }
            )
            
            if "Item" not in response:
                return None
                
            item = {k: self.deserializer.deserialize(v) for k, v in response["Item"].items()}
            return self.serde.loads_typed((item["type"], item["checkpoint"]))
            
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to get checkpoint: {str(e)}")
            return None

    async def get_checkpoint_with_metadata(
        self, table_name: str, thread_id: str, checkpoint_id: str
    ) -> Optional[Tuple[Checkpoint, CheckpointMetadata]]:
        """Get a checkpoint and metadata from DynamoDB."""
        if not checkpoint_id:
            return None
            
        try:
            response = self.client.get_item(
                TableName=table_name,
                Key={
                    "thread_id": {"S": thread_id},
                    "checkpoint_id": {"S": checkpoint_id}
                }
            )
            
            if "Item" not in response:
                return None
                
            item = {k: self.deserializer.deserialize(v) for k, v in response["Item"].items()}
            checkpoint = self.serde.loads_typed((item["type"], item["checkpoint"]))
            metadata = item.get("metadata", {})
            
            return (checkpoint, metadata)
            
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to get checkpoint tuple: {str(e)}")
            return None

    async def list_checkpoints(
        self, table_name: str, thread_id: str, limit: Optional[int] = None
    ) -> AsyncIterator[RunnableConfig]:
        """List checkpoints from DynamoDB."""
        try:
            query_params = {
                "TableName": table_name,
                "KeyConditionExpression": "thread_id = :thread_id",
                "ExpressionAttributeValues": {
                    ":thread_id": {"S": thread_id}
                },
                "ScanIndexForward": False  # Latest first
            }
            
            if limit:
                query_params["Limit"] = limit
                
            response = self.client.query(**query_params)
            
            for item_data in response.get("Items", []):
                item = {k: self.deserializer.deserialize(v) for k, v in item_data.items()}
                yield {
                    "configurable": {
                        "thread_id": item["thread_id"],
                        "checkpoint_ns": item.get("checkpoint_ns", ""),
                        "checkpoint_id": item["checkpoint_id"],
                    }
                }
                
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to list checkpoints: {str(e)}")

    async def list_checkpoints_with_metadata(
        self, table_name: str, thread_id: str, limit: Optional[int] = None
    ) -> AsyncIterator[Tuple[RunnableConfig, CheckpointMetadata]]:
        """List checkpoints with metadata from DynamoDB."""
        try:
            query_params = {
                "TableName": table_name,
                "KeyConditionExpression": "thread_id = :thread_id",
                "ExpressionAttributeValues": {
                    ":thread_id": {"S": thread_id}
                },
                "ScanIndexForward": False
            }
            
            if limit:
                query_params["Limit"] = limit
                
            response = self.client.query(**query_params)
            
            for item_data in response.get("Items", []):
                item = {k: self.deserializer.deserialize(v) for k, v in item_data.items()}
                config_result = {
                    "configurable": {
                        "thread_id": item["thread_id"],
                        "checkpoint_ns": item.get("checkpoint_ns", ""),
                        "checkpoint_id": item["checkpoint_id"],
                    }
                }
                metadata = item.get("metadata", {})
                yield (config_result, metadata)
                
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to list checkpoints with metadata: {str(e)}")

    async def delete_checkpoint(self, table_name: str, thread_id: str, checkpoint_id: str):
        """Delete a checkpoint from DynamoDB."""
        if not checkpoint_id:
            return
            
        try:
            self.client.delete_item(
                TableName=table_name,
                Key={
                    "thread_id": {"S": thread_id},
                    "checkpoint_id": {"S": checkpoint_id}
                }
            )
            logging.info(f"[DynamoDB]: Deleted checkpoint {checkpoint_id} for thread {thread_id}")
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to delete checkpoint: {str(e)}")
            raise
