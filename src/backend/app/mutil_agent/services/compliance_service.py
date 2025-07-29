import os
import logging
import time
import json
import re
from typing import Optional, Dict, Any, List
from enum import Enum

from app.mutil_agent.services.bedrock_service import BedrockService
from app.mutil_agent.services.compliance_config import ComplianceConfig
from app.mutil_agent.config import (
    BEDROCK_KNOWLEDGEBASE,
    KNOWLEDGEBASE_ID,
    MODEL_MAPPING,
    CONVERSATION_CHAT_MODEL_NAME,
    CONVERSATION_CHAT_TOP_P,
    CONVERSATION_CHAT_TEMPERATURE,
    LLM_MAX_TOKENS
)

logger = logging.getLogger(__name__)


class ComplianceStatus(Enum):
    """Compliance validation status"""
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class ComplianceValidationService:
    """
    Clean and Flexible Compliance Validation Service
    Separated configuration from business logic for better maintainability
    """
    
    def __init__(self):
        """Initialize the Compliance Validation Service"""
        self.bedrock_kb_client = BEDROCK_KNOWLEDGEBASE
        self.knowledge_base_id = KNOWLEDGEBASE_ID
        self.bedrock_service = None
        self.config = ComplianceConfig()
        
        # Get model configuration
        model_name = CONVERSATION_CHAT_MODEL_NAME or "claude-37-sonnet"
        
        # Handle the specific problematic model ID directly
        if model_name == "anthropic.claude-3-5-sonnet-20241022-v2:0":
            model_name = "claude-37-sonnet"
        self.bedrock_model_id = MODEL_MAPPING.get(model_name, MODEL_MAPPING["claude-37-sonnet"])
        
        temperature = float(CONVERSATION_CHAT_TEMPERATURE or "0.6")
        top_p = float(CONVERSATION_CHAT_TOP_P or "0.6")
        max_tokens = int(LLM_MAX_TOKENS or "8192")
        
        logger.info(f"Initializing Clean Compliance Service with model: {model_name}")
        
        try:
            if model_name in MODEL_MAPPING:
                bedrock_model_id = MODEL_MAPPING[model_name]
                self.bedrock_service = BedrockService(
                    model_id=bedrock_model_id,
                    temperature=temperature,
                    top_p=top_p,
                    max_tokens=max_tokens
                )
                logger.info(f"Bedrock service initialized")
            else:
                logger.warning(f"Model {model_name} not found in MODEL_MAPPING")
                
        except Exception as e:
            logger.error(f"Error initializing Compliance Service: {e}")
            raise

    async def validate_document_compliance(
        self,
        ocr_text: str,
        document_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main compliance validation method with flexible document handling
        """
        try:
            start_time = time.time()
            logger.info("Starting flexible compliance validation")
            
            if not ocr_text or len(ocr_text.strip()) < 50:
                raise ValueError("Văn bản quá ngắn để kiểm tra tuân thủ")
            
            # Step 1: Flexible Document Classification
            if not document_type:
                document_type = await self._classify_document_flexible(ocr_text)
            
            logger.info(f"Document classified as: {document_type}")
            
            # Step 2: Check UCP applicability
            is_trade_document = self.config.is_ucp_applicable(document_type)
            
            # Step 3: Flexible Field Extraction
            extracted_fields = await self._extract_fields_flexible(ocr_text, document_type)
            
            # Step 4: Handle based on document type
            if is_trade_document:
                # Apply UCP 600 validation
                ucp_regulations = await self._query_ucp_regulations(document_type, extracted_fields)
                compliance_result = await self._validate_against_ucp(
                    ocr_text, document_type, extracted_fields, ucp_regulations
                )
            else:
                # Handle non-trade documents
                ucp_regulations = {"regulations_summary": f"Tài liệu loại '{document_type}' không thuộc phạm vi áp dụng UCP 600"}
                compliance_result = self._handle_non_trade_document(document_type, extracted_fields)
            
            processing_time = time.time() - start_time
            
            # Enhance violations with regulation references
            enhanced_violations = self._enhance_violations_with_references(
                compliance_result.get("violations", []), 
                document_type
            )
            
            # Prepare enhanced final result with detailed report
            result = {
                "compliance_status": compliance_result["status"].value,
                "confidence_score": compliance_result["confidence"],
                "document_type": document_type,
                "is_trade_document": is_trade_document,
                "extracted_fields": extracted_fields,
                "ucp_regulations_applied": ucp_regulations.get("regulations_summary", ""),
                "violations": enhanced_violations,  # Use enhanced violations
                "recommendations": compliance_result.get("recommendations", []),
                "processing_time": round(processing_time, 2),
                "timestamp": time.time(),
                "knowledge_base_used": self.knowledge_base_id,
                
                # Enhanced report sections
                "document_analysis": {
                    "classification_confidence": self._get_classification_confidence(document_type, ocr_text),
                    "document_category": self._get_document_category(document_type),
                    "applicable_regulations": self._get_applicable_regulations(document_type),
                    "required_fields": self._get_required_fields(document_type),
                    "field_completeness": self._calculate_field_completeness(document_type, extracted_fields)
                },
                
                "compliance_summary": {
                    "overall_status": compliance_result["status"].value,
                    "critical_issues": len([v for v in compliance_result.get("violations", []) if v.get("severity") == "HIGH"]),
                    "warnings": len([v for v in compliance_result.get("violations", []) if v.get("severity") == "MEDIUM"]),
                    "info_notes": len([v for v in compliance_result.get("violations", []) if v.get("severity") in ["LOW", "INFO"]]),
                    "action_required": self._determine_action_required(compliance_result)
                },
                
                "processing_details": {
                    "text_length": len(ocr_text),
                    "fields_extracted": len(extracted_fields),
                    "kb_query_performed": is_trade_document,
                    "ai_validation_used": is_trade_document,
                    "processing_method": "ucp_validation" if is_trade_document else "non_trade_handling"
                }
            }
            
            logger.info(f"Flexible compliance validation completed: {result['compliance_status']} in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"Error in flexible compliance validation: {e}")
            return {
                "compliance_status": ComplianceStatus.INSUFFICIENT_DATA.value,
                "confidence_score": 0.0,
                "document_type": document_type or "unknown",
                "is_trade_document": False,
                "error": str(e),
                "processing_time": time.time() - start_time if 'start_time' in locals() else 0,
                "timestamp": time.time()
            }

    async def _classify_document_flexible(self, text: str) -> str:
        """Flexible document classification using configurable patterns"""
        try:
            text_lower = text.lower()
            classification_scores = {}
            
            # Score each document type based on keywords and patterns
            for doc_type, config in self.config.DOCUMENT_PATTERNS.items():
                score = 0
                weight = config.get("weight", 1.0)
                
                # Keyword matching
                for keyword in config["keywords"]:
                    if keyword.lower() in text_lower:
                        score += 1
                
                # Pattern matching (higher weight)
                for pattern in config["patterns"]:
                    matches = re.findall(pattern, text_lower, re.IGNORECASE)
                    score += len(matches) * 2  # Patterns have higher weight
                
                # Apply document type weight
                if score > 0:
                    classification_scores[doc_type] = score * weight
            
            # Return the highest scoring document type
            if classification_scores:
                best_match = max(classification_scores.items(), key=lambda x: x[1])
                logger.info(f"Document classification scores: {classification_scores}")
                return best_match[0]
            
            # Fallback classification
            return "general_document"
                
        except Exception as e:
            logger.error(f"Error in flexible document classification: {e}")
            return "unknown"

    async def _extract_fields_flexible(self, text: str, document_type: str) -> Dict[str, Any]:
        """Flexible field extraction using configurable patterns"""
        try:
            fields = {}
            
            # Extract common fields using configurable patterns
            for field_type, patterns in self.config.FIELD_PATTERNS.items():
                extracted_values = []
                
                for pattern in patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    for match in matches:
                        if isinstance(match, tuple):
                            # Handle tuple matches (multiple groups)
                            if field_type == "dates":
                                # Reconstruct date from tuple
                                date_parts = [str(x) for x in match if str(x).isdigit()]
                                if len(date_parts) >= 3:
                                    date_str = '/'.join(date_parts[:3])
                                    extracted_values.append(date_str)
                            elif field_type == "amounts":
                                # Reconstruct amount from tuple
                                amount_str = ' '.join(str(x) for x in match if str(x).strip())
                                extracted_values.append(amount_str)
                            elif field_type == "reference_numbers":
                                # Take the actual number part
                                if len(match) >= 2:
                                    ref_type = match[0].strip()
                                    ref_number = match[1].strip()
                                    extracted_values.append(f"{ref_type}: {ref_number}")
                        else:
                            extracted_values.append(str(match).strip())
                
                # Store unique values, limit to reasonable number
                if extracted_values:
                    unique_values = list(dict.fromkeys(extracted_values))  # Preserve order, remove duplicates
                    fields[field_type] = unique_values[:5]  # Limit to 5 items
            
            # Extract document-specific fields
            if document_type in self.config.DOCUMENT_SPECIFIC_FIELDS:
                specific_patterns = self.config.DOCUMENT_SPECIFIC_FIELDS[document_type]
                
                for field_name, patterns in specific_patterns.items():
                    for pattern in patterns:
                        match = re.search(pattern, text, re.IGNORECASE)
                        if match:
                            # Take the last group (actual content)
                            #field_value = match.group(-1).strip()
                            try:
                                if match.groups():
                                    field_value = match.groups()[-1].strip()
                                else:
                                    field_value = match.group(0).strip()
                            except IndexError:
                                field_value = match.group(0).strip()
                            if field_value:
                                fields[field_name] = field_value
                                break  # Take first match for each field
            
            return fields
            
        except Exception as e:
            logger.error(f"Error in flexible field extraction: {e}")
            return {}

    async def query_regulations_directly(self, query: str) -> Dict[str, Any]:
        """Direct query to UCP 600 knowledge base"""
        try:
            logger.info(f"Querying UCP 600 regulations: {query[:100]}...")
            
            if not self.bedrock_kb_client or not self.knowledge_base_id:
                logger.warning("Knowledge base not configured")
                return self._get_fallback_response(query)
            
            # Build UCP-specific query
            enhanced_query = self._build_ucp_query(query)
            
            # Query knowledge base
            response = self.bedrock_kb_client.retrieve_and_generate(
                input={"text": enhanced_query},
                retrieveAndGenerateConfiguration={
                    "knowledgeBaseConfiguration": {
                        "knowledgeBaseId": self.knowledge_base_id,
                        "modelArn": self.bedrock_model_id,
                        "retrievalConfiguration": {
                            "vectorSearchConfiguration": {
                                "numberOfResults": 10,
                                "overrideSearchType": "HYBRID"
                            }
                        }
                    },
                    "type": "KNOWLEDGE_BASE",
                },
            )
            
            # Process response
            answer = response.get('output', {}).get('text', 'Không tìm thấy thông tin')
            citations = response.get('citations', [])
            
            return {
                "answer": answer,
                "sources": self._extract_sources(citations),
                "confidence": self._calculate_query_confidence(answer, citations),
                "query_used": enhanced_query,
                "knowledge_base_id": self.knowledge_base_id,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"Error in direct regulation query: {e}")
            return self._get_fallback_response(query)

    def _handle_non_trade_document(self, document_type: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Handle documents that are not subject to UCP 600"""
        
        if self.config.is_financial_document(document_type):
            return self._handle_financial_document(document_type, fields)
        elif document_type == "contract":
            return {
                "status": ComplianceStatus.REQUIRES_REVIEW,
                "confidence": 0.8,
                "violations": [
                    {
                        "type": "Document Type Not Applicable",
                        "description": "Hợp đồng không thuộc phạm vi áp dụng trực tiếp của UCP 600, trừ khi là hợp đồng liên quan đến tín dụng thư",
                        "severity": "INFO"
                    }
                ],
                "recommendations": [
                    {
                        "description": "Kiểm tra xem hợp đồng có điều khoản về tín dụng thư không. Nếu có, các điều khoản đó cần tuân thủ UCP 600",
                        "priority": "MEDIUM"
                    }
                ]
            }
        else:
            return {
                "status": ComplianceStatus.REQUIRES_REVIEW,
                "confidence": 0.7,
                "violations": [
                    {
                        "type": "Document Type Unknown",
                        "description": f"Loại tài liệu '{document_type}' cần được xác minh để áp dụng quy định phù hợp",
                        "severity": "MEDIUM"
                    }
                ],
                "recommendations": [
                    {
                        "description": "Xác định chính xác loại tài liệu để áp dụng quy định tuân thủ phù hợp",
                        "priority": "HIGH"
                    }
                ]
            }

    def _handle_financial_document(self, document_type: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Handle specific financial document types"""
        
        financial_handling = {
            "balance_sheet": {
                "confidence": 0.9,
                "regulations": "VAS 01 - Trình bày báo cáo tài chính",
                "key_requirements": ["Tổng tài sản", "Tổng nợ phải trả", "Vốn chủ sở hữu"],
                "compliance_focus": "Cấu trúc và phân loại tài sản, nợ phải trả"
            },
            "income_statement": {
                "confidence": 0.9,
                "regulations": "VAS 01 - Báo cáo kết quả kinh doanh",
                "key_requirements": ["Doanh thu", "Chi phí", "Lợi nhuận"],
                "compliance_focus": "Ghi nhận doanh thu và chi phí theo nguyên tắc phù hợp"
            },
            "cash_flow_statement": {
                "confidence": 0.85,
                "regulations": "VAS 02 - Báo cáo lưu chuyển tiền tệ",
                "key_requirements": ["Hoạt động kinh doanh", "Hoạt động đầu tư", "Hoạt động tài chính"],
                "compliance_focus": "Phân loại và trình bày lưu chuyển tiền tệ"
            },
            "audit_report": {
                "confidence": 0.95,
                "regulations": "Chuẩn mực kiểm toán Việt Nam",
                "key_requirements": ["Ý kiến kiểm toán", "Cơ sở ý kiến", "Trách nhiệm"],
                "compliance_focus": "Tuân thủ chuẩn mực kiểm toán và báo cáo"
            }
        }
        
        config = financial_handling.get(document_type, financial_handling.get("balance_sheet"))
        
        # Check field completeness
        missing_fields = []
        for req_field in config["key_requirements"]:
            if not any(req_field.lower() in str(v).lower() for v in fields.values()):
                missing_fields.append(req_field)
        
        violations = []
        recommendations = []
        
        if missing_fields:
            violations.append({
                "type": "Missing Required Information",
                "description": f"Thiếu thông tin bắt buộc: {', '.join(missing_fields)}",
                "severity": "MEDIUM"
            })
            recommendations.append({
                "description": f"Bổ sung thông tin về: {', '.join(missing_fields)}",
                "priority": "HIGH"
            })
        
        violations.append({
            "type": "Document Type Not Applicable",
            "description": f"{document_type.replace('_', ' ').title()} không thuộc phạm vi áp dụng UCP 600. Áp dụng {config['regulations']}",
            "severity": "INFO"
        })
        
        recommendations.extend([
            {
                "description": f"Kiểm tra tuân thủ {config['regulations']} cho {document_type.replace('_', ' ')}",
                "priority": "HIGH"
            },
            {
                "description": f"Tập trung vào: {config['compliance_focus']}",
                "priority": "MEDIUM"
            },
            {
                "description": "Để kiểm tra tuân thủ UCP 600, vui lòng cung cấp các chứng từ thương mại như Commercial Invoice, Bill of Lading, Letter of Credit",
                "priority": "LOW"
            }
        ])
        
        return {
            "status": ComplianceStatus.REQUIRES_REVIEW,
            "confidence": config["confidence"],
            "violations": violations,
            "recommendations": recommendations
        }

    # Helper methods (keeping existing implementation)
    async def _query_ucp_regulations(self, document_type: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Query relevant UCP 600 regulations"""
        try:
            if not self.bedrock_kb_client or not self.knowledge_base_id:
                return {"regulations_summary": f"Fallback UCP regulations for {document_type}"}
            
            # Build query based on document type
            query = self._build_regulation_query(document_type, fields)
            
            response = self.bedrock_kb_client.retrieve_and_generate(
                input={"text": query},
                retrieveAndGenerateConfiguration={
                    "knowledgeBaseConfiguration": {
                        "knowledgeBaseId": self.knowledge_base_id,
                        "modelArn": self.bedrock_model_id,
                    },
                    "type": "KNOWLEDGE_BASE",
                },
            )
            
            return {
                "regulations_summary": response.get('output', {}).get('text', ''),
                "citations": response.get('citations', [])
            }
            
        except Exception as e:
            logger.error(f"Error querying UCP regulations: {e}")
            return {"regulations_summary": f"Error querying regulations: {str(e)}"}

    async def _validate_against_ucp(
        self, 
        text: str, 
        document_type: str, 
        fields: Dict[str, Any], 
        regulations: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate document against UCP 600 using AI"""
        try:
            if not self.bedrock_service:
                raise ValueError("Bedrock service not available")
            
            # Build validation prompt
            validation_prompt = self._build_validation_prompt(text, document_type, fields, regulations)
            
            # Get AI validation
            response = await self.bedrock_service.ai_ainvoke(validation_prompt)
            validation_text = self._extract_response_content(response)
            
            # Parse validation result
            return self._parse_validation_result(validation_text)
            
        except Exception as e:
            logger.error(f"Error in UCP validation: {e}")
            return {
                "status": ComplianceStatus.INSUFFICIENT_DATA,
                "confidence": 0.0,
                "violations": [],
                "recommendations": [{"description": f"Lỗi kiểm tra: {str(e)}"}]
            }

    def _build_ucp_query(self, query: str) -> str:
        """Build enhanced query for UCP 600"""
        return f"""
Câu hỏi về UCP 600 (Uniform Customs and Practice for Documentary Credits):

{query}

Vui lòng trả lời dựa trên UCP 600 và cung cấp:
1. Điều khoản cụ thể trong UCP 600
2. Giải thích chi tiết
3. Ví dụ thực tế nếu có
4. Lưu ý quan trọng

Trả lời bằng tiếng Việt.
"""

    def _build_regulation_query(self, document_type: str, fields: Dict[str, Any]) -> str:
        """Build query for relevant regulations"""
        doc_type_queries = {
            "commercial_invoice": "UCP 600 Article 18 về Commercial Invoice và các yêu cầu",
            "letter_of_credit": "UCP 600 về Letter of Credit và các điều khoản chính",
            "bill_of_lading": "UCP 600 Article 20 về Bill of Lading",
            "bank_guarantee": "UCP 600 về Bank Guarantee và bảo lãnh",
            "insurance_certificate": "UCP 600 Article 28 về Insurance Certificate"
        }
        
        base_query = doc_type_queries.get(document_type, f"UCP 600 regulations for {document_type}")
        
        if fields:
            fields_str = ", ".join([f"{k}: {v}" for k, v in list(fields.items())[:3]])
            base_query += f". Tài liệu có thông tin: {fields_str}"
        
        return base_query

    def _build_validation_prompt(
        self, 
        text: str, 
        document_type: str, 
        fields: Dict[str, Any], 
        regulations: Dict[str, Any]
    ) -> str:
        """Build prompt for compliance validation"""
        return f"""
Bạn là chuyên gia kiểm tra tuân thủ UCP 600. Hãy phân tích tài liệu sau:

LOẠI TÀI LIỆU: {document_type}

THÔNG TIN TRÍCH XUẤT:
{json.dumps(fields, ensure_ascii=False, indent=2)}

QUY ĐỊNH UCP 600 LIÊN QUAN:
{regulations.get('regulations_summary', 'Không có quy định cụ thể')}

NỘI DUNG TÀI LIỆU:
{text[:2000]}...

Hãy đánh giá tuân thủ và trả lời theo format JSON:
{{
    "status": "COMPLIANT/NON_COMPLIANT/REQUIRES_REVIEW",
    "confidence": 0.85,
    "violations": [
        {{
            "type": "Missing Information",
            "description": "Thiếu thông tin bắt buộc",
            "severity": "HIGH"
        }}
    ],
    "recommendations": [
        {{
            "description": "Khuyến nghị cụ thể",
            "priority": "HIGH"
        }}
    ]
}}
"""

    def _parse_validation_result(self, validation_text: str) -> Dict[str, Any]:
        """Parse AI validation result"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', validation_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
                
                # Convert status string to enum
                status_str = result.get("status", "INSUFFICIENT_DATA")
                result["status"] = ComplianceStatus(status_str)
                
                return result
            
            # Fallback parsing
            return self._fallback_parse_validation(validation_text)
            
        except Exception as e:
            logger.error(f"Error parsing validation result: {e}")
            return {
                "status": ComplianceStatus.REQUIRES_REVIEW,
                "confidence": 0.5,
                "violations": [],
                "recommendations": [{"description": "Cần kiểm tra thủ công"}]
            }

    def _format_violation(self, description: str, regulation_ref: str = None, severity: str = 'MEDIUM', suggestion: str = None) -> Dict[str, Any]:
        """Format violation với regulation reference"""
        return {
            'description': description,
            'regulation_reference': regulation_ref,
            'severity': severity,
            'suggestion': suggestion
        }

    def _enhance_violations_with_references(self, violations: List[Dict], document_type: str) -> List[Dict]:
        """Enhance violations with regulation references"""
        enhanced_violations = []
        
        for violation in violations:
            enhanced_violation = violation.copy()
            
            # Add regulation reference based on violation type and document type
            if document_type in ['letter_of_credit', 'standby_letter_of_credit']:
                if 'missing' in violation.get('description', '').lower():
                    enhanced_violation['regulation_reference'] = 'UCP 600 Article 14(a) - Document Examination'
                elif 'discrepancy' in violation.get('description', '').lower():
                    enhanced_violation['regulation_reference'] = 'UCP 600 Article 16 - Discrepant Documents'
                elif 'expiry' in violation.get('description', '').lower():
                    enhanced_violation['regulation_reference'] = 'UCP 600 Article 6 - Availability, Expiry Date'
                elif 'amount' in violation.get('description', '').lower():
                    enhanced_violation['regulation_reference'] = 'UCP 600 Article 18 - Commercial Invoice'
                else:
                    enhanced_violation['regulation_reference'] = 'UCP 600 - General Compliance'
            
            # Add severity if not present
            if 'severity' not in enhanced_violation:
                enhanced_violation['severity'] = 'MEDIUM'
            
            # Add suggestion based on violation type
            if not enhanced_violation.get('suggestion'):
                if 'missing' in violation.get('description', '').lower():
                    enhanced_violation['suggestion'] = 'Bổ sung thông tin thiếu trong tài liệu'
                elif 'discrepancy' in violation.get('description', '').lower():
                    enhanced_violation['suggestion'] = 'Kiểm tra và sửa chữa các sai lệch trong tài liệu'
                elif 'expiry' in violation.get('description', '').lower():
                    enhanced_violation['suggestion'] = 'Kiểm tra ngày hết hạn và thời gian trình bày'
            
            enhanced_violations.append(enhanced_violation)
        
        return enhanced_violations

    def _fallback_parse_validation(self, text: str) -> Dict[str, Any]:
        """Fallback validation parsing"""
        text_lower = text.lower()
        
        if "compliant" in text_lower and "non" not in text_lower:
            status = ComplianceStatus.COMPLIANT
            confidence = 0.8
        elif "non_compliant" in text_lower or "không tuân thủ" in text_lower:
            status = ComplianceStatus.NON_COMPLIANT
            confidence = 0.7
        else:
            status = ComplianceStatus.REQUIRES_REVIEW
            confidence = 0.5
        
        return {
            "status": status,
            "confidence": confidence,
            "violations": [],
            "recommendations": [{"description": "Cần xem xét chi tiết"}]
        }

    def _extract_response_content(self, response) -> str:
        """Extract content from AI response"""
        try:
            if hasattr(response, 'content'):
                return response.content.strip()
            elif isinstance(response, str):
                return response.strip()
            elif isinstance(response, dict):
                return response.get('content', str(response)).strip()
            else:
                return str(response).strip()
        except Exception as e:
            logger.error(f"Error extracting response content: {e}")
            return "Error extracting response"

    def _extract_sources(self, citations: List[Dict]) -> List[str]:
        """Extract source information from citations"""
        sources = []
        try:
            for citation in citations:
                if 'retrievedReferences' in citation:
                    for ref in citation['retrievedReferences']:
                        if 'location' in ref and 's3Location' in ref['location']:
                            uri = ref['location']['s3Location'].get('uri', '')
                            if uri:
                                # Extract filename from S3 URI
                                filename = uri.split('/')[-1] if '/' in uri else uri
                                sources.append(filename)
            return sources[:5]  # Return top 5 sources
        except Exception as e:
            logger.error(f"Error extracting sources: {e}")
            return []

    def _calculate_query_confidence(self, answer: str, citations: List[Dict]) -> float:
        """Calculate confidence score for query result"""
        try:
            confidence = 0.5  # Base confidence
            
            # Increase confidence based on answer length
            if len(answer) > 100:
                confidence += 0.2
            
            # Increase confidence based on citations
            if citations:
                confidence += min(len(citations) * 0.1, 0.3)
            
            return min(confidence, 1.0)
        except:
            return 0.5

    def _get_classification_confidence(self, document_type: str, text: str) -> float:
        """Calculate classification confidence based on pattern matches"""
        try:
            if document_type not in self.config.DOCUMENT_PATTERNS:
                return 0.5
            
            config = self.config.DOCUMENT_PATTERNS[document_type]
            text_lower = text.lower()
            
            keyword_matches = sum(1 for keyword in config["keywords"] if keyword.lower() in text_lower)
            pattern_matches = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) 
                                for pattern in config["patterns"])
            
            total_possible = len(config["keywords"]) + len(config["patterns"])
            actual_matches = keyword_matches + pattern_matches
            
            confidence = min(actual_matches / total_possible, 1.0) if total_possible > 0 else 0.5
            return round(confidence, 2)
            
        except Exception as e:
            logger.error(f"Error calculating classification confidence: {e}")
            return 0.5

    def _get_document_category(self, document_type: str) -> Dict[str, Any]:
        """Get document category information"""
        categories = {
            "commercial_invoice": {
                "category": "Trade Document",
                "subcategory": "Commercial Documentation",
                "business_purpose": "Invoice for goods sold in international trade"
            },
            "letter_of_credit": {
                "category": "Trade Document", 
                "subcategory": "Payment Instrument",
                "business_purpose": "Bank guarantee for international trade payment"
            },
            "bill_of_lading": {
                "category": "Trade Document",
                "subcategory": "Transport Documentation", 
                "business_purpose": "Receipt and contract for cargo transportation"
            },
            "bank_guarantee": {
                "category": "Trade Document",
                "subcategory": "Financial Guarantee",
                "business_purpose": "Bank assurance for contract performance"
            },
            "insurance_certificate": {
                "category": "Trade Document",
                "subcategory": "Risk Management",
                "business_purpose": "Insurance coverage for traded goods"
            },
            "financial_report": {
                "category": "Financial Document",
                "subcategory": "Corporate Reporting",
                "business_purpose": "Financial performance and position reporting"
            },
            "contract": {
                "category": "Legal Document",
                "subcategory": "Commercial Agreement", 
                "business_purpose": "Legal agreement between parties"
            }
        }
        
        return categories.get(document_type, {
            "category": "General Document",
            "subcategory": "Unclassified",
            "business_purpose": "Document purpose not determined"
        })

    def _get_applicable_regulations(self, document_type: str) -> List[Dict[str, Any]]:
        """Get applicable regulations for document type"""
        if document_type in self.config.UCP_APPLICABLE_DOCUMENTS:
            ucp_articles = self.config.DOCUMENT_TYPE_DEFINITIONS.get(document_type, {}).get("ucp_articles", [])
            return [
                {
                    "regulation": "UCP 600",
                    "full_name": "Uniform Customs and Practice for Documentary Credits",
                    "applicable_articles": ucp_articles,
                    "mandatory": True,
                    "scope": "International trade finance"
                }
            ]
        elif document_type == "financial_report":
            return [
                {
                    "regulation": "VAS/IFRS",
                    "full_name": "Vietnamese Accounting Standards / International Financial Reporting Standards",
                    "applicable_articles": ["VAS 01", "VAS 21", "IFRS 1"],
                    "mandatory": True,
                    "scope": "Financial reporting standards"
                }
            ]
        elif document_type == "contract":
            return [
                {
                    "regulation": "Civil Code",
                    "full_name": "Vietnamese Civil Code",
                    "applicable_articles": ["Article 385-420"],
                    "mandatory": True,
                    "scope": "Contract law"
                }
            ]
        else:
            return [
                {
                    "regulation": "General Business Law",
                    "full_name": "Vietnamese Enterprise Law",
                    "applicable_articles": [],
                    "mandatory": False,
                    "scope": "General business operations"
                }
            ]

    def _get_required_fields(self, document_type: str) -> Dict[str, Any]:
        """Get required fields for document type"""
        required_fields = {
            "commercial_invoice": {
                "mandatory": ["invoice_number", "date", "seller", "buyer", "goods_description", "amount"],
                "optional": ["payment_terms", "shipping_terms", "lc_reference"],
                "ucp_specific": ["invoice_number", "goods_description", "amount"]
            },
            "letter_of_credit": {
                "mandatory": ["lc_number", "issue_date", "expiry_date", "applicant", "beneficiary", "amount"],
                "optional": ["available_with", "documents_required", "latest_shipment"],
                "ucp_specific": ["lc_number", "expiry_date", "amount", "documents_required"]
            },
            "bill_of_lading": {
                "mandatory": ["bl_number", "date", "shipper", "consignee", "vessel", "port_loading", "port_discharge"],
                "optional": ["notify_party", "freight_terms", "container_numbers"],
                "ucp_specific": ["bl_number", "on_board_date", "clean_receipt"]
            },
            "financial_report": {
                "mandatory": ["entity_name", "report_period", "total_assets", "total_liabilities", "equity"],
                "optional": ["auditor_opinion", "comparative_figures", "notes"],
                "ucp_specific": []
            },
            "contract": {
                "mandatory": ["contract_number", "parties", "subject_matter", "consideration", "terms"],
                "optional": ["governing_law", "dispute_resolution", "termination_clause"],
                "ucp_specific": []
            }
        }
        
        return required_fields.get(document_type, {
            "mandatory": [],
            "optional": [],
            "ucp_specific": []
        })

    def _calculate_field_completeness(self, document_type: str, extracted_fields: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate field completeness score"""
        required = self._get_required_fields(document_type)
        mandatory_fields = required.get("mandatory", [])
        
        if not mandatory_fields:
            return {
                "completeness_score": 1.0,
                "missing_mandatory": [],
                "found_fields": list(extracted_fields.keys()),
                "total_mandatory": 0,
                "found_mandatory": 0
            }
        
        # Map extracted fields to required fields (flexible matching)
        found_mandatory = []
        for field in mandatory_fields:
            # Check if field or similar field exists
            if any(field.lower() in key.lower() or key.lower() in field.lower() 
                   for key in extracted_fields.keys()):
                found_mandatory.append(field)
        
        missing_mandatory = [field for field in mandatory_fields if field not in found_mandatory]
        completeness_score = len(found_mandatory) / len(mandatory_fields) if mandatory_fields else 1.0
        
        return {
            "completeness_score": round(completeness_score, 2),
            "missing_mandatory": missing_mandatory,
            "found_fields": list(extracted_fields.keys()),
            "total_mandatory": len(mandatory_fields),
            "found_mandatory": len(found_mandatory)
        }

    def _determine_action_required(self, compliance_result: Dict[str, Any]) -> str:
        """Determine what action is required based on compliance result"""
        status = compliance_result.get("status")
        violations = compliance_result.get("violations", [])
        
        high_severity = [v for v in violations if v.get("severity") == "HIGH"]
        medium_severity = [v for v in violations if v.get("severity") == "MEDIUM"]
        
        if status == ComplianceStatus.COMPLIANT:
            return "No action required - document is compliant"
        elif status == ComplianceStatus.NON_COMPLIANT:
            if high_severity:
                return "Immediate action required - critical compliance issues found"
            else:
                return "Action required - compliance issues need to be addressed"
        elif status == ComplianceStatus.REQUIRES_REVIEW:
            if high_severity:
                return "Manual review required - potential critical issues"
            elif medium_severity:
                return "Review recommended - minor issues detected"
            else:
                return "Review for completeness - no major issues detected"
        else:
            return "Further analysis required - insufficient data for determination"

    def _get_fallback_response(self, query: str) -> Dict[str, Any]:
        """Fallback response when KB is not available"""
        return {
            "answer": f"Xin lỗi, không thể truy cập cơ sở tri thức để trả lời câu hỏi: {query}",
            "sources": [],
            "confidence": 0.0,
            "query_used": query,
            "knowledge_base_id": "not_available",
            "timestamp": time.time(),
            "is_fallback": True
        }
