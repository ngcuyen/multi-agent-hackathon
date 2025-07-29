from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json


class ConversationState(BaseModel):
    # Core fields
    type: str
    messages: List[str]
    node_name: str
    
    # Conversation specific fields
    conversation_id: str
    user_id: str
    next_node: str
    
    # Optional fields for workflow
    routing_info: Optional[dict] = None
    conversation_context: Optional[dict] = None
    
    class Config:
        # Enable LangGraph compatibility
        arbitrary_types_allowed = True
    
    def __reduce_ex__(self, protocol):
        """Custom serialization for DynamoDB"""
        return (
            self.__class__.from_dict,
            (self.dict(),)
        )
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationState":
        """Create from dict"""
        return cls(**data)
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Convert to DynamoDB compatible format"""
        return {
            'type': {'S': self.type},
            'messages': {'L': [{'S': msg} for msg in self.messages]},
            'node_name': {'S': self.node_name},
            'conversation_id': {'S': self.conversation_id},
            'user_id': {'S': self.user_id},
            'next_node': {'S': self.next_node},
            'routing_info': {'S': json.dumps(self.routing_info) if self.routing_info else ''},
            'conversation_context': {'S': json.dumps(self.conversation_context) if self.conversation_context else ''},
        }
