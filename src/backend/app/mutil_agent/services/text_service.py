import os
import logging
import asyncio
import aiohttp
import time
from typing import Optional, Dict, Any
from io import BytesIO
import re

# Document processing libraries
try:
    import PyPDF2
    import docx
except ImportError as e:
    logging.warning(f"Document processing libraries not available: {e}")

from app.mutil_agent.services.bedrock_service import BedrockService
from app.mutil_agent.helpers.improved_pdf_extractor import ImprovedPDFExtractor
from app.mutil_agent.helpers.dynamic_summary_config import DynamicSummaryConfig

from app.mutil_agent.config import (
    BEDROCK_RT, 
    MODEL_MAPPING, 
    CONVERSATION_CHAT_MODEL_NAME,
    CONVERSATION_CHAT_TOP_P,
    CONVERSATION_CHAT_TEMPERATURE,
    LLM_MAX_TOKENS
)

logger = logging.getLogger(__name__)


class TextSummaryService:
    """
    Service for text extraction and summarization from various document formats
    """
    
    def __init__(self):
        """
        Initialize the Text Summary Service with AI models
        """
        self.bedrock_service = None
        
        # Get model configuration from environment
        model_name = CONVERSATION_CHAT_MODEL_NAME or "claude-37-sonnet"
        
        # Handle the specific problematic model ID directly
        if model_name == "anthropic.claude-3-5-sonnet-20241022-v2:0":
            model_name = "claude-37-sonnet"
            logger.info(f"Mapped problematic model ID to: {model_name}")
        
        temperature = float(CONVERSATION_CHAT_TEMPERATURE or "0.6")
        top_p = float(CONVERSATION_CHAT_TOP_P or "0.6")
        max_tokens = int(LLM_MAX_TOKENS or "8192")
        
        logger.info(f"Initializing Text Summary Service with model: {model_name}")
        
        try:
            # Initialize Bedrock service with Claude 3.7 (Primary)
            if model_name in MODEL_MAPPING:
                bedrock_model_id = MODEL_MAPPING[model_name]
                self.bedrock_service = BedrockService(
                    model_id=bedrock_model_id,
                    temperature=temperature,
                    top_p=top_p,
                    max_tokens=max_tokens
                )
                logger.info(f"✅ Initialized Bedrock service with {model_name}: {bedrock_model_id}")
            else:
                logger.warning(f"Model {model_name} not found in MODEL_MAPPING")
        except Exception as e:
            logger.warning(f"Bedrock service not available: {e}")
        

    async def summarize_text(
        self, 
        text: str, 
        summary_type: str = "general", 
        max_length: int = 3000, 
        language: str = "vietnamese",
        auto_adjust_length: bool = True
    ) -> Dict[str, Any]:
        """
        Summarize text using AI models with optimized intelligent chunking for large documents
        Performance optimized for VPBank K-MULT banking documents
        """
        try:
            # Validate input
            if not text or len(text.strip()) < 50:
                raise ValueError("Văn bản quá ngắn để tóm tắt (tối thiểu 50 ký tự)")
            
            # Clean and prepare text
            cleaned_text = self._clean_text(text)
            
            # Performance optimization: Skip expensive operations for small documents
            FAST_PROCESSING_THRESHOLD = 10000  # 10K chars - process directly without analysis
            
            if len(cleaned_text) < FAST_PROCESSING_THRESHOLD:
                # Fast path for small documents (most banking documents)
                logger.info(f"🚀 Fast processing for small document ({len(cleaned_text):,} chars)")
                return await self._summarize_direct(
                    cleaned_text, summary_type, max_length, language, None
                )
            
            # Standard processing with analysis for medium documents
            document_analysis = None
            if auto_adjust_length:
                optimal_max_length, analysis = DynamicSummaryConfig.calculate_optimal_max_length(
                    cleaned_text, summary_type, max_length
                )
                
                # Use optimal length if significantly different from user input
                if abs(optimal_max_length - max_length) > max_length * 0.5:
                    logger.info(f"Auto-adjusting max_length: {max_length} → {optimal_max_length}")
                    max_length = optimal_max_length
                
                document_analysis = analysis
            
            # Import chunking helper only when needed
            from app.mutil_agent.helpers.document_chunking_helper import DocumentChunkingHelper
            
            # Initialize chunking helper
            chunking_helper = DocumentChunkingHelper()
            
            # Smart chunking decision - now with 100K threshold (doubled from 50K)
            if chunking_helper.should_chunk_document(cleaned_text):
                logger.info(f"📚 Large document detected ({len(cleaned_text):,} chars), using optimized chunking approach")
                return await self._summarize_with_chunking(
                    cleaned_text, summary_type, max_length, language, 
                    document_analysis, chunking_helper
                )
            else:
                logger.info(f"📄 Standard document processing ({len(cleaned_text):,} chars) - skipping chunking")
                return await self._summarize_direct(
                    cleaned_text, summary_type, max_length, language, document_analysis
                )
                
        except Exception as e:
            logger.error(f"Error in text summarization: {str(e)}")
            raise

    async def _summarize_with_chunking(
        self,
        text: str,
        summary_type: str,
        max_length: int,
        language: str,
        document_analysis: Optional[Dict],
        chunking_helper
    ) -> Dict[str, Any]:
        """Summarize large document using chunking approach"""
        
        if not self.bedrock_service:
            raise ValueError("Bedrock service not available for chunked processing")
        
        start_time = time.time()
        
        # Step 1: Chunk the document
        chunking_result = chunking_helper.chunk_document(text, preserve_structure=True)
        logger.info(f"📊 Document chunked: {chunking_result.total_chunks} chunks")
        
        # Step 2: Process chunks with Bedrock
        chunk_summaries = await chunking_helper.process_chunks_with_bedrock(
            chunks=chunking_result.chunks,
            bedrock_service=self.bedrock_service,
            summary_type=summary_type,
            language=language,
            max_parallel=3
        )
        
        # Step 3: Create final summary
        if len(chunking_result.chunks) > 1:
            final_summary = await chunking_helper.create_final_summary(
                chunk_summaries=chunk_summaries,
                bedrock_service=self.bedrock_service,
                summary_type=summary_type,
                max_length=max_length,
                language=language,
                original_text_length=len(text)
            )
        else:
            # Single chunk case
            final_summary = chunk_summaries[0] if chunk_summaries else "Không thể tạo tóm tắt."
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Get processing statistics
        processing_stats = chunking_helper.get_processing_stats(chunking_result)
        processing_stats["actual_processing_time"] = round(processing_time, 2)
        processing_stats["bedrock_calls_made"] = len(chunk_summaries) + (1 if len(chunking_result.chunks) > 1 else 0)
        
        # Prepare response
        response = {
            "summary": final_summary,
            "summary_type": summary_type,
            "language": language,
            "original_length": len(text),
            "summary_length": len(final_summary),
            "compression_ratio": round(len(text) / len(final_summary), 2) if final_summary else 0,
            "word_count": {
                "original": len(text.split()),
                "summary": len(final_summary.split()) if final_summary else 0
            },
            "max_length_used": max_length,
            "processing_method": "chunked_bedrock_processing",
            "model_used": "bedrock_claude",
            "processing_time": round(processing_time, 2),
            "processing_stats": processing_stats,
            "chunk_summaries": chunk_summaries,
            "chunking_info": {
                "total_chunks": chunking_result.total_chunks,
                "avg_chunk_size": chunking_result.avg_chunk_size,
                "strategy": chunking_result.processing_strategy
            }
        }
        
        # Add document analysis if available
        if document_analysis:
            response["document_analysis"] = document_analysis
        
        logger.info(f"✅ Chunked summarization complete: {processing_time:.2f}s, {len(chunking_result.chunks)} chunks")
        return response

    async def _summarize_direct(
        self,
        text: str,
        summary_type: str,
        max_length: int,
        language: str,
        document_analysis: Optional[Dict]
    ) -> Dict[str, Any]:
        """Summarize document using direct Bedrock call (original logic)"""
        
        # Generate prompt based on summary type and language
        prompt = self._generate_summary_prompt(
            text=text,
            summary_type=summary_type,
            max_length=max_length,
            language=language
        )
        
        # Try AI services
        summary = None
        model_used = None
        start_time = time.time()
        
        # Try Bedrock first
        if self.bedrock_service:
            try:
                logger.info("🤖 Using Bedrock service for summarization")
                response = await self.bedrock_service.ai_ainvoke(prompt)
                summary = self._extract_summary_from_response(response)
                model_used = "bedrock_claude"
                logger.info(f"✅ Bedrock summarization successful: {len(summary)} characters")
            except Exception as e:
                logger.warning(f"Bedrock service failed: {str(e)}")
        
        
        
        if not summary:
            raise ValueError("Không có AI service nào khả dụng để tóm tắt")
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Prepare response
        response = {
            "summary": summary,
            "summary_type": summary_type,
            "language": language,
            "original_length": len(text),
            "summary_length": len(summary),
            "compression_ratio": round(len(text) / len(summary), 2),
            "word_count": {
                "original": len(text.split()),
                "summary": len(summary.split())
            },
            "max_length_used": max_length,
            "processing_method": "direct_ai_call",
            "model_used": model_used,
            "processing_time": round(processing_time, 2)
        }
        
        # Add document analysis if available
        if document_analysis:
            response["document_analysis"] = document_analysis
        
        logger.info(f"✅ Direct summarization complete: {processing_time:.2f}s using {model_used}")
        return response

    def _extract_summary_from_response(self, response) -> str:
        """Extract summary text from AI service response"""
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
            logger.error(f"Error extracting summary from response: {e}")
            return "Lỗi trích xuất kết quả từ AI service"

    async def extract_text_from_document(
        self, 
        file_content: bytes, 
        file_extension: str, 
        filename: str,
        max_pages: Optional[int] = None
    ) -> str:
        """
        Extract text from various document formats
        """
        try:
            if file_extension == '.txt':
                return file_content.decode('utf-8')
            
            elif file_extension == '.pdf':
                return self._extract_text_from_pdf(file_content, max_pages)
            
            elif file_extension in ['.docx', '.doc']:
                return self._extract_text_from_docx(file_content)
            
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
                
        except Exception as e:
            logger.error(f"Error extracting text from {filename}: {str(e)}")
            raise

    def _extract_text_from_pdf(self, file_content: bytes, max_pages: Optional[int] = None) -> str:
        """
        Extract text from PDF file using ImprovedPDFExtractor
        """
        try:
            extractor = ImprovedPDFExtractor()
            extraction_result = extractor.extract_text_from_pdf(file_content, max_pages=max_pages)
            
            # Extract text and source information
            extracted_text = extraction_result['text']
            source = extraction_result['source']
            method = extraction_result['method']
            
            if not extracted_text.strip():
                raise ValueError("Không thể trích xuất text từ PDF")
            
            # Save extracted text to file based on source
            if source == 'pypdf2':
                self._save_extracted_text_to_file(extracted_text, "pdf_extracted_text.txt", method)
                logger.info(f"✅ PDF extraction successful via {method}: {len(extracted_text)} characters")
            elif source == 'ocr':
                # OCR already saves its own file, just log the success
                logger.info(f"✅ PDF extraction successful via {method}: {len(extracted_text)} characters")
                logger.info("📁 OCR result already saved to ocr_extracted_text.txt")
            
            return extracted_text
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise

    def _extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(BytesIO(file_content))
            text = []
            for paragraph in doc.paragraphs:
                text.append(paragraph.text)
            return '\n'.join(text)
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            raise

    def _save_extracted_text_to_file(self, text: str, filename: str, method: str = "PDF extraction"):
        """
        Save extracted text to logs directory for debugging
        """
        try:
            from datetime import datetime
            
            # Create logs directory if it doesn't exist (Docker path)
            logs_dir = "/app/logs"
            os.makedirs(logs_dir, exist_ok=True)
            
            # Add timestamp to filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename_with_timestamp = f"{timestamp}_{filename}"
            file_path = os.path.join(logs_dir, filename_with_timestamp)
            
            # Save text to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write("="*80 + "\n")
                f.write(f"EXTRACTED TEXT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Extraction Method: {method}\n")
                f.write("="*80 + "\n\n")
                f.write(text)
                f.write("\n\n" + "="*80 + "\n")
                f.write(f"Total characters: {len(text)}\n")
                f.write(f"Total words: {len(text.split())}\n")
                f.write(f"Extraction method: {method}\n")
                f.write("="*80 + "\n")
            
            logger.info(f"📁 Extracted text saved to: {filename_with_timestamp}")
            
        except Exception as e:
            logger.warning(f"Could not save extracted text to file: {str(e)}")

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters that might interfere
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\'\/\\\n]', '', text)
        return text.strip()

    def _generate_summary_prompt(
        self, 
        text: str, 
        summary_type: str, 
        max_length: int, 
        language: str
    ) -> str:
        """Generate prompt for summarization based on type and language"""
        
        # Summary type instructions
        type_instructions = {
            "general": "tóm tắt tổng quan nội dung chính",
            "bullet_points": "liệt kê các điểm chính dưới dạng bullet points",
            "key_insights": "trích xuất những thông tin và insight quan trọng nhất",
            "executive_summary": "tóm tắt ngắn gọn dành cho lãnh đạo",
            "detailed": "tóm tắt chi tiết nhưng súc tích hơn bản gốc"
        }
        
        instruction = type_instructions.get(summary_type, "tóm tắt nội dung")
        
        prompt = f"""Bạn là một chuyên gia tóm tắt văn bản. Hãy {instruction} cho văn bản sau.

YÊU CẦU:
- Ngôn ngữ: {language}
- Độ dài: tối đa {max_length} từ
- Giữ nguyên thông tin quan trọng và số liệu
- Đảm bảo tính chính xác và mạch lạc

NỘI DUNG CẦN TÓM TẮT:
{text}

TÓM TẮT:"""
        
        return prompt
