from langchain_aws import ChatBedrockConverse

from app.mutil_agent.config import BEDROCK_RT
from app.mutil_agent.interfaces.ai_model_interface import AIModelInterface


class BedrockService(AIModelInterface):
    def __init__(
        self, model_id: str, temperature: float, top_p: float, max_tokens: int
    ):
        self.model_id = model_id
        self.temperature = temperature
        self.top_p = top_p
        self.max_tokens = max_tokens
        self.client = ChatBedrockConverse(
            client=BEDROCK_RT,
            model=self.model_id,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
        )

    def user_prompt_with_image(self, prompt_text: str, image_base64: str) -> dict:
        user_prompt = {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": prompt_text,
                },
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": image_base64,
                    },
                },
            ],
        }
        return user_prompt

    def ai_astream(self, prompt):
        return self.client.astream(prompt)

    def ai_chunk_stream(self, chunk):
        if chunk.content and len(chunk.content) > 0:
            return chunk.content[-1].get("text", "") or ""
        return ""

    async def ai_ainvoke(self, prompt: str):
        return await self.client.ainvoke(prompt)
