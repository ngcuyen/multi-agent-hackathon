# import asyncio
# import logging
# from collections.abc import Sequence
# from contextlib import asynccontextmanager
# from datetime import datetime
# from typing import Any, Tuple, AsyncGenerator, AsyncIterator, Optional

# from beanie import init_beanie
# from langchain_core.runnables import RunnableConfig
# from langgraph.checkpoint.base import (
#     ChannelVersions,
#     Checkpoint,
#     CheckpointMetadata,
#     WRITES_IDX_MAP,
# )
# from langgraph.checkpoint.mongodb.aio import AsyncMongoDBSaver
# from langgraph.checkpoint.mongodb.utils import dumps_metadata
# from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorClientSession
# from pymongo import UpdateOne

# from app.mutil_agent import models
# from app.mutil_agent.config import (
#     MONGO_DB_NAME,
#     MONGODB_URI,
# )

# _mongo_client = None


# def get_mongo_client():
#     global _mongo_client
#     if _mongo_client is None:
#         _mongo_client = AsyncIOMotorClient(
#             MONGODB_URI,
#             serverSelectionTimeoutMS=5000,
#             connectTimeoutMS=5000,
#             socketTimeoutMS=5000,
#         )
#     return _mongo_client


# async def initiate_database():
#     max_retries = 5
#     retry_delay = 5

#     client = get_mongo_client()
#     for attempt in range(max_retries):
#         try:
#             await client.admin.command("ping")
#             await init_beanie(
#                 database=client[MONGO_DB_NAME], document_models=models.__all__
#             )
#             return
#         except Exception as e:
#             logging.error(
#                 f"[MongoDB]: Initiate database failed - Connection attempt {attempt + 1} failed: {str(e)}"
#             )
#             if attempt == max_retries - 1:
#                 raise
#             await asyncio.sleep(retry_delay)


# class AsyncMongoDBSaverCustom(AsyncMongoDBSaver):
#     """
#     Customize AsyncMongoDBSaver, we want to add a new created_at field to the checkpoint to take advantage of TTL of MongoDB.
#     This customisation be in version 0.1.0
#     """

#     def __init__(
#         self,
#         client: AsyncIOMotorClient,
#         db_name: str,
#         checkpoint_collection_name: str,
#         writes_collection_name: str,
#     ):

#         super(AsyncMongoDBSaverCustom, self).__init__(
#             client, db_name, checkpoint_collection_name, writes_collection_name
#         )

#     @classmethod
#     @asynccontextmanager
#     async def from_conn_string(
#         cls,
#         conn_string: str,
#         db_name: str = "checkpointing_db",
#         checkpoint_collection_name: str = "checkpoints_aio",
#         writes_collection_name: str = "checkpoint_writes_aio",
#         **kwargs: Any,
#     ) -> AsyncIterator["AsyncMongoDBSaver"]:
#         client: Optional[AsyncIOMotorClient] = None
#         try:
#             client = AsyncIOMotorClient(conn_string)
#             # replace AsyncMongoDBSaver by AsyncMongoDBSaverCustom
#             yield AsyncMongoDBSaverCustom(
#                 client,
#                 db_name,
#                 checkpoint_collection_name,
#                 writes_collection_name,
#                 **kwargs,
#             )
#         finally:
#             if client:
#                 client.close()

#     async def aput(
#         self,
#         config: RunnableConfig,
#         checkpoint: Checkpoint,
#         metadata: CheckpointMetadata,
#         new_versions: ChannelVersions,
#     ) -> RunnableConfig:
#         """Save a checkpoint to the database asynchronously.

#         This method saves a checkpoint to the MongoDB database. The checkpoint is associated
#         with the provided config and its parent config (if any).

#         Args:
#             config (RunnableConfig): The config to associate with the checkpoint.
#             checkpoint (Checkpoint): The checkpoint to save.
#             metadata (CheckpointMetadata): Additional metadata to save with the checkpoint.
#             new_versions (ChannelVersions): New channel versions as of this write.

#         Returns:
#             RunnableConfig: Updated configuration after storing the checkpoint.
#         """
#         thread_id = config["configurable"]["thread_id"]
#         checkpoint_ns = config["configurable"]["checkpoint_ns"]
#         checkpoint_id = checkpoint["id"]
#         type_, serialized_checkpoint = self.serde.dumps_typed(checkpoint)
#         doc = {
#             "parent_checkpoint_id": config["configurable"].get("checkpoint_id"),
#             "type": type_,
#             "checkpoint": serialized_checkpoint,
#             "metadata": dumps_metadata(metadata),
#         }
#         # Adding new created_at for customisation
#         doc["created_at"] = datetime.now()
#         upsert_query = {
#             "thread_id": thread_id,
#             "checkpoint_ns": checkpoint_ns,
#             "checkpoint_id": checkpoint_id,
#         }
#         # Perform your operations here
#         await self.checkpoint_collection.update_one(
#             upsert_query, {"$set": doc}, upsert=True
#         )
#         return {
#             "configurable": {
#                 "thread_id": thread_id,
#                 "checkpoint_ns": checkpoint_ns,
#                 "checkpoint_id": checkpoint_id,
#             }
#         }

#     async def aput_writes(
#         self,
#         config: RunnableConfig,
#         writes: Sequence[Tuple[str, Any]],
#         task_id: str,
#     ) -> None:
#         """Store intermediate writes linked to a checkpoint asynchronously.

#         This method saves intermediate writes associated with a checkpoint to the database.

#         Args:
#             config (RunnableConfig): Configuration of the related checkpoint.
#             writes (Sequence[Tuple[str, Any]]): List of writes to store, each as (channel, value) pair.
#             task_id (str): Identifier for the task creating the writes.
#         """
#         thread_id = config["configurable"]["thread_id"]
#         checkpoint_ns = config["configurable"]["checkpoint_ns"]
#         checkpoint_id = config["configurable"]["checkpoint_id"]
#         set_method = (  # Allow replacement on existing writes only if there were errors.
#             "$set" if all(w[0] in WRITES_IDX_MAP for w in writes) else "$setOnInsert"
#         )
#         operations = []
#         for idx, (channel, value) in enumerate(writes):
#             upsert_query = {
#                 "thread_id": thread_id,
#                 "checkpoint_ns": checkpoint_ns,
#                 "checkpoint_id": checkpoint_id,
#                 "task_id": task_id,
#                 "idx": WRITES_IDX_MAP.get(channel, idx),
#             }
#             # Adding new created_at for customisation should be in the document, not query
#             type_, serialized_value = self.serde.dumps_typed(value)
#             doc_data = {
#                 "channel": channel,
#                 "type": type_,
#                 "value": serialized_value,
#                 "created_at": datetime.now(),  # Add created_at to document data
#             }
#             operations.append(
#                 UpdateOne(
#                     upsert_query,
#                     {
#                         set_method: doc_data
#                     },
#                     upsert=True,
#                 )
#             )
#         await self.writes_collection.bulk_write(operations)


# @asynccontextmanager
# async def get_db_session_with_context() -> (
#     AsyncGenerator[AsyncIOMotorClientSession, None]
# ):
#     client = get_mongo_client()
#     async with await client.start_session() as session:
#         yield session


# async def get_db_session_dependency() -> (
#     AsyncGenerator[AsyncIOMotorClientSession, None]
# ):
#     client = get_mongo_client()
#     async with await client.start_session() as session:
#         yield session
