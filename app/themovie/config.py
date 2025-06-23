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

AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_KNOWLEDGEBASE_REGION = os.getenv("AWS_KNOWLEDGEBASE_REGION")
AWS_KNOWLEDGEBASE_ACCESS_KEY_ID = os.getenv("AWS_KNOWLEDGEBASE_ACCESS_KEY_ID")
AWS_KNOWLEDGEBASE_SECRET_ACCESS_KEY = os.getenv("AWS_KNOWLEDGEBASE_SECRET_ACCESS_KEY")

MODEL_MAPPING = {
    # OpenAI models
    "gpt-4o": "gpt-4o",
    # Claude models
    "claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
    "claude-37-sonnet": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    "claude-instant-v1": "anthropic.claude-instant-v1",
    "claude-3-5-sonnet": "anthropic.claude-3-5-sonnet-20240620-v1:0",
}

# Amazon Bedrock Configuration
BEDROCK_RT = boto3.client(
    "bedrock-runtime",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    endpoint_url=os.getenv("BEDROCK_ENDPOINT_URL", None),
)

BEDROCK_KNOWLEDGEBASE = boto3.client(
    "bedrock-agent-runtime",
    region_name=AWS_KNOWLEDGEBASE_REGION,
    aws_access_key_id=AWS_KNOWLEDGEBASE_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_KNOWLEDGEBASE_SECRET_ACCESS_KEY,
)
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
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
