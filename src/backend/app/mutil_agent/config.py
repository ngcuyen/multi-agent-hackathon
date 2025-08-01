import os

import boto3
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

VERIFY_HTTPS = False if os.getenv("VERIFY_HTTPS", "False").lower() == "false" else True

DEFAULT_MODEL_NAME = os.getenv("DEFAULT_MODEL_NAME")

CONVERSATION_CHAT_MODEL_NAME = os.getenv("CONVERSATION_CHAT_MODEL_NAME")
CONVERSATION_CHAT_TOP_P = os.getenv("CONVERSATION_CHAT_TOP_P")
CONVERSATION_CHAT_TEMPERATURE = os.getenv("CONVERSATION_CHAT_TEMPERATURE")

# AWS Region Configuration
AWS_REGION = os.getenv("AWS_REGION")  # Default region for DynamoDB, S3, etc.
AWS_BEDROCK_REGION = os.getenv("AWS_BEDROCK_REGION", "us-east-1")  # Bedrock specific region

# AWS Credentials
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")  # For temporary credentials

# Knowledge Base Configuration
AWS_KNOWLEDGEBASE_REGION = os.getenv("AWS_KNOWLEDGEBASE_REGION")
AWS_KNOWLEDGEBASE_ACCESS_KEY_ID = os.getenv("AWS_KNOWLEDGEBASE_ACCESS_KEY_ID")
AWS_KNOWLEDGEBASE_SECRET_ACCESS_KEY = os.getenv("AWS_KNOWLEDGEBASE_SECRET_ACCESS_KEY")

MODEL_MAPPING = {
    # Claude models
    "claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
    "claude-37-sonnet": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",  # ACTIVE + ON_DEMAND
    "claude-instant-v1": "anthropic.claude-instant-v1",
    "claude-3-5-sonnet": "anthropic.claude-3-5-sonnet-20240620-v1:0",
    "anthropic.claude-3-5-sonnet-20241022-v2:0": "anthropic.claude-3-5-sonnet-20240620-v1:0",  # Fallback to ON_DEMAND model
    "claude-3-haiku": "anthropic.claude-3-haiku-20240307-v1:0",  # ACTIVE + ON_DEMAND
    "anthropic.claude-3-7-sonnet-20250219-v1:0": "anthropic.claude-3-5-sonnet-20240620-v1:0",  # Fallback to ON_DEMAND model
}

# Amazon Bedrock Configuration
bedrock_endpoint_url = os.getenv("BEDROCK_ENDPOINT_URL")
if bedrock_endpoint_url and bedrock_endpoint_url.strip():
    BEDROCK_RT = boto3.client(
        "bedrock-runtime",
        region_name=AWS_BEDROCK_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_session_token=AWS_SESSION_TOKEN,  # Add session token for temporary credentials
        endpoint_url=bedrock_endpoint_url,
        verify=VERIFY_HTTPS,  # Add SSL verification setting
    )
else:
    BEDROCK_RT = boto3.client(
        "bedrock-runtime",
        region_name=AWS_BEDROCK_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_session_token=AWS_SESSION_TOKEN,  # Add session token for temporary credentials
        verify=VERIFY_HTTPS,  # Add SSL verification setting
    )

# Only create BEDROCK_KNOWLEDGEBASE client if region is provided
if AWS_KNOWLEDGEBASE_REGION and AWS_KNOWLEDGEBASE_REGION.strip():
    BEDROCK_KNOWLEDGEBASE = boto3.client(
        "bedrock-agent-runtime",
        region_name=AWS_KNOWLEDGEBASE_REGION,
        aws_access_key_id=AWS_KNOWLEDGEBASE_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_KNOWLEDGEBASE_SECRET_ACCESS_KEY,
        verify=VERIFY_HTTPS,
    )
else:
    BEDROCK_KNOWLEDGEBASE = None
LLM_MAX_TOKENS = os.getenv("LLM_MAX_TOKENS")
LLM_TOP_P = os.getenv("LLM_TOP_P")
LLM_TEMPERATURE = os.getenv("LLM_TEMPERATURE")

MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
CONVERSATION_COLLECTION = os.getenv("CONVERSATION_COLLECTION")
MESSAGE_COLLECTION = os.getenv("MESSAGE_COLLECTION")
CONVERSATION_CHECKPOINT_COLLECTION = os.getenv("CONVERSATION_CHECKPOINT_COLLECTION")
CONVERSATION_CHECKPOINT_WRITE_COLLECTION = os.getenv(
    "CONVERSATION_CHECKPOINT_WRITE_COLLECTION"
)
MESSAGES_LIMIT = int(os.getenv("MESSAGES_LIMIT"))

MONGODB_URI = os.getenv("MONGODB_URI")
PG_DATABASE = os.getenv("PG_DATABASE")
PG_USER = os.getenv("PG_USER")
PG_HOST = os.getenv("PG_HOST")
PG_PASSWORD = os.getenv("PG_PASSWORD")
PG_PORT = os.getenv("PG_PORT")

KNOWLEDGEBASE_ID = os.getenv("KNOWLEDGEBASE_ID")
EXTRACTED_CONTENT_BUCKET = os.getenv("EXTRACTED_CONTENT_BUCKET")

# DynamoDB Configuration
DYNAMODB_CHECKPOINT_TABLE = os.getenv("DYNAMODB_CHECKPOINT_TABLE", "checkpoints")
DYNAMODB_WRITES_TABLE = os.getenv("DYNAMODB_WRITES_TABLE", "checkpoint_writes")
DYNAMODB_REGION = os.getenv("DYNAMODB_REGION", AWS_REGION)
DYNAMODB_CONVERSATION_TABLE = os.getenv("DYNAMODB_CONVERSATION_TABLE", "conversations")
DYNAMODB_MESSAGE_TABLE = os.getenv("DYNAMODB_MESSAGE_TABLE", "messages")
