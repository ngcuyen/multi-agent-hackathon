"""
DynamoDB table schema definitions and creation utilities.
"""
import logging
from botocore.exceptions import ClientError


async def _create_checkpoint_table(client, table_name: str):
    """Create checkpoints table with proper schema."""
    try:
        client.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'thread_id', 'KeyType': 'HASH'},
                {'AttributeName': 'checkpoint_id', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'thread_id', 'AttributeType': 'S'},
                {'AttributeName': 'checkpoint_id', 'AttributeType': 'S'},
                {'AttributeName': 'created_at', 'AttributeType': 'N'}
            ],
            BillingMode='PAY_PER_REQUEST',
            GlobalSecondaryIndexes=[{
                'IndexName': 'created_at-index',
                'KeySchema': [
                    {'AttributeName': 'thread_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }]
        )
        
        waiter = client.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        logging.info(f"[DynamoDB]: Table {table_name} created successfully")
        
    except Exception as e:
        logging.error(f"[DynamoDB]: Failed to create table {table_name}: {str(e)}")
        raise


async def _create_writes_table(client, table_name: str):
    """Create writes table with proper schema."""
    try:
        client.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'thread_id', 'KeyType': 'HASH'},
                {'AttributeName': 'write_id', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'thread_id', 'AttributeType': 'S'},
                {'AttributeName': 'write_id', 'AttributeType': 'S'},
                {'AttributeName': 'created_at', 'AttributeType': 'N'}
            ],
            BillingMode='PAY_PER_REQUEST',
            GlobalSecondaryIndexes=[{
                'IndexName': 'created_at-index',
                'KeySchema': [
                    {'AttributeName': 'thread_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }]
        )
        
        waiter = client.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        logging.info(f"[DynamoDB]: Table {table_name} created successfully")
        
    except Exception as e:
        logging.error(f"[DynamoDB]: Failed to create table {table_name}: {str(e)}")
        raise


async def create_table_if_not_exists(dynamodb_resource, client, table_name: str, table_type: str):
    """Create a table if it doesn't exist."""
    try:
        table = dynamodb_resource.Table(table_name)
        table.load()
        logging.info(f"[DynamoDB]: Table {table_name} already exists")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            logging.info(f"[DynamoDB]: Creating table {table_name}")
            if table_type == 'checkpoint':
                await _create_checkpoint_table(client, table_name)
            elif table_type == 'writes':
                await _create_writes_table(client, table_name)
        else:
            raise
