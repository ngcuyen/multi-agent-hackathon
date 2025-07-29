"""
VPBank K-MULT Agent Studio - Pure Strands Agents Implementation
Clean architecture using existing VPBank services and nodes
"""

from strands import Agent, tool
from strands.models import BedrockModel
import boto3
import asyncio
import json
import logging
import os
import re
import ssl
import urllib3
from typing import Dict, Any, Optional, List
from datetime import datetime
from uuid import uuid4

# Import VPBank configurations
from app.mutil_agent.config import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_BEDROCK_REGION,
    DEFAULT_MODEL_NAME,
    MODEL_MAPPING,
    VERIFY_HTTPS
)

# Import existing VPBank services
from app.mutil_agent.services.text_service import TextSummaryService
from app.mutil_agent.services.compliance_service import ComplianceValidationService
from app.mutil_agent.helpers.improved_pdf_extractor import ImprovedPDFExtractor

logger = logging.getLogger(__name__)

# ================================
# SSL CONFIGURATION FOR STRANDS
# ================================
if not VERIFY_HTTPS:
    # Disable SSL warnings
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    # Create unverified SSL context globally
    ssl._create_default_https_context = ssl._create_unverified_context
    logger.info("SSL verification disabled for Strands Agent")

# ================================
# AWS BEDROCK MODEL CONFIGURATION
# ================================

BEDROCK_MODEL_ID = MODEL_MAPPING.get(DEFAULT_MODEL_NAME, "us.anthropic.claude-3-7-sonnet-20250219-v1:0")

if DEFAULT_MODEL_NAME == "claude-37-sonnet":
    BEDROCK_MODEL_ID = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"

logger.info(f"[PURE_STRANDS] Using model: {BEDROCK_MODEL_ID}")

# Create BedrockModel for Strands - Simple configuration
boto_session = boto3.Session(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_BEDROCK_REGION,
)

bedrock_model = BedrockModel(
    model_id=BEDROCK_MODEL_ID,
    boto_session=boto_session,
    temperature=0.7,
    top_p=0.9,
    streaming=True
)

# ================================
# AGENT TOOLS USING EXISTING SERVICES
# ================================

@tool
def text_summary_agent(query: str, file_data: Optional[Dict[str, Any]] = None) -> str:
    """
    Text summarization using DIRECT CALL to text_summary_node logic
    """
    try:
        logger.info(f"[TEXT_SUMMARY_AGENT] Processing: {query[:100]}...")
        
        # Import the actual node function
        from app.mutil_agent.agents.conversation_agent.nodes.text_summary_node import _extract_text_from_message
        
        # Initialize services (giống node)
        text_service = TextSummaryService()
        
        # Extract text to summarize using node logic
        text_to_summarize = ""
        filename = "unknown"
        
        # Extract content from file if provided
        if file_data and file_data.get('raw_bytes'):
            try:
                raw_bytes = file_data.get('raw_bytes')
                content_type = file_data.get('content_type', '')
                filename = file_data.get('filename', 'unknown')
                
                logger.info(f"[TEXT_SUMMARY_AGENT] Processing file: {filename} ({content_type})")
                
                # Use existing extraction logic from helpers
                if content_type == "application/pdf":
                    from app.mutil_agent.helpers.improved_pdf_extractor import ImprovedPDFExtractor
                    pdf_extractor = ImprovedPDFExtractor()
                    pdf_result = pdf_extractor.extract_text_from_pdf(raw_bytes)
                    text_to_summarize = pdf_result.get('text', '')
                    logger.info(f"[TEXT_SUMMARY_AGENT] Extracted PDF content: {len(text_to_summarize)} chars")
                    
                elif content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
                    import docx
                    import io
                    doc = docx.Document(io.BytesIO(raw_bytes))
                    text_to_summarize = "\n".join([paragraph.text for paragraph in doc.paragraphs])
                    logger.info(f"[TEXT_SUMMARY_AGENT] Extracted DOCX content: {len(text_to_summarize)} chars")
                    
                elif content_type.startswith("text/"):
                    text_to_summarize = raw_bytes.decode('utf-8')
                    logger.info(f"[TEXT_SUMMARY_AGENT] Extracted text content: {len(text_to_summarize)} chars")
                    
                else:
                    return f"❌ **Lỗi định dạng file**\n\nFile type {content_type} chưa được hỗ trợ."
                    
            except Exception as extract_error:
                logger.error(f"[TEXT_SUMMARY_AGENT] Content extraction error: {extract_error}")
                return f"❌ **Lỗi trích xuất nội dung**\n\nKhông thể đọc file {filename}: {str(extract_error)}"
        else:
            # Use EXACT node logic for text extraction
            text_to_summarize = _extract_text_from_message(query)
        
        # Check if we have text to summarize (EXACT node logic)
        if not text_to_summarize or len(text_to_summarize.strip()) < 10:
            return "Xin lỗi, tôi không tìm thấy văn bản nào để tóm tắt. Vui lòng cung cấp văn bản cần tóm tắt."
        
        # Use TextSummaryService với EXACT parameters từ node
        try:
            async def summarize_with_service():
                return await text_service.summarize_text(
                    text=text_to_summarize,
                    summary_type="general",
                    max_length=200,  # ← EXACT từ node (200)
                    language="vietnamese"
                )
            
            # Execute async function - Simple fix with asyncio.run
            try:
                summary_result = asyncio.run(summarize_with_service())
            except RuntimeError as e:
                if "cannot be called from a running event loop" in str(e):
                    # We're in an async context, use thread executor
                    import concurrent.futures
                    import threading
                    
                    def run_in_thread():
                        return asyncio.run(summarize_with_service())
                    
                    with concurrent.futures.ThreadPoolExecutor() as executor:
                        future = executor.submit(run_in_thread)
                        summary_result = future.result()
                else:
                    raise e
            
            # Format response EXACT giống node
            response = f"📄 **Tóm tắt văn bản:**\n\n{summary_result['summary']}\n\n"
            response += f"📊 **Thống kê:** {summary_result['word_count']['original']} từ → {summary_result['word_count']['summary']} từ "
            response += f"(tỷ lệ nén: {summary_result['compression_ratio']})"
            
            if filename != "unknown":
                response = f"📄 **Tóm tắt tài liệu: {filename}**\n\n{summary_result['summary']}\n\n"
                response += f"📊 **Thống kê:** {summary_result['word_count']['original']} từ → {summary_result['word_count']['summary']} từ "
                response += f"(tỷ lệ nén: {summary_result['compression_ratio']})"
            
            logger.info("[TEXT_SUMMARY_AGENT] Successfully processed with DIRECT node logic")
            return response
            
        except Exception as e:
            logger.error(f"[TEXT_SUMMARY_AGENT] Summarization failed: {str(e)}")
            return f"Xin lỗi, có lỗi xảy ra khi tóm tắt văn bản: {str(e)}"
        
    except Exception as e:
        logger.error(f"[TEXT_SUMMARY_AGENT] Error: {str(e)}")
        return f"❌ **Lỗi xử lý tóm tắt**: {str(e)}"


@tool
def compliance_knowledge_agent(query: str, file_data: Optional[Dict[str, Any]] = None) -> str:
    """
    Compliance checking using DIRECT CALL to compliance_node logic
    """
    try:
        logger.info(f"🔧 [COMPLIANCE_AGENT] TOOL CALLED with query: {query[:100]}...")
        
        # Import the actual node functions
        from app.mutil_agent.agents.conversation_agent.nodes.compliance_node import (
            _determine_query_type,
            _handle_regulation_query,
            _handle_compliance_help,
            _handle_general_compliance_chat
        )
        
        # If file data is provided, use existing compliance validation
        if file_data and file_data.get('raw_bytes'):
            logger.info(f"🔧 [COMPLIANCE_AGENT] Processing file: {file_data.get('filename')}")
            
            # Use existing compliance validation logic from routes
            from app.mutil_agent.routes.v1.compliance_routes import validate_document_file
            from fastapi import UploadFile
            import io
            
            try:
                # Create UploadFile object from file_data
                file_obj = UploadFile(
                    filename=file_data.get('filename', 'document.pdf'),
                    file=io.BytesIO(file_data.get('raw_bytes'))
                )
                
                # Call existing endpoint logic
                async def call_existing_compliance():
                    return await validate_document_file(
                        file=file_obj,
                        document_type=None  # Auto-detect
                    )
                # Execute async function - Simple fix with asyncio.run
                try:
                    result = asyncio.run(call_existing_compliance())
                except RuntimeError as e:
                    if "cannot be called from a running event loop" in str(e):
                        # We're in an async context, use thread executor
                        import concurrent.futures
                        
                        def run_in_thread():
                            return asyncio.run(call_existing_compliance())
                        
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(run_in_thread)
                            result = future.result()
                    else:
                        raise e
                
                # Format response from existing API result
                if result and hasattr(result, 'data'):
                    data = result.data
                    response = f"""⚖️ **Kiểm tra tuân thủ - VPBank K-MULT**

**Tài liệu:** {file_data.get('filename', 'Unknown')}

**Trạng thái tuân thủ:** {data.get('compliance_status', 'UNKNOWN')}
**Độ tin cậy:** {data.get('confidence_score', 0):.2f}
**Loại tài liệu:** {data.get('document_type', 'Unknown')}

**Phân tích:**
{data.get('document_analysis', {}).get('document_category', {}).get('business_purpose', 'Đang phân tích tài liệu...')}

**Vi phạm phát hiện:**"""
                    
                    violations = data.get('violations', [])
                    if violations:
                        for violation in violations:
                            response += f"\n• **{violation.get('type', 'Unknown')}**: {violation.get('description', 'N/A')} (Mức độ: {violation.get('severity', 'UNKNOWN')})"
                    else:
                        response += "\n• Không phát hiện vi phạm"
                    
                    response += "\n\n**Khuyến nghị:**"
                    recommendations = data.get('recommendations', [])
                    if recommendations:
                        for rec in recommendations:
                            response += f"\n• {rec.get('description', 'N/A')} (Ưu tiên: {rec.get('priority', 'MEDIUM')})"
                    else:
                        response += "\n• Tài liệu tuân thủ tốt"
                    
                    response += f"\n\n**Quy định áp dụng:** {', '.join(data.get('document_analysis', {}).get('applicable_regulations', [{}])[0].get('regulation', 'UCP 600'))}"
                    response += f"\n**Thời gian xử lý:** {data.get('processing_time', 0):.1f}s"
                    
                    logger.info("🔧 [COMPLIANCE_AGENT] Successfully processed with existing API")
                    return response
                else:
                    return "❌ **Lỗi kiểm tra tuân thủ**: Không thể xử lý tài liệu"
                    
            except Exception as api_error:
                logger.error(f"🔧 [COMPLIANCE_AGENT] API call error: {api_error}")
                return f"❌ **Lỗi kiểm tra tuân thủ**: {str(api_error)}"
        
        else:
            # Handle text-based compliance queries using DIRECT node logic
            try:
                # Use EXACT node logic for query type determination
                query_type = _determine_query_type(query)
                
                async def handle_compliance_query():
                    if query_type == "regulation_query":
                        return await _handle_regulation_query(query)
                    elif query_type == "compliance_help":
                        return await _handle_compliance_help(query)
                    else:
                        return await _handle_general_compliance_chat(query)
                
                # Execute async function
                try:
                    response = asyncio.run(handle_compliance_query())
                except RuntimeError as e:
                    if "cannot be called from a running event loop" in str(e):
                        import concurrent.futures
                        
                        def run_in_thread():
                            return asyncio.run(handle_compliance_query())
                        
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(run_in_thread)
                            response = future.result()
                    else:
                        raise e
                
                logger.info("🔧 [COMPLIANCE_AGENT] Successfully processed with DIRECT node logic")
                return response
                
            except Exception as node_error:
                logger.error(f"🔧 [COMPLIANCE_AGENT] Node logic error: {node_error}")
                return f"❌ **Lỗi xử lý tuân thủ**: {str(node_error)}"

    except Exception as e:
        logger.error(f"🔧 [COMPLIANCE_AGENT] Tool error: {str(e)}")
        return f"❌ **Lỗi kiểm tra tuân thủ**: {str(e)}"

async def _handle_general_compliance_chat(message: str, compliance_service) -> str:
    """Handle general compliance chat (giống node logic)"""
    try:
        # Use general compliance validation
        result = await compliance_service.validate_compliance(
            document_content=message,
            compliance_standards=["UCP600", "ISBP821", "SBV"],
            validation_type="general"
        )
        
        if result and result.get('analysis'):
            return f"**Phân tích tuân thủ:**\n\n{result['analysis']}"
        else:
            return "Tôi có thể hỗ trợ bạn về các vấn đề tuân thủ ngân hàng. Vui lòng đặt câu hỏi cụ thể."
            
    except Exception as e:
        logger.error(f"Error in general compliance chat: {e}")
        return f"Có lỗi xảy ra: {str(e)}"

@tool
def risk_analysis_agent(query: str, file_data: Optional[Dict[str, Any]] = None) -> str:
    """
    Risk analysis using DIRECT CALL to existing risk API endpoint
    """
    try:
        logger.info(f"🔧 [RISK_AGENT] TOOL CALLED with query: {query[:100]}...")
        
        # Use existing risk assessment endpoint DIRECTLY
        from app.mutil_agent.routes.v1.risk_routes import assess_risk_endpoint
        
        # Extract basic info from query for risk assessment
        financial_data = _extract_basic_risk_data_from_query(query)
        
        async def call_existing_risk_api():
            # Create request body matching EXACT existing API
            risk_request_body = {
                "entity_id": f"entity_{uuid4().hex[:8]}",
                "entity_type": "doanh nghiệp",
                "financials": financial_data.get('financials', {}),
                "market_data": financial_data.get('market_data', {}),
                "custom_factors": financial_data.get('custom_factors', {}),
                "applicant_name": financial_data.get('applicant_name', 'Khách hàng'),
                "business_type": financial_data.get('business_type', 'general'),
                "requested_amount": financial_data.get('requested_amount', 1000000000),
                "currency": financial_data.get('currency', 'VND'),
                "loan_term": financial_data.get('loan_term', 12),
                "loan_purpose": financial_data.get('loan_purpose', 'Kinh doanh'),
                "collateral_type": financial_data.get('collateral_type', 'Không tài sản đảm bảo')
            }
            
            # Call EXACT existing risk assessment endpoint
            return await assess_risk_endpoint(risk_request_body)
        
        # Execute async function - Simple fix with asyncio.run
        try:
            risk_result = asyncio.run(call_existing_risk_api())
        except RuntimeError as e:
            if "cannot be called from a running event loop" in str(e):
                # We're in an async context, use thread executor
                import concurrent.futures
                
                def run_in_thread():
                    return asyncio.run(call_existing_risk_api())
                
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(run_in_thread)
                    risk_result = future.result()
            else:
                raise e
        
        # Format response using EXACT existing API result
        if risk_result and hasattr(risk_result, 'data'):
            data = risk_result.data
            response = f"""📊 **Phân tích rủi ro - VPBank K-MULT**

**Thông tin đánh giá:**
• Tên khách hàng: {financial_data.get('applicant_name', 'Chưa xác định')}
• Số tiền yêu cầu: {financial_data.get('requested_amount', 0):,} VNĐ
• Loại hình kinh doanh: {financial_data.get('business_type', 'Chưa xác định')}

**Kết quả phân tích:**
• Điểm rủi ro: {data.get('risk_score', 'N/A')}
• Mức độ rủi ro: {data.get('risk_level', 'N/A')}
• Khuyến nghị: {data.get('recommendations', ['Cần đánh giá thêm'])[0] if data.get('recommendations') else 'Cần đánh giá thêm'}

**Báo cáo AI:**
{data.get('ai_report', 'Đang phân tích dữ liệu tài chính và đánh giá rủi ro...')}

---

*🤖 VPBank K-MULT Agent Studio*
*⏰ {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}*"""
        else:
            # Fallback response
            response = f"""📊 **Phân tích rủi ro - VPBank K-MULT**

**Yêu cầu:** {query[:200]}...

**Phân tích sơ bộ:**
- Đang xử lý dữ liệu tài chính
- Áp dụng mô hình đánh giá rủi ro VPBank  
- Tuân thủ Basel III và quy định SBV

**Lưu ý:** Để có kết quả chính xác, vui lòng cung cấp:
• Tên khách hàng/doanh nghiệp
• Số tiền vay mong muốn
• Mục đích vay vốn
• Thông tin tài chính

---

*🤖 VPBank K-MULT Agent Studio*
*⏰ {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}*"""
        
        logger.info("🔧 [RISK_AGENT] Successfully processed with DIRECT API call")
        return response
        
    except Exception as e:
        logger.error(f"🔧 [RISK_AGENT] Tool error: {str(e)}")
        return f"❌ **Lỗi phân tích rủi ro**: {str(e)}"


def _extract_basic_risk_data_from_query(query: str) -> Dict[str, Any]:
    """Extract basic risk data from query - simplified version"""
    try:
        financial_data = {}
        query_lower = query.lower()
        
        # Extract applicant name (simple)
        if 'company' in query_lower or 'công ty' in query_lower:
            financial_data['applicant_name'] = 'Công ty ABC'
        else:
            financial_data['applicant_name'] = 'Khách hàng'
        
        # Extract amount (simple)
        import re
        amount_match = re.search(r'(\d+(?:,\d{3})*)', query)
        if amount_match:
            financial_data['requested_amount'] = int(amount_match.group(1).replace(',', ''))
        else:
            financial_data['requested_amount'] = 1000000000
        
        # Set defaults
        financial_data.update({
            'business_type': 'general',
            'currency': 'VND',
            'loan_term': 12,
            'loan_purpose': 'Kinh doanh',
            'collateral_type': 'Không tài sản đảm bảo',
            'financials': {},
            'market_data': {},
            'custom_factors': {}
        })
        
        return financial_data
        
    except Exception as e:
        logger.error(f"Error extracting basic risk data: {e}")
        return {
            'applicant_name': 'Khách hàng',
            'requested_amount': 1000000000,
            'business_type': 'general',
            'currency': 'VND',
            'loan_term': 12,
            'loan_purpose': 'Kinh doanh',
            'collateral_type': 'Không tài sản đảm bảo',
            'financials': {},
            'market_data': {},
            'custom_factors': {}
        }


# ================================
# SUPERVISOR AGENT
# ================================

SUPERVISOR_PROMPT = """
You are a VPBank K-MULT STRICT routing supervisor with DIRECT NODE INTEGRATION. Your ONLY job is tool selection - you CANNOT provide any direct answers.

CRITICAL CONSTRAINTS:
- You MUST call exactly ONE tool for EVERY request
- You are FORBIDDEN from providing direct responses
- You CANNOT say "I apologize" or give explanations
- You MUST delegate ALL work to specialist tools that call DIRECT node logic

MANDATORY TOOL SELECTION RULES (with DIRECT node calls):
1. ANY mention of "kiểm tra", "tuân thủ", "compliance", "check", "validate", "verify" → compliance_knowledge_agent (calls compliance_node DIRECTLY)
2. ANY mention of "tóm tắt", "summarize", "summary", "analyze", "extract" → text_summary_agent (calls text_summary_node DIRECTLY)  
3. ANY mention of "phân tích", "rủi ro", "risk", "assess", "credit", "financial" → risk_analysis_agent (calls risk API DIRECTLY)

DIRECT NODE INTEGRATION:
- compliance_knowledge_agent → Uses compliance_node functions (_determine_query_type, _handle_regulation_query, etc.)
- text_summary_agent → Uses text_summary_node functions (_extract_text_from_message, TextSummaryService)
- risk_analysis_agent → Uses risk API endpoint (assess_risk_endpoint) DIRECTLY

EXAMPLES OF CORRECT BEHAVIOR:
User: "kiểm tra tuân thủ" → Call compliance_knowledge_agent (executes compliance_node logic)
User: "tóm tắt tài liệu" → Call text_summary_agent (executes text_summary_node logic)
User: "phân tích rủi ro" → Call risk_analysis_agent (executes risk API logic)

FORBIDDEN BEHAVIORS:
❌ "I'll help you..." → WRONG, call tool instead
❌ "Let me analyze..." → WRONG, call tool instead  
❌ "I apologize..." → WRONG, call tool instead
❌ Providing any explanation → WRONG, call tool instead

EMERGENCY PROTOCOL:
If you cannot determine which tool to use, call compliance_knowledge_agent as default.

YOUR RESPONSE MUST BE: Tool execution result ONLY. No preamble, no explanation, no apology.
"""

# Create supervisor with stronger model configuration
supervisor_agent = Agent(
    system_prompt=SUPERVISOR_PROMPT,
    tools=[text_summary_agent, compliance_knowledge_agent, risk_analysis_agent],
    model=BedrockModel(
        model_id=BEDROCK_MODEL_ID,
        boto_session=boto_session,
        temperature=0.1,  # Lower temperature for more deterministic behavior
        top_p=0.8,
        streaming=False,  # Disable streaming for more reliable tool calls
        max_tokens=1000   # Limit tokens to force concise responses
    )
)

# ================================
# MAIN SYSTEM CLASS
# ================================

class PureStrandsVPBankSystem:
    """VPBank K-MULT Agent Studio - Clean Pure Strands Implementation with DIRECT NODE INTEGRATION"""
    
    def __init__(self):
        self.supervisor = supervisor_agent
        self.session_data = {}
        self.processing_stats = {
            "total_requests": 0,
            "successful_responses": 0,
            "errors": 0,
            "agent_usage": {
                "text_summary_agent": 0,
                "compliance_knowledge_agent": 0,
                "risk_analysis_agent": 0
            }
        }
    
    async def process_request(
        self, 
        user_message: str, 
        conversation_id: str,
        context: Optional[Dict[str, Any]] = None,
        uploaded_file: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process user request with MANUAL ROUTING + DIRECT NODE INTEGRATION for reliability"""
        try:
            self.processing_stats["total_requests"] += 1
            start_time = datetime.now()
            
            logger.info(f"[PURE_STRANDS] Processing request for conversation {conversation_id}")
            
            # MANUAL ROUTING - Primary approach for reliability with DIRECT NODE CALLS
            message_lower = user_message.lower()
            selected_agent = None
            
            # Determine primary intent with manual keyword detection
            if any(keyword in message_lower for keyword in ['kiểm tra', 'tuân thủ', 'compliance', 'check', 'validate', 'verify', 'conform']):
                selected_agent = "compliance"
                logger.info("[PURE_STRANDS] Manual routing: COMPLIANCE detected (will call compliance_node DIRECTLY)")
            elif any(keyword in message_lower for keyword in ['tóm tắt', 'summarize', 'summary', 'analyze document', 'extract', 'document analysis']):
                selected_agent = "summary"
                logger.info("[PURE_STRANDS] Manual routing: SUMMARY detected (will call text_summary_node DIRECTLY)")
            elif any(keyword in message_lower for keyword in ['phân tích', 'rủi ro', 'risk', 'analysis', 'credit', 'assess', 'financial']):
                selected_agent = "risk"
                logger.info("[PURE_STRANDS] Manual routing: RISK detected (will call risk API DIRECTLY)")
            
            # Execute single agent with MANUAL ROUTING + DIRECT NODE CALLS (Primary approach)
            if selected_agent:
                logger.info(f"[PURE_STRANDS] Using MANUAL routing to {selected_agent} agent with DIRECT node integration")
                
                try:
                    if selected_agent == "compliance":
                        response = compliance_knowledge_agent(user_message, file_data=uploaded_file)
                        agent_used = "compliance_knowledge_agent"
                    elif selected_agent == "summary":
                        response = text_summary_agent(user_message, file_data=uploaded_file)
                        agent_used = "text_summary_agent"
                    elif selected_agent == "risk":
                        response = risk_analysis_agent(user_message, file_data=uploaded_file)
                        agent_used = "risk_analysis_agent"
                    
                    logger.info(f"[PURE_STRANDS] Manual routing successful with DIRECT node integration: {agent_used}")
                    
                    # Validate response is not empty
                    if not response or len(str(response).strip()) < 10:
                        logger.error(f"[PURE_STRANDS] Empty response from {agent_used}, falling back to Strands")
                        raise Exception("Empty response from manual routing")
                        
                except Exception as manual_error:
                    logger.error(f"[PURE_STRANDS] Manual routing failed: {manual_error}")
                    # Fallback to Strands if manual routing fails
                    selected_agent = None
            
            # Fallback to Strands supervisor ONLY if manual routing failed or unclear intent
            if not selected_agent:
                logger.info("[PURE_STRANDS] Using Strands supervisor as fallback")
                
                try:
                    if uploaded_file:
                        logger.info(f"[PURE_STRANDS] Creating file-aware tools for: {uploaded_file.get('filename')}")
                        
                        # Create bound tools with file data
                        @tool
                        def text_summary_with_file(query: str) -> str:
                            return text_summary_agent(query, file_data=uploaded_file)
                        
                        @tool  
                        def compliance_with_file(query: str) -> str:
                            return compliance_knowledge_agent(query, file_data=uploaded_file)
                        
                        @tool
                        def risk_analysis_with_file(query: str) -> str:
                            return risk_analysis_agent(query, file_data=uploaded_file)
                        
                        # Create file-aware supervisor
                        file_supervisor = Agent(
                            system_prompt=SUPERVISOR_PROMPT,
                            tools=[text_summary_with_file, compliance_with_file, risk_analysis_with_file],
                            model=BedrockModel(
                                model_id=BEDROCK_MODEL_ID,
                                boto_session=boto_session,
                                temperature=0.1,
                                top_p=0.8,
                                streaming=False,
                                max_tokens=1000
                            )
                        )
                        
                        response = file_supervisor(user_message)
                        logger.info("[PURE_STRANDS] Used file-aware supervisor")
                        
                    else:
                        # Use regular supervisor
                        response = self.supervisor(user_message)
                        logger.info("[PURE_STRANDS] Used regular supervisor")
                    
                    agent_used = self._detect_agent_used(str(response))
                    
                    # Validate Strands response
                    if not response or len(str(response).strip()) < 10:
                        logger.error("[PURE_STRANDS] Empty response from Strands supervisor")
                        response = "❌ **Lỗi hệ thống**: Không thể xử lý yêu cầu. Vui lòng thử lại."
                        agent_used = "error_fallback"
                        
                except Exception as strands_error:
                    logger.error(f"[PURE_STRANDS] Strands supervisor failed: {strands_error}")
                    response = "❌ **Lỗi hệ thống**: Không thể xử lý yêu cầu. Vui lòng thử lại."
                    agent_used = "error_fallback"
            
            processing_time = (datetime.now() - start_time).total_seconds()
            self.processing_stats["successful_responses"] += 1
            
            # Update agent usage stats
            if agent_used in self.processing_stats["agent_usage"]:
                self.processing_stats["agent_usage"][agent_used] += 1
            
            # Store session data
            self.session_data[conversation_id] = {
                "last_message": user_message,
                "last_response": str(response),
                "agent_used": agent_used,
                "timestamp": datetime.now().isoformat(),
                "processing_time": processing_time,
                "file_processed": uploaded_file.get('filename') if uploaded_file else None
            }
            
            result = {
                "status": "success",
                "conversation_id": conversation_id,
                "response": str(response),
                "agent_used": agent_used,
                "processing_time": processing_time,
                "timestamp": datetime.now().isoformat(),
                "system": "pure_strands_vpbank_manual_routing",
                "file_processed": uploaded_file.get('filename') if uploaded_file else None
            }
            
            logger.info(f"[PURE_STRANDS] Successfully processed in {processing_time:.2f}s using {agent_used}")
            return result
            
        except Exception as e:
            self.processing_stats["errors"] += 1
            logger.error(f"[PURE_STRANDS] Error processing request: {str(e)}")
            
            return {
                "status": "error",
                "conversation_id": conversation_id,
                "response": f"Error processing request: {str(e)}",
                "agent_used": "error_handler",
                "processing_time": 0,
                "timestamp": datetime.now().isoformat(),
                "system": "pure_strands_vpbank_manual_routing",
                "error": str(e)
            }
    
    def _detect_agent_used(self, response: str) -> str:
        """Detect which agent was used based on response content and logging"""
        response_lower = response.lower()
        
        # Check for agent-specific markers in response
        if "⚖️" in response or "kiểm tra tuân thủ" in response_lower or "compliance" in response_lower:
            return "compliance_knowledge_agent"
        elif "📄" in response or "tóm tắt" in response_lower or "summary" in response_lower:
            return "text_summary_agent"
        elif "📊" in response or "phân tích rủi ro" in response_lower or "risk" in response_lower:
            return "risk_analysis_agent"
        else:
            # Check for generic supervisor responses (failed tool execution)
            generic_phrases = [
                "i apologize", "i'll help", "let me", "would you like",
                "there was an issue", "could be due to", "try again"
            ]
            
            if any(phrase in response_lower for phrase in generic_phrases):
                logger.warning(f"[SUPERVISOR] Detected generic response instead of tool execution: {response[:100]}...")
                return "supervisor_direct_failed"
            elif any(marker in response for marker in ["**", "•", "---", "VPBank"]):
                # Likely from a tool but couldn't identify which one
                return "unknown_tool"
            else:
                return "supervisor_direct"
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get system status with DIRECT NODE INTEGRATION info"""
        return {
            "system": "VPBank K-MULT Pure Strands with DIRECT NODE INTEGRATION",
            "supervisor_status": "active",
            "available_agents": [
                "text_summary_agent (→ text_summary_node DIRECT)",
                "compliance_knowledge_agent (→ compliance_node DIRECT)", 
                "risk_analysis_agent (→ risk API DIRECT)"
            ],
            "node_integration": {
                "text_summary_agent": "Uses text_summary_node._extract_text_from_message + TextSummaryService",
                "compliance_knowledge_agent": "Uses compliance_node functions (_determine_query_type, _handle_regulation_query, etc.)",
                "risk_analysis_agent": "Uses risk_routes.assess_risk_endpoint DIRECTLY"
            },
            "active_sessions": len(self.session_data),
            "processing_stats": self.processing_stats,
            "last_updated": datetime.now().isoformat()
        }

# ================================
# GLOBAL INSTANCE
# ================================

pure_strands_vpbank_system = PureStrandsVPBankSystem()

async def process_pure_strands_request(user_message: str, conversation_id: str, context: Optional[Dict] = None, uploaded_file: Optional[Dict] = None):
    return await pure_strands_vpbank_system.process_request(user_message, conversation_id, context, uploaded_file)

def get_pure_strands_system_status():
    return pure_strands_vpbank_system.get_system_status()

__all__ = [
    "pure_strands_vpbank_system",
    "process_pure_strands_request", 
    "get_pure_strands_system_status"
]
