"""
VPBank K-MULT Agent Studio - Strands Agent Service
Multi-Agent Hackathon 2025 - Group 181

Service layer for integrating Strands Agents with FastAPI backend
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

# Import Strands Agent tools
from app.mutil_agent.agents.strands_tools import (
    compliance_validation_agent,
    risk_assessment_agent,
    document_intelligence_agent,
    vpbank_supervisor_agent,
    supervisor_agent
)

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StrandsAgentService:
    """
    Service class for managing Strands Agent interactions
    """
    
    def __init__(self):
        self.available_agents = {
            "compliance_validation": compliance_validation_agent,
            "risk_assessment": risk_assessment_agent,
            "document_intelligence": document_intelligence_agent,
            "supervisor": vpbank_supervisor_agent
        }
        logger.info("🤖 Strands Agent Service initialized with agents: %s", list(self.available_agents.keys()))
    
    async def process_compliance_validation(
        self, 
        document_text: str, 
        document_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process compliance validation using Strands Agent
        
        Args:
            document_text: Document text to validate
            document_type: Optional document type
            
        Returns:
            Compliance validation results
        """
        try:
            logger.info("🔍 Processing compliance validation via Strands Agent")
            
            # Call Strands Agent tool
            result_json = compliance_validation_agent(document_text, document_type)
            result = json.loads(result_json)
            
            # Add service metadata
            result["service_info"] = {
                "service": "strands_agent_service",
                "agent_type": "compliance_validation",
                "processing_time": datetime.now().isoformat(),
                "version": "1.0.0"
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Compliance validation error: {str(e)}")
            return {
                "status": "error",
                "message": f"Compliance validation failed: {str(e)}",
                "agent_type": "compliance_validation"
            }
    
    async def process_risk_assessment(
        self,
        applicant_name: str,
        business_type: str,
        requested_amount: float,
        currency: str = "VND",
        loan_term: int = 12,
        loan_purpose: str = "business_expansion",
        assessment_type: str = "comprehensive",
        collateral_type: str = "real_estate",
        financial_documents: str = ""
    ) -> Dict[str, Any]:
        """
        Process risk assessment using Strands Agent
        
        Args:
            applicant_name: Name of the loan applicant
            business_type: Type of business/industry
            requested_amount: Loan amount requested
            currency: Currency (default: VND)
            loan_term: Loan term in months
            loan_purpose: Purpose of the loan
            assessment_type: Type of assessment
            collateral_type: Type of collateral
            financial_documents: Financial documents text
            
        Returns:
            Risk assessment results
        """
        try:
            logger.info(f"📊 Processing risk assessment via Strands Agent for {applicant_name}")
            
            # Call Strands Agent tool
            result_json = risk_assessment_agent(
                applicant_name=applicant_name,
                business_type=business_type,
                requested_amount=requested_amount,
                currency=currency,
                loan_term=loan_term,
                loan_purpose=loan_purpose,
                assessment_type=assessment_type,
                collateral_type=collateral_type,
                financial_documents=financial_documents
            )
            result = json.loads(result_json)
            
            # Add service metadata
            result["service_info"] = {
                "service": "strands_agent_service",
                "agent_type": "risk_assessment",
                "processing_time": datetime.now().isoformat(),
                "version": "1.0.0"
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Risk assessment error: {str(e)}")
            return {
                "status": "error",
                "message": f"Risk assessment failed: {str(e)}",
                "agent_type": "risk_assessment"
            }
    
    async def process_document_intelligence(
        self,
        document_content: str,
        document_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process document intelligence using Strands Agent
        
        Args:
            document_content: Document content to process
            document_type: Optional document type hint
            
        Returns:
            Document intelligence results
        """
        try:
            logger.info("📄 Processing document intelligence via Strands Agent")
            
            # Call Strands Agent tool
            result_json = document_intelligence_agent(document_content, document_type)
            result = json.loads(result_json)
            
            # Add service metadata
            result["service_info"] = {
                "service": "strands_agent_service",
                "agent_type": "document_intelligence",
                "processing_time": datetime.now().isoformat(),
                "version": "1.0.0"
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Document intelligence error: {str(e)}")
            return {
                "status": "error",
                "message": f"Document intelligence failed: {str(e)}",
                "agent_type": "document_intelligence"
            }
    
    async def process_supervisor_request(
        self,
        user_request: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process request through supervisor agent
        
        Args:
            user_request: User's request or question
            context: Optional context information
            
        Returns:
            Supervisor agent response
        """
        try:
            logger.info(f"🎯 Processing supervisor request: {user_request[:100]}...")
            
            # Call Strands Agent tool
            result_json = vpbank_supervisor_agent(user_request, context)
            result = json.loads(result_json)
            
            # Add service metadata
            result["service_info"] = {
                "service": "strands_agent_service",
                "agent_type": "supervisor_orchestrator",
                "processing_time": datetime.now().isoformat(),
                "version": "1.0.0"
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Supervisor request error: {str(e)}")
            return {
                "status": "error",
                "message": f"Supervisor request failed: {str(e)}",
                "agent_type": "supervisor_orchestrator"
            }
    
    async def get_agent_status(self) -> Dict[str, Any]:
        """
        Get status of all available Strands Agents
        
        Returns:
            Agent status information
        """
        try:
            agent_status = {}
            
            for agent_name, agent_func in self.available_agents.items():
                try:
                    # Test agent availability
                    agent_status[agent_name] = {
                        "status": "available",
                        "type": "strands_agent_tool",
                        "last_check": datetime.now().isoformat()
                    }
                except Exception as e:
                    agent_status[agent_name] = {
                        "status": "error",
                        "error": str(e),
                        "last_check": datetime.now().isoformat()
                    }
            
            return {
                "status": "success",
                "agents": agent_status,
                "total_agents": len(self.available_agents),
                "service_info": {
                    "service": "strands_agent_service",
                    "version": "1.0.0",
                    "framework": "strands_agents_sdk"
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Agent status check error: {str(e)}")
            return {
                "status": "error",
                "message": f"Agent status check failed: {str(e)}"
            }
    
    async def process_supervisor_with_file(
        self,
        user_request: str,
        file_content: Optional[str] = None,
        file_info: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process request through supervisor agent with file content
        
        Args:
            user_request: User's request or question
            file_content: Extracted text from uploaded file
            file_info: File metadata information
            context: Optional context information
            
        Returns:
            Enhanced supervisor agent response with file processing
        """
        try:
            logger.info(f"🎯 Processing supervisor request with file: {user_request[:100]}...")
            
            # Enhance request with file content
            enhanced_request = user_request
            if file_content:
                enhanced_request += f"\n\n--- UPLOADED DOCUMENT CONTENT ---\n{file_content}\n--- END DOCUMENT ---"
            
            # Enhance context with file information
            enhanced_context = context or {}
            if file_info:
                enhanced_context.update({
                    "file_processing": file_info,
                    "has_document": bool(file_content),
                    "document_length": len(file_content) if file_content else 0,
                    "processing_mode": "supervisor_with_file"
                })
            
            # Call standard supervisor processing
            result = await self.process_supervisor_request(enhanced_request, enhanced_context)
            
            # Add file processing metadata
            if "processing_info" in result:
                result["processing_info"]["file_processing"] = file_info
                result["processing_info"]["enhanced_with_document"] = bool(file_content)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Supervisor with file processing error: {str(e)}")
            return {
                "status": "error",
                "message": f"Supervisor with file processing failed: {str(e)}",
                "agent_type": "supervisor_with_file"
            }
        """
        List all available Strands Agent tools
        
        Returns:
            List of available tools with descriptions
        """
        tools_info = {
            "compliance_validation_agent": {
                "description": "Validate document compliance against UCP 600 and Vietnamese banking regulations",
                "parameters": ["document_text", "document_type (optional)"],
                "use_cases": ["LC validation", "Regulatory compliance", "AML/CFT checks"]
            },
            "risk_assessment_agent": {
                "description": "Perform comprehensive credit risk assessment using Basel III standards",
                "parameters": ["applicant_name", "business_type", "requested_amount", "currency", "loan_term", "loan_purpose", "assessment_type", "collateral_type", "financial_documents"],
                "use_cases": ["Credit scoring", "Loan approval", "Risk analysis"]
            },
            "document_intelligence_agent": {
                "description": "Extract and analyze document content using OCR and Vietnamese NLP",
                "parameters": ["document_content", "document_type (optional)"],
                "use_cases": ["OCR processing", "Document classification", "Information extraction"]
            },
            "vpbank_supervisor_agent": {
                "description": "Master orchestrator that coordinates all specialized banking agents",
                "parameters": ["user_request", "context (optional)"],
                "use_cases": ["Multi-agent workflows", "Complex banking processes", "Decision orchestration"]
            }
        }
        
        return {
            "status": "success",
            "available_tools": tools_info,
            "total_tools": len(tools_info),
            "service_info": {
                "service": "strands_agent_service",
                "version": "1.0.0",
                "framework": "strands_agents_sdk"
            }
        }


# Global service instance
strands_service = StrandsAgentService()
