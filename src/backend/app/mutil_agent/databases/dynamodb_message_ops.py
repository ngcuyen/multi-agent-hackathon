"""
DynamoDB Message operations to replace MongoDB operations.
"""
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

import boto3
from boto3.dynamodb.types import TypeDeserializer
from botocore.exceptions import ClientError

from app.mutil_agent.config import (
    AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    DYNAMODB_MESSAGE_TABLE,
)


class DynamoDBMessageOperations:
    """Handle DynamoDB operations for Message model."""
    
    def __init__(self, table_name: str = DYNAMODB_MESSAGE_TABLE):
        self.table_name = table_name
        self.client = boto3.client(
            "dynamodb",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        self.resource = boto3.resource(
            "dynamodb",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        self.deserializer = TypeDeserializer()
    
    async def find_by_conversation_and_types(
        self,
        conversation_id: str,
        message_types: List[str],
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Find messages by conversation ID and types.
        Returns raw DynamoDB items.
        """
        try:
            # Build filter expression for message types
            type_conditions = []
            expression_values = {":conv_id": {"S": conversation_id}}
            
            for i, msg_type in enumerate(message_types):
                type_key = f":type{i}"
                type_conditions.append(f"#type = {type_key}")
                expression_values[type_key] = {"S": msg_type}
            
            filter_expression = f"({' OR '.join(type_conditions)})"
            
            # Query DynamoDB - using GSI on conversation_id
            response = self.client.query(
                TableName=self.table_name,
                IndexName="conversation_id-created_at-index",  # GSI for conversation queries
                KeyConditionExpression="conversation_id = :conv_id",
                FilterExpression=filter_expression,
                ExpressionAttributeNames={
                    "#type": "type"
                },
                ExpressionAttributeValues=expression_values,
                ScanIndexForward=True,  # Sort by created_at ascending
                Limit=limit
            )
            
            items = []
            for item_data in response.get("Items", []):
                item = {k: self.deserializer.deserialize(v) for k, v in item_data.items()}
                items.append(item)
            
            return items
            
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to find messages: {str(e)}")
            return []
    
    async def scan_messages(
        self,
        filters: Dict[str, Any] = None,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """
        Scan messages table with optional filters.
        Returns raw DynamoDB items.
        """
        try:
            scan_params = {
                "TableName": self.table_name
            }
            
            if limit:
                scan_params["Limit"] = limit
            
            # Add filters if provided
            if filters:
                # This is a simplified filter implementation
                # You can extend this based on your needs
                pass
            
            response = self.client.scan(**scan_params)
            
            items = []
            for item_data in response.get("Items", []):
                item = {k: self.deserializer.deserialize(v) for k, v in item_data.items()}
                items.append(item)
            
            return items
            
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to scan messages: {str(e)}")
            return []
    
    async def create_table_if_not_exists(self):
        """Create messages table if it doesn't exist."""
        try:
            table = self.resource.Table(self.table_name)
            table.load()
            logging.info(f"[DynamoDB]: Table {self.table_name} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                logging.info(f"[DynamoDB]: Creating table {self.table_name}")
                await self._create_messages_table()
            else:
                raise
    
    async def _create_messages_table(self):
        """Create messages table with proper schema."""
        try:
            self.client.create_table(
                TableName=self.table_name,
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
            waiter = self.client.get_waiter('table_exists')
            waiter.wait(TableName=self.table_name)
            logging.info(f"[DynamoDB]: Table {self.table_name} created successfully")
            
        except Exception as e:
            logging.error(f"[DynamoDB]: Failed to create table {self.table_name}: {str(e)}")
            raise


# Singleton instance
_message_operations = None

def get_message_operations() -> DynamoDBMessageOperations:
    """Get singleton instance of DynamoDB message operations."""
    global _message_operations
    if _message_operations is None:
        _message_operations = DynamoDBMessageOperations()
    return _message_operations
