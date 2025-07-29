from pydantic import BaseModel


class BaseState(BaseModel):
    type: str
    messages: list[str]
    node_name: str
