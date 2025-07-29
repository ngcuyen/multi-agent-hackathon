from strands import Agent
from strands.models import BedrockModel
from botocore.config import Config as BotocoreConfig

# Create a boto client config with custom settings
boto_config = BotocoreConfig(
    retries={"max_attempts": 3, "mode": "standard"},
    connect_timeout=5,
    read_timeout=60
)

# Create a configured Bedrock model
bedrock_model = BedrockModel(
    model_id="anthropic.claude-sonnet-4-20250514-v1:0",
    region_name="us-east-1",  # Specify a different region than the default
    temperature=0.3,
    top_p=0.8,
    stop_sequences=["###", "END"],
    boto_client_config=boto_config,
)

# Create an agent with the configured model
agent = Agent(model=bedrock_model)

# Use the agent
response = agent("Write a short story about an AI assistant.")