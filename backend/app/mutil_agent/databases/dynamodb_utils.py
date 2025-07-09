"""
DynamoDB utilities and helper functions.
"""
import boto3
import os
from datetime import datetime
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import CheckpointMetadata
from app.mutil_agent.config import AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN, VERIFY_HTTPS

_dynamodb_client = None
_dynamodb_resource = None


def get_dynamodb_client():
    """Get DynamoDB client singleton."""
    global _dynamodb_client
    if _dynamodb_client is None:
        # Suppress SSL warnings
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Simple configuration with SSL verification disabled
        client_kwargs = {
            "region_name": AWS_REGION,
            "verify": False  # Disable SSL verification completely
        }
        
        # Add credentials if available
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            client_kwargs.update({
                "aws_access_key_id": AWS_ACCESS_KEY_ID,
                "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
            })
            
            # Add session token if available (for temporary credentials)
            if AWS_SESSION_TOKEN:
                client_kwargs["aws_session_token"] = AWS_SESSION_TOKEN
        
        _dynamodb_client = boto3.client("dynamodb", **client_kwargs)
    return _dynamodb_client


def get_dynamodb_resource():
    """Get DynamoDB resource singleton."""
    global _dynamodb_resource
    if _dynamodb_resource is None:
        # Suppress SSL warnings
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Simple configuration with SSL verification disabled
        resource_kwargs = {
            "region_name": AWS_REGION,
            "verify": False  # Disable SSL verification completely
        }
        
        # Add credentials if available
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            resource_kwargs.update({
                "aws_access_key_id": AWS_ACCESS_KEY_ID,
                "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
            })
            
            # Add session token if available (for temporary credentials)
            if AWS_SESSION_TOKEN:
                resource_kwargs["aws_session_token"] = AWS_SESSION_TOKEN
        
        _dynamodb_resource = boto3.resource("dynamodb", **resource_kwargs)
    return _dynamodb_resource


def dumps_metadata(metadata: CheckpointMetadata) -> dict:
    """Serialize metadata to a dictionary format suitable for storage."""
    if isinstance(metadata, dict):
        return metadata
    return dict(metadata) if metadata else {}


def create_checkpoint_item(config: RunnableConfig, checkpoint, metadata, type_, serialized_checkpoint):
    """Create checkpoint item for DynamoDB."""
    thread_id = config["configurable"]["thread_id"]
    checkpoint_ns = config["configurable"]["checkpoint_ns"]
    checkpoint_id = checkpoint["id"]
    
    item = {
        "thread_id": thread_id,
        "checkpoint_id": checkpoint_id,
        "checkpoint_ns": checkpoint_ns,
        "parent_checkpoint_id": config["configurable"].get("checkpoint_id"),
        "type": type_,
        "checkpoint": serialized_checkpoint,
        "metadata": dumps_metadata(metadata),
        "created_at": int(datetime.now().timestamp()),
        "created_at_iso": datetime.now().isoformat(),
    }
    return {k: v for k, v in item.items() if v is not None}


def create_write_item(config: RunnableConfig, channel, value, task_id, idx, type_, serialized_value, write_id):
    """Create write item for DynamoDB."""
    thread_id = config["configurable"]["thread_id"]
    checkpoint_ns = config["configurable"]["checkpoint_ns"]
    checkpoint_id = config["configurable"]["checkpoint_id"]
    
    return {
        "thread_id": thread_id,
        "write_id": write_id,
        "checkpoint_ns": checkpoint_ns,
        "checkpoint_id": checkpoint_id,
        "task_id": task_id,
        "idx": idx,
        "channel": channel,
        "type": type_,
        "value": serialized_value,
        "created_at": int(datetime.now().timestamp()),
        "created_at_iso": datetime.now().isoformat(),
    }
