from langchain_openai import ChatOpenAI

from app.themovie.interfaces.ai_model_interface import AIModelInterface


class OpenAIService(AIModelInterface):
    def __init__(self, model_id, temperature, top_p):
        self.model_id = model_id
        self.temperature = temperature
        self.top_p = top_p
        self.client = ChatOpenAI(
            model=self.model_id, temperature=temperature, top_p=top_p
        )

    def user_prompt_with_image(self, prompt_text: str, image_base64: str) -> dict:
        user_prompt = {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt_text},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}",
                    },
                },
            ],
        }
        return user_prompt

    def ai_astream(self, prompt):
        return self.client.astream(prompt)

    def ai_chunk_stream(self, chunk):
        return chunk.content or ""

    async def ai_ainvoke(self, prompt: str):
        return await self.client.ainvoke(prompt)
