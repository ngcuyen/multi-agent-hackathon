from pydantic import BaseModel
from typing import List, Optional, Dict, Any


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
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for DynamoDB serialization"""
        return {
            "type": self.type,
            "messages": self.messages,
            "node_name": self.node_name,
            "conversation_id": self.conversation_id,
            "user_id": self.user_id,
            "next_node": self.next_node,
            "routing_info": self.routing_info,
            "conversation_context": self.conversation_context,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationState":
        """Create from dict for DynamoDB deserialization"""
        return cls(**data)
    
    def __reduce__(self):
        """Support for pickle serialization"""
        return (self.from_dict, (self.to_dict(),))
