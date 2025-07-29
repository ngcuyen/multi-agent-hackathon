from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import time
import uuid

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

class AgentStatusResponse(BaseModel):
    agent_id: str
    status: str
    current_task: Optional[str]
    load_percentage: float
    last_activity: str

class AgentListResponse(BaseModel):
    total_agents: int
    active_agents: int
    agents: List[Dict[str, Any]]

# Health check endpoint
@router.get("/health")
async def agents_health_check():
    """Health check for multi-agent coordination service"""
    return {
        "status": "healthy",
        "service": "multi_agent_coordination",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "features": {
            "agent_coordination": True,
            "task_distribution": True,
            "workflow_management": True,
            "real_time_monitoring": True
        },
        "agents": {
            "supervisor_agent": "active",
            "document_intelligence_agent": "active",
            "risk_assessment_agent": "active",
            "compliance_validation_agent": "active",
            "decision_synthesis_agent": "active",
            "process_automation_agent": "active"
        },
        "total_agents": 6,
        "active_agents": 6,
        "coordination_engine": "langchain"
    }

@router.post("/coordinate", response_model=AgentCoordinationResponse)
async def coordinate_agents(request: AgentCoordinationRequest):
    """
    Coordinate multiple agents for complex banking tasks
    """
    try:
        # Define available agents for different task types
        available_agents = {
            "lc_processing": ["document-intelligence", "compliance-validation", "risk-assessment", "decision-synthesis"],
            "credit_assessment": ["risk-assessment", "decision-synthesis", "document-intelligence"],
            "document_analysis": ["document-intelligence", "compliance-validation"],
            "compliance_check": ["compliance-validation", "document-intelligence"],
            "risk_analysis": ["risk-assessment", "document-intelligence", "decision-synthesis"],
            "full_workflow": ["supervisor", "document-intelligence", "compliance-validation", "risk-assessment", "decision-synthesis", "process-automation"]
        }
        
        # Get agents for the task type
        assigned_agents = available_agents.get(request.task_type, ["supervisor"])
        
        # Filter by requested agents if specified
        if request.agents:
            assigned_agents = [agent for agent in request.agents if agent in assigned_agents]
        
        # Generate unique task ID
        task_id = f"task-{request.task_type}-{str(uuid.uuid4())[:8]}"
        
        # Estimate completion time based on task complexity
        time_estimates = {
            "lc_processing": "15-30 minutes",
            "credit_assessment": "5-15 minutes",
            "document_analysis": "2-5 minutes",
            "compliance_check": "3-8 minutes",
            "risk_analysis": "5-12 minutes",
            "full_workflow": "20-45 minutes"
        }
        
        estimated_time = time_estimates.get(request.task_type, "5-15 minutes")
        
        return AgentCoordinationResponse(
            status="success",
            task_id=task_id,
            assigned_agents=assigned_agents,
            estimated_completion_time=estimated_time,
            message=f"Đã phân công {len(assigned_agents)} agent xử lý task {request.task_type} với độ ưu tiên {request.priority}"
        )
    except Exception as e:
        logger.error(f"Error in agent coordination: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status", response_model=AgentListResponse)
async def get_agents_status():
    """Get status of all agents in the system"""
    try:
        agents = [
            {
                "agent_id": "supervisor",
                "name": "Supervisor Agent",
                "status": "active",
                "current_task": None,
                "load_percentage": 15.5,
                "last_activity": "2025-07-19T16:45:00Z",
                "capabilities": ["workflow_orchestration", "task_distribution", "coordination"],
                "description": "Orchestrates workflow and coordinates other agents"
            },
            {
                "agent_id": "document-intelligence",
                "name": "Document Intelligence Agent",
                "status": "active",
                "current_task": "ocr_processing",
                "load_percentage": 45.2,
                "last_activity": "2025-07-19T16:50:00Z",
                "capabilities": ["ocr", "text_extraction", "vietnamese_nlp", "document_classification"],
                "description": "Advanced OCR with deep Vietnamese NLP capabilities"
            },
            {
                "agent_id": "risk-assessment",
                "name": "Risk Assessment Agent",
                "status": "active",
                "current_task": None,
                "load_percentage": 22.8,
                "last_activity": "2025-07-19T16:48:00Z",
                "capabilities": ["credit_scoring", "financial_analysis", "risk_prediction"],
                "description": "Automated financial analysis and predictive risk modeling"
            },
            {
                "agent_id": "compliance-validation",
                "name": "Compliance Validation Agent",
                "status": "active",
                "current_task": "regulation_check",
                "load_percentage": 33.1,
                "last_activity": "2025-07-19T16:49:00Z",
                "capabilities": ["ucp600_validation", "isbp821_validation", "sbv_compliance"],
                "description": "Validates against banking regulations (UCP 600, ISBP 821, SBV)"
            },
            {
                "agent_id": "decision-synthesis",
                "name": "Decision Synthesis Agent",
                "status": "active",
                "current_task": None,
                "load_percentage": 18.7,
                "last_activity": "2025-07-19T16:47:00Z",
                "capabilities": ["evidence_analysis", "recommendation_generation", "confidence_scoring"],
                "description": "Generates evidence-based recommendations with confidence scores"
            },
            {
                "agent_id": "process-automation",
                "name": "Process Automation Agent",
                "status": "active",
                "current_task": "workflow_execution",
                "load_percentage": 28.4,
                "last_activity": "2025-07-19T16:51:00Z",
                "capabilities": ["lc_processing", "credit_proposals", "document_routing"],
                "description": "End-to-end workflow automation and system integration"
            }
        ]
        
        active_agents = len([a for a in agents if a["status"] == "active"])
        
        return AgentListResponse(
            total_agents=len(agents),
            active_agents=active_agents,
            agents=agents
        )
    except Exception as e:
        logger.error(f"Error getting agent status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{agent_id}", response_model=AgentStatusResponse)
async def get_agent_status(agent_id: str):
    """Get detailed status of a specific agent"""
    try:
        # Mock agent status data
        agent_data = {
            "supervisor": {"status": "active", "current_task": None, "load": 15.5},
            "document-intelligence": {"status": "active", "current_task": "ocr_processing", "load": 45.2},
            "risk-assessment": {"status": "active", "current_task": None, "load": 22.8},
            "compliance-validation": {"status": "active", "current_task": "regulation_check", "load": 33.1},
            "decision-synthesis": {"status": "active", "current_task": None, "load": 18.7},
            "process-automation": {"status": "active", "current_task": "workflow_execution", "load": 28.4}
        }
        
        if agent_id not in agent_data:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
        
        data = agent_data[agent_id]
        
        return AgentStatusResponse(
            agent_id=agent_id,
            status=data["status"],
            current_task=data["current_task"],
            load_percentage=data["load"],
            last_activity="2025-07-19T16:50:00Z"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent {agent_id} status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assign")
async def assign_task_to_agent(
    agent_id: str,
    task_type: str,
    task_data: Dict[str, Any] = None
):
    """Assign a specific task to a specific agent"""
    try:
        # Validate agent exists
        valid_agents = ["supervisor", "document-intelligence", "risk-assessment", 
                       "compliance-validation", "decision-synthesis", "process-automation"]
        
        if agent_id not in valid_agents:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
        
        # Generate task assignment
        task_id = f"task-{agent_id}-{str(uuid.uuid4())[:8]}"
        
        return {
            "status": "success",
            "task_id": task_id,
            "agent_id": agent_id,
            "task_type": task_type,
            "assigned_at": time.time(),
            "message": f"Task {task_type} assigned to agent {agent_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning task to agent {agent_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=AgentListResponse)
async def list_agents():
    """List all available agents with their capabilities"""
    return await get_agents_status()
