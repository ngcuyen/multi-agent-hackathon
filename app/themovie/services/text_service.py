import os
import logging
import asyncio
import aiohttp
from typing import Optional, Dict, Any
from io import BytesIO
import re

# Document processing libraries
try:
    import PyPDF2
    import docx
    from bs4 import BeautifulSoup
    import requests
except ImportError as e:
    logging.warning(f"Some document processing libraries not available: {e}")

from app.themovie.services.openai_service import OpenAIService
from app.themovie.services.bedrock_service import BedrockService
from app.themovie.helpers.improved_pdf_extractor import ImprovedPDFExtractor
from app.themovie.helpers.dynamic_summary_config import DynamicSummaryConfig
from app.themovie.config import (
    BEDROCK_RT, 
    MODEL_MAPPING, 
    CONVERSATION_CHAT_MODEL_NAME,
    CONVERSATION_CHAT_TOP_P,
    CONVERSATION_CHAT_TEMPERATURE,
    LLM_MAX_TOKENS
)

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TextSummaryService:
    def __init__(self):
        """
        Initialize the Text Summary Service with AI models
        Uses same configuration as conversation service
        """
        self.openai_service = None
        self.bedrock_service = None
        
        # Get model configuration from environment
        model_name = CONVERSATION_CHAT_MODEL_NAME or "claude-37-sonnet"
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
        
        try:
            # Initialize OpenAI service (Fallback)
            self.openai_service = OpenAIService(
                model_id="gpt-3.5-turbo",
                temperature=temperature,
                top_p=top_p
            )
            logger.info("✅ Initialized OpenAI service as fallback")
        except Exception as e:
            logger.warning(f"OpenAI service not available: {e}")

    async def summarize_text(
        self, 
        text: str, 
        summary_type: str = "general", 
        max_length: int = 200, 
        language: str = "vietnamese",
        auto_adjust_length: bool = True
    ) -> Dict[str, Any]:
        """
        Summarize text using AI models with dynamic length adjustment
        """
        try:
            # Validate input
            if not text or len(text.strip()) < 50:
                raise ValueError("Văn bản quá ngắn để tóm tắt (tối thiểu 50 ký tự)")
            
            # Clean and prepare text
            cleaned_text = self._clean_text(text)
            
            # Auto-adjust max_length based on document size
            if auto_adjust_length:
                optimal_max_length, analysis = DynamicSummaryConfig.calculate_optimal_max_length(
                    cleaned_text, summary_type, max_length
                )
                
                # Use optimal length if significantly different from user input
                if abs(optimal_max_length - max_length) > max_length * 0.5:
                    logger.info(f"Auto-adjusting max_length: {max_length} → {optimal_max_length}")
                    max_length = optimal_max_length
                
                # Add analysis to response
                document_analysis = analysis
            else:
                document_analysis = None
            
            # Generate prompt based on summary type and language
            prompt = self._generate_summary_prompt(
                text=cleaned_text,
                summary_type=summary_type,
                max_length=max_length,
                language=language
            )
            
            # Try to get summary from available AI services
            summary = await self._get_ai_summary(prompt)
            
            # Calculate metrics
            original_length = len(text)
            summary_length = len(summary)
            compression_ratio = round(original_length / summary_length, 2) if summary_length > 0 else 0
            
            result = {
                "summary": summary,
                "summary_type": summary_type,
                "language": language,
                "original_length": original_length,
                "summary_length": summary_length,
                "compression_ratio": compression_ratio,
                "word_count": {
                    "original": len(text.split()),
                    "summary": len(summary.split())
                },
                "max_length_used": max_length
            }
            
            # Add document analysis if available
            if document_analysis:
                result["document_analysis"] = document_analysis
            
            return result
            
        except Exception as e:
            logger.error(f"Error in text summarization: {str(e)}")
            raise

    async def extract_text_from_document(
        self, 
        file_content: bytes, 
        file_extension: str, 
        filename: str
    ) -> str:
        """
        Extract text from various document formats
        """
        try:
            if file_extension == '.txt':
                return file_content.decode('utf-8')
            
            elif file_extension == '.pdf':
                return self._extract_text_from_pdf(file_content)
            
            elif file_extension in ['.docx', '.doc']:
                return self._extract_text_from_docx(file_content)
            
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
                
        except Exception as e:
            logger.error(f"Error extracting text from {filename}: {str(e)}")
            raise

    async def extract_text_from_url(self, url: str) -> str:
        """
        Extract text content from a URL
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=30) as response:
                    if response.status != 200:
                        raise ValueError(f"Không thể truy cập URL: {response.status}")
                    
                    content = await response.text()
                    
                    # Parse HTML and extract text
                    soup = BeautifulSoup(content, 'html.parser')
                    
                    # Remove script and style elements
                    for script in soup(["script", "style"]):
                        script.decompose()
                    
                    # Get text content
                    text = soup.get_text()
                    
                    # Clean up text
                    lines = (line.strip() for line in text.splitlines())
                    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                    text = ' '.join(chunk for chunk in chunks if chunk)
                    
                    if len(text) < 100:
                        raise ValueError("Không thể trích xuất đủ nội dung từ URL")
                    
                    return text
                    
        except Exception as e:
            logger.error(f"Error extracting text from URL {url}: {str(e)}")
            raise

    def _extract_text_from_pdf(self, file_content: bytes) -> str:
        """
        Extract text from PDF file using ImprovedPDFExtractor
        """
        try:
            extractor = ImprovedPDFExtractor()
            extracted_text = extractor.extract_text_from_pdf(file_content)
            
            if not extracted_text.strip():
                raise ValueError("Không thể trích xuất text từ PDF")
            
            logger.info(f"✅ PDF extraction successful: {len(extracted_text)} characters")
            return extracted_text
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise

    def _extract_text_from_docx(self, file_content: bytes) -> str:
        """
        Extract text from DOCX file
        """
        try:
            doc_file = BytesIO(file_content)
            doc = docx.Document(doc_file)
            
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            if not text.strip():
                raise ValueError("Không thể trích xuất text từ DOCX")
            
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            raise

    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize text
        """
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep Vietnamese characters
        text = re.sub(r'[^\w\s\u00C0-\u1EF9.,!?;:()\-"]', '', text)
        
        return text.strip()

    def _generate_summary_prompt(
        self, 
        text: str, 
        summary_type: str, 
        max_length: int, 
        language: str
    ) -> str:
        """
        Generate clean, direct prompt for better AI response
        """
        if language == "vietnamese":
            if summary_type == "bullet_points":
                instruction = f"Tóm tắt văn bản sau thành {max_length} từ dưới dạng các điểm chính:"
            elif summary_type == "key_insights":
                instruction = f"Trích xuất những insight quan trọng nhất từ văn bản sau trong {max_length} từ:"
            elif summary_type == "executive_summary":
                instruction = f"Viết tóm tắt điều hành ngắn gọn từ văn bản sau trong {max_length} từ:"
            elif summary_type == "detailed":
                instruction = f"Tóm tắt chi tiết văn bản sau trong {max_length} từ:"
            else:  # general
                instruction = f"Tóm tắt văn bản sau trong {max_length} từ:"
        else:  # English
            if summary_type == "bullet_points":
                instruction = f"Summarize the following text in {max_length} words as bullet points:"
            elif summary_type == "key_insights":
                instruction = f"Extract key insights from the following text in {max_length} words:"
            elif summary_type == "executive_summary":
                instruction = f"Write an executive summary of the following text in {max_length} words:"
            elif summary_type == "detailed":
                instruction = f"Provide a detailed summary of the following text in {max_length} words:"
            else:  # general
                instruction = f"Summarize the following text in {max_length} words:"
        
        # Simple, direct prompt
        prompt = f"{instruction}\n\n{text}"
        return prompt

    async def _get_ai_summary(self, prompt: str) -> str:
        """
        Get summary from available AI services with response cleaning
        Priority: Bedrock (Claude 3.7) -> OpenAI -> Extractive
        """
        try:
            # Try Bedrock (Claude 3.7) first
            if self.bedrock_service:
                try:
                    logger.info("🤖 Using Bedrock Claude 3.7 for summarization")
                    response = await self.bedrock_service.ai_ainvoke(prompt)
                    summary = self._clean_ai_response(response.content.strip(), prompt)
                    logger.info(f"✅ Bedrock summary generated: {len(summary)} chars")
                    return summary
                except Exception as e:
                    logger.warning(f"Bedrock service failed: {e}")
            
            # Try OpenAI as fallback
            if self.openai_service:
                try:
                    logger.info("🤖 Using OpenAI GPT-3.5-turbo as fallback")
                    response = await self.openai_service.ai_ainvoke(prompt)
                    summary = self._clean_ai_response(response.content.strip(), prompt)
                    logger.info(f"✅ OpenAI summary generated: {len(summary)} chars")
                    return summary
                except Exception as e:
                    logger.warning(f"OpenAI service failed: {e}")
            
            # Fallback to simple extractive summarization
            logger.info("🤖 Using extractive summarization as last resort")
            return self._simple_extractive_summary(prompt)
            
        except Exception as e:
            logger.error(f"All AI services failed: {e}")
            raise ValueError("Không thể tạo tóm tắt. Vui lòng thử lại sau.")

    def _clean_ai_response(self, response: str, original_prompt: str) -> str:
        """
        Clean AI response to extract only the summary content
        """
        try:
            # If response contains the original prompt, it's an echo - extract text only
            if len(response) > len(original_prompt) * 0.8:
                # Response is too similar to prompt, likely an echo
                logger.warning("Detected prompt echo, extracting text content")
                
                # Try to find the original text in the response
                lines = response.split('\n')
                text_lines = []
                skip_next = False
                
                for line in lines:
                    line = line.strip()
                    # Skip instruction lines
                    if any(keyword in line.lower() for keyword in ['tóm tắt', 'summarize', 'văn bản', 'yêu cầu', 'text']):
                        if len(line) < 100:  # Short instruction lines
                            continue
                    
                    # Keep content lines
                    if len(line) > 20 and not line.endswith(':'):
                        text_lines.append(line)
                
                if text_lines:
                    # Use the longest meaningful line as summary
                    response = max(text_lines, key=len)
                else:
                    # Fallback: use extractive summary
                    return self._simple_extractive_summary(response, max_sentences=2)
            
            # Clean up the response
            response = response.strip()
            
            # Remove common instruction echoes
            patterns_to_remove = [
                r'^.*?tóm tắt.*?từ[:\.]?\s*',
                r'^.*?summarize.*?words[:\.]?\s*',
                r'^.*?văn bản sau.*?[:\.]?\s*',
                r'yêu cầu:.*?$',
                r'tóm tắt:\s*$'
            ]
            
            for pattern in patterns_to_remove:
                response = re.sub(pattern, '', response, flags=re.IGNORECASE | re.MULTILINE)
            
            # Clean whitespace
            response = re.sub(r'\s+', ' ', response).strip()
            
            # If response is too short, use extractive fallback
            if len(response) < 30:
                logger.warning("Response too short after cleaning, using extractive fallback")
                return self._simple_extractive_summary(original_prompt, max_sentences=2)
            
            return response
            
        except Exception as e:
            logger.error(f"Error cleaning AI response: {e}")
            # Return extractive summary as safe fallback
            return self._simple_extractive_summary(original_prompt, max_sentences=2)

    def _simple_extractive_summary(self, input_text: str, max_sentences: int = 3) -> str:
        """
        Simple extractive summarization as fallback
        """
        try:
            # If input_text is a prompt, extract the actual text content
            text = input_text
            if '\n\n' in input_text:
                # Split by double newlines and take the longest part (likely the content)
                parts = input_text.split('\n\n')
                text = max(parts, key=len)
            
            # Clean the text
            text = re.sub(r'^\s*tóm tắt.*?:', '', text, flags=re.IGNORECASE)
            text = re.sub(r'^\s*summarize.*?:', '', text, flags=re.IGNORECASE)
            text = text.strip()
            
            # Extract sentences
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
            
            if not sentences:
                return "Không thể tạo tóm tắt từ văn bản này."
            
            if len(sentences) <= max_sentences:
                return '. '.join(sentences) + '.'
            
            # Simple scoring based on sentence length and position
            scored_sentences = []
            for i, sentence in enumerate(sentences):
                score = len(sentence.split())  # Word count
                if i < len(sentences) * 0.3:  # Early sentences get bonus
                    score *= 1.2
                scored_sentences.append((score, sentence))
            
            # Sort by score and take top sentences
            scored_sentences.sort(reverse=True)
            top_sentences = [sent for _, sent in scored_sentences[:max_sentences]]
            
            return '. '.join(top_sentences) + '.'
            
        except Exception as e:
            logger.error(f"Simple summarization failed: {e}")
            return "Không thể tạo tóm tắt từ văn bản này."


# Legacy class for backward compatibility
class TextSummary:
    def __init__(self, model_path=None):
        self.service = TextSummaryService()
        logging.warning("TextSummary class is deprecated. Use TextSummaryService instead.")