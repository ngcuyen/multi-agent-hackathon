import asyncio
import logging
from collections.abc import Sequence
from contextlib import asynccontextmanager
from typing import Any, Tuple, AsyncGenerator, AsyncIterator, Optional, Dict

from boto3.dynamodb.types import TypeDeserializer, TypeSerializer
from botocore.exceptions import ClientError
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    WRITES_IDX_MAP,
    BaseCheckpointSaver,
)

from app.mutil_agent.config import DYNAMODB_CHECKPOINT_TABLE, DYNAMODB_WRITES_TABLE
from .dynamodb_utils import (
    get_dynamodb_client,
    get_dynamodb_resource,
    create_checkpoint_item,
    create_write_item,
    dumps_metadata,
)
from .dynamodb_operations import DynamoDBOperations
from .dynamodb_schema import create_table_if_not_exists

# Table names from config
CHECKPOINT_TABLE_NAME = DYNAMODB_CHECKPOINT_TABLE
WRITES_TABLE_NAME = DYNAMODB_WRITES_TABLE


async def initiate_dynamodb():
    """Initialize DynamoDB tables with retry mechanism."""
    max_retries = 5
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            await create_tables_if_not_exist()
            logging.info("[DynamoDB]: Database initiated successfully")
            return
        except Exception as e:
            logging.error(
                f"[DynamoDB]: Initiate database failed - Connection attempt {attempt + 1} failed: {str(e)}"
            )
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(retry_delay)



async def create_tables_if_not_exist():
    """Create DynamoDB tables if they don't exist."""
    dynamodb = get_dynamodb_resource()
    client = get_dynamodb_client()
    
    # Create both tables
    await create_table_if_not_exists(dynamodb, client, CHECKPOINT_TABLE_NAME, 'checkpoint')
    await create_table_if_not_exists(dynamodb, client, WRITES_TABLE_NAME, 'writes')



class AsyncDynamoDBSaverCustom(BaseCheckpointSaver):
    """
    Custom DynamoDB checkpoint saver for LangGraph.
    Equivalent to AsyncMongoDBSaverCustom but using DynamoDB as storage.
    Adds created_at field to take advantage of DynamoDB TTL.
    """

    def __init__(
        self,
        checkpoint_table_name: str = CHECKPOINT_TABLE_NAME,
        writes_table_name: str = WRITES_TABLE_NAME,
        checkpoint_table: str = None,  # Alias for compatibility
        checkpoint_writes_table: str = None,  # Alias for compatibility
    ):
        # Handle parameter aliases for backward compatibility
        if checkpoint_table is not None:
            checkpoint_table_name = checkpoint_table
        if checkpoint_writes_table is not None:
            writes_table_name = checkpoint_writes_table
            
        super().__init__()
        self.checkpoint_table_name = checkpoint_table_name
        self.writes_table_name = writes_table_name
        self.client = get_dynamodb_client()
        self.resource = get_dynamodb_resource()
        self.serializer = TypeSerializer()
        self.deserializer = TypeDeserializer()
        self.operations = DynamoDBOperations(self.client, self.deserializer, self.serde)

    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        # Cleanup if needed
        pass

    @classmethod
    @asynccontextmanager
    async def from_config(
        cls,
        checkpoint_table_name: str = CHECKPOINT_TABLE_NAME,
        writes_table_name: str = WRITES_TABLE_NAME,
        checkpoint_table: str = None,  # Alias for compatibility
        checkpoint_writes_table: str = None,  # Alias for compatibility
        **kwargs: Any,
    ) -> AsyncIterator["AsyncDynamoDBSaverCustom"]:
        """Create DynamoDB saver from configuration."""
        try:
            # Handle parameter aliases
            if checkpoint_table is not None:
                checkpoint_table_name = checkpoint_table
            if checkpoint_writes_table is not None:
                writes_table_name = checkpoint_writes_table
                
            saver = cls(checkpoint_table_name, writes_table_name)
            yield saver
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to create saver: {str(e)}")
            raise

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        """Save a checkpoint to DynamoDB asynchronously.

        This method saves a checkpoint to the DynamoDB database. The checkpoint is associated
        with the provided config and its parent config (if any).

        Args:
            config (RunnableConfig): The config to associate with the checkpoint.
            checkpoint (Checkpoint): The checkpoint to save.
            metadata (CheckpointMetadata): Additional metadata to save with the checkpoint.
            new_versions (ChannelVersions): New channel versions as of this write.

        Returns:
            RunnableConfig: Updated configuration after storing the checkpoint.
        """
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"]["checkpoint_ns"]
        checkpoint_id = checkpoint["id"]
        
        # Serialize checkpoint data exactly like MongoDB version
        type_, serialized_checkpoint = self.serde.dumps_typed(checkpoint)
        
        # Create item for DynamoDB using helper function
        item = create_checkpoint_item(config, checkpoint, metadata, type_, serialized_checkpoint)
        
        # Serialize item for DynamoDB
        dynamodb_item = {k: self.serializer.serialize(v) for k, v in item.items()}
        
        try:
            self.client.put_item(
                TableName=self.checkpoint_table_name,
                Item=dynamodb_item
            )
            
            return {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                }
            }
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to put checkpoint: {str(e)}")
            raise

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[Tuple[str, Any]],
        task_id: str,
    ) -> None:
        """Store intermediate writes linked to a checkpoint asynchronously.

        This method saves intermediate writes associated with a checkpoint to DynamoDB.

        Args:
            config (RunnableConfig): Configuration of the related checkpoint.
            writes (Sequence[Tuple[str, Any]]): List of writes to store, each as (channel, value) pair.
            task_id (str): Identifier for the task creating the writes.
        """
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"]["checkpoint_ns"] 
        checkpoint_id = config["configurable"]["checkpoint_id"]
        
        # Match MongoDB logic for set_method
        set_method_is_set = all(w[0] in WRITES_IDX_MAP for w in writes)
        
        # Prepare batch write requests
        with self.resource.Table(self.writes_table_name).batch_writer() as batch:
            for idx, (channel, value) in enumerate(writes):
                write_id = f"{checkpoint_id}#{task_id}#{WRITES_IDX_MAP.get(channel, idx)}"
                type_, serialized_value = self.serde.dumps_typed(value)
                
                # Create item using helper function
                item = create_write_item(
                    config, channel, value, task_id, 
                    WRITES_IDX_MAP.get(channel, idx), 
                    type_, serialized_value, write_id
                )
                batch.put_item(Item=item)

    async def aget(self, config: RunnableConfig) -> Optional[Checkpoint]:
        """Get a checkpoint from DynamoDB."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_id = config["configurable"].get("checkpoint_id")
        return await self.operations.get_checkpoint(self.checkpoint_table_name, thread_id, checkpoint_id)

    async def aget_tuple(self, config: RunnableConfig) -> Optional[Tuple[Checkpoint, CheckpointMetadata]]:
        """Get a checkpoint and metadata from DynamoDB."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_id = config["configurable"].get("checkpoint_id")
        return await self.operations.get_checkpoint_with_metadata(self.checkpoint_table_name, thread_id, checkpoint_id)

    async def alist(
        self,
        config: RunnableConfig,
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[RunnableConfig]:
        """List checkpoints from DynamoDB."""
        thread_id = config["configurable"]["thread_id"]
        async for config_item in self.operations.list_checkpoints(self.checkpoint_table_name, thread_id, limit):
            yield config_item

    async def alist_with_metadata(
        self,
        config: RunnableConfig,
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[Tuple[RunnableConfig, CheckpointMetadata]]:
        """List checkpoints with metadata from DynamoDB."""
        thread_id = config["configurable"]["thread_id"]
        async for config_item in self.operations.list_checkpoints_with_metadata(self.checkpoint_table_name, thread_id, limit):
            yield config_item

    async def adelete_checkpoint(self, config: RunnableConfig) -> None:
        """Delete a checkpoint from DynamoDB."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_id = config["configurable"].get("checkpoint_id")
        await self.operations.delete_checkpoint(self.checkpoint_table_name, thread_id, checkpoint_id)


@asynccontextmanager
async def get_db_session_with_context() -> AsyncGenerator[Any, None]:
    """Get DynamoDB session with context manager."""
    # DynamoDB is stateless, so we just yield the client
    client = get_dynamodb_client()
    try:
        yield client
    except Exception as e:
        logging.error(f"[DynamoDB]: Session error: {str(e)}")
        raise


async def get_db_session_dependency() -> AsyncGenerator[Any, None]:
    """Dependency injection for DynamoDB session."""
    client = get_dynamodb_client()
    try:
        yield client
    except Exception as e:
        logging.error(f"[DynamoDB]: Dependency session error: {str(e)}")
        raise


# Export the same interface as MongoDB for easy migration
from .dynamodb_message_ops import get_message_operations

# Create alias for backward compatibility
AsyncDynamoDBSaver = AsyncDynamoDBSaverCustom
