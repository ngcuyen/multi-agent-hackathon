from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class AgentCoordinationRequest(BaseModel):
    task_type: str
    document_id: Optional[str] = None
    priority: str = "medium"
    agents: Optional[List[str]] = None

class AgentCoordinationResponse(BaseModel):
    status: str
    task_id: str
    assigned_agents: List[str]
    estimated_completion_time: str
    message: str

@router.post("/coordinate", response_model=AgentCoordinationResponse)
async def coordinate_agents(request: AgentCoordinationRequest):
    """
    Coordinate multiple agents for complex banking tasks
    """
    try:
        # Simulate agent coordination logic
        available_agents = {
            "lc_processing": ["document-intelligence", "compliance-validation", "risk-assessment"],
            "credit_assessment": ["risk-assessment", "decision-synthesis"],
            "document_analysis": ["document-intelligence", "compliance-validation"]
        }
        
        assigned_agents = available_agents.get(request.task_type, ["supervisor"])
        if request.agents:
            assigned_agents = [agent for agent in request.agents if agent in assigned_agents]
        
        task_id = f"task-{request.task_type}-{hash(request.document_id or 'default') % 10000}"
        
        return AgentCoordinationResponse(
            status="success",
            task_id=task_id,
            assigned_agents=assigned_agents,
            estimated_completion_time="2-5 minutes",
            message=f"Đã phân công {len(assigned_agents)} agent xử lý task {request.task_type}"
        )
    except Exception as e:
        logger.error(f"Error in agent coordination: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Get status of a coordinated task
    """
    return {
        "status": "success",
        "task_id": task_id,
        "current_status": "processing",
        "progress": "75%",
        "active_agents": ["document-intelligence", "compliance-validation"],
        "estimated_remaining_time": "1-2 minutes"
    }

@router.get("/agents/list")
async def list_available_agents():
    """
    List all available agents and their capabilities
    """
    return {
        "status": "success",
        "agents": {
            "supervisor": {
                "name": "Supervisor Agent",
                "description": "Orchestrates workflow and coordinates other agents",
                "capabilities": ["task_distribution", "workflow_management", "agent_coordination"],
                "status": "active"
            },
            "document-intelligence": {
                "name": "Document Intelligence Agent", 
                "description": "Advanced OCR with deep Vietnamese NLP capabilities",
                "capabilities": ["ocr_processing", "vietnamese_nlp", "document_classification"],
                "status": "active"
            },
            "risk-assessment": {
                "name": "Risk Assessment Agent",
                "description": "Automated financial analysis and predictive risk modeling", 
                "capabilities": ["credit_scoring", "financial_analysis", "risk_prediction"],
                "status": "active"
            },
            "compliance-validation": {
                "name": "Compliance Validation Agent",
                "description": "Validates against banking regulations",
                "capabilities": ["ucp600_validation", "sbv_compliance", "policy_validation"],
                "status": "active"
            },
            "decision-synthesis": {
                "name": "Decision Synthesis Agent",
                "description": "Generates evidence-based recommendations",
                "capabilities": ["decision_making", "confidence_scoring", "recommendation_generation"],
                "status": "active"
            },
            "process-automation": {
                "name": "Process Automation Agent",
                "description": "End-to-end workflow automation",
                "capabilities": ["lc_processing", "credit_proposals", "document_routing"],
                "status": "active"
            }
        }
    }
