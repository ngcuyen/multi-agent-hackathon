from app.mutil_agent.config import DEFAULT_MODEL_NAME
from app.mutil_agent.config import (
    MODEL_MAPPING,
    LLM_TEMPERATURE,
    LLM_TOP_P,
    LLM_MAX_TOKENS,
)
from app.mutil_agent.services.bedrock_service import BedrockService


class AIModelFactory:
    @staticmethod
    def create_model_service(
        model_name: str = DEFAULT_MODEL_NAME,
        temperature: float = LLM_TEMPERATURE,
        top_p: float = LLM_TOP_P,
        max_tokens: int = LLM_MAX_TOKENS,
    ):
        model_id = MODEL_MAPPING.get(model_name, DEFAULT_MODEL_NAME)

        # Only support Bedrock models now
        return BedrockService(
            model_id=model_id,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
        )
