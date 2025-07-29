from typing import Any


class StreamWriter:
    def __init__(self, messages: Any, node_name: str, type: str):
        self.messages = messages
        self.node_name = node_name
        self.type = type

    def to_dict(self):
        return {
            "messages": self.messages,
            "node_name": self.node_name,
            "type": self.type,
        }
