from abc import ABC, abstractmethod


class AIModelInterface(ABC):
    @abstractmethod
    def user_prompt_with_image(self, prompt_text: str, image_base64: str) -> dict:
        pass

    @abstractmethod
    def ai_chunk_stream(self, chunk) -> str:
        pass

    @abstractmethod
    def ai_astream(self, prompt):
        pass

    @abstractmethod
    async def ai_ainvoke(self, prompt) -> str:
        pass
