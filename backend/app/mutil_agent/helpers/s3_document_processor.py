"""
S3 Document Processor Helper
Specialized helper for processing documents from S3 for AI analysis
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import asyncio

from app.mutil_agent.helpers.s3_file_loader import S3FileLoader
from app.mutil_agent.helpers.s3_config import get_s3_config
from app.mutil_agent.factories.ai_model_factory import AIModelFactory
from app.mutil_agent.config import (
    CONVERSATION_CHAT_MODEL_NAME,
    CONVERSATION_CHAT_TOP_P,
    CONVERSATION_CHAT_TEMPERATURE,
)

logger = logging.getLogger(__name__)


@dataclass
class DocumentSummary:
    """Data class for document summary results"""
    file_key: str
    bucket_name: str
    file_type: str
    summary: str
    metadata: Dict[str, Any]
    processing_time: float
    error: Optional[str] = None


class S3DocumentProcessor:
    """Helper class for processing documents from S3 for AI analysis"""
    
    def __init__(self, region_name: Optional[str] = None):
        """
        Initialize the document processor
        
        Args:
            region_name: AWS region name (uses config default if not provided)
        """
        self.s3_config = get_s3_config()
        self.region_name = region_name or self.s3_config.region_name
        self.s3_loader = S3FileLoader(region_name=self.region_name)
        
    def get_supported_file_types(self) -> List[str]:
        """
        Get list of supported file types for processing
        
        Returns:
            List of supported file extensions
        """
        return ['pdf', 'txt', 'csv', 'json', 'md', 'log', 'docx']
    
    def is_file_supported(self, file_key: str) -> bool:
        """
        Check if file type is supported for processing
        
        Args:
            file_key: S3 file key
            
        Returns:
            True if file type is supported
        """
        file_extension = file_key.lower().split('.')[-1]
        return file_extension in self.get_supported_file_types()
    
    def load_document_content(self, bucket_name: str, file_key: str) -> Dict[str, Any]:
        """
        Load document content from S3 with enhanced metadata
        
        Args:
            bucket_name: S3 bucket name
            file_key: S3 file key
            
        Returns:
            Dictionary with content, metadata, and processing info
        """
        try:
            file_extension = file_key.lower().split('.')[-1]
            
            result = {
                'bucket_name': bucket_name,
                'file_key': file_key,
                'file_type': file_extension,
                'content': None,
                'metadata': {},
                'processing_info': {
                    'supported': self.is_file_supported(file_key),
                    'processed_successfully': False
                }
            }
            
            if not result['processing_info']['supported']:
                result['content'] = f"[Unsupported file type: {file_extension}]"
                return result
            
            # Load content based on file type
            if file_extension == 'pdf':
                pdf_data = self.s3_loader.load_pdf_file(bucket_name, file_key, extract_text=True)
                result['content'] = pdf_data['full_text']
                result['metadata'] = {
                    'num_pages': pdf_data['num_pages'],
                    'file_size_bytes': pdf_data['file_size_bytes'],
                    'pdf_metadata': pdf_data.get('metadata', {}),
                    'word_count': len(pdf_data['full_text'].split()) if pdf_data['full_text'] else 0
                }
                
            elif file_extension == 'csv':
                df = self.s3_loader.load_csv_file(bucket_name, file_key)
                # Create a more readable representation for AI processing
                result['content'] = f"CSV Data Summary:\n{df.describe()}\n\nFirst 10 rows:\n{df.head(10).to_string()}"
                result['metadata'] = {
                    'shape': df.shape,
                    'columns': df.columns.tolist(),
                    'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
                    'memory_usage': df.memory_usage(deep=True).sum()
                }
                
            elif file_extension == 'json':
                json_data = self.s3_loader.load_json_file(bucket_name, file_key)
                # Format JSON for better AI processing
                import json
                result['content'] = json.dumps(json_data, indent=2, ensure_ascii=False)
                result['metadata'] = {
                    'type': type(json_data).__name__,
                    'size': len(str(json_data)),
                    'keys': list(json_data.keys()) if isinstance(json_data, dict) else None
                }
                
            elif file_extension in ['txt', 'md', 'log']:
                text_content = self.s3_loader.load_text_file(bucket_name, file_key)
                result['content'] = text_content
                result['metadata'] = {
                    'character_count': len(text_content),
                    'word_count': len(text_content.split()),
                    'line_count': text_content.count('\n') + 1,
                    'encoding': 'utf-8'
                }
                
            else:
                # Try to load as text for other supported types
                text_content = self.s3_loader.load_text_file(bucket_name, file_key)
                result['content'] = text_content
                result['metadata'] = {
                    'character_count': len(text_content),
                    'word_count': len(text_content.split()),
                    'line_count': text_content.count('\n') + 1,
                    'note': f'Loaded as text file (original type: {file_extension})'
                }
            
            result['processing_info']['processed_successfully'] = True
            logger.info(f"Successfully loaded document: s3://{bucket_name}/{file_key}")
            return result
            
        except Exception as e:
            logger.error(f"Error loading document from S3: {str(e)}")
            result['content'] = f"[Error loading document: {str(e)}]"
            result['metadata'] = {'error': str(e)}
            result['processing_info']['error'] = str(e)
            return result
    
    async def summarize_document(
        self,
        bucket_name: str,
        file_key: str,
        summary_type: str = "comprehensive",
        custom_prompt: Optional[str] = None
    ) -> DocumentSummary:
        """
        Generate AI summary of document from S3
        
        Args:
            bucket_name: S3 bucket name
            file_key: S3 file key
            summary_type: Type of summary ('comprehensive', 'brief', 'key_points', 'custom')
            custom_prompt: Custom prompt for summary (used when summary_type='custom')
            
        Returns:
            DocumentSummary object with results
        """
        import time
        start_time = time.time()
        
        try:
            # Load document content
            doc_data = self.load_document_content(bucket_name, file_key)
            
            if not doc_data['processing_info']['processed_successfully']:
                return DocumentSummary(
                    file_key=file_key,
                    bucket_name=bucket_name,
                    file_type=doc_data['file_type'],
                    summary=doc_data['content'],
                    metadata=doc_data['metadata'],
                    processing_time=time.time() - start_time,
                    error=doc_data['processing_info'].get('error')
                )
            
            # Create prompt based on summary type
            if summary_type == "custom" and custom_prompt:
                analysis_prompt = custom_prompt
            else:
                analysis_prompt = self._get_summary_prompt(summary_type)
            
            # Create enhanced prompt with document content
            enhanced_prompt = f"""
Document Information:
- File: {file_key}
- Type: {doc_data['file_type']}
- Metadata: {doc_data['metadata']}

Analysis Request: {analysis_prompt}

Document Content:
{doc_data['content']}

Please provide the requested analysis of the above document.
"""
            
            # Initialize LLM and get summary
            llm = AIModelFactory.create_model_service(
                model_name=CONVERSATION_CHAT_MODEL_NAME,
                temperature=CONVERSATION_CHAT_TEMPERATURE,
                top_p=CONVERSATION_CHAT_TOP_P,
            )
            
            from langchain_core.messages import HumanMessage, SystemMessage
            
            system_prompt = "You are an expert document analyst. Provide clear, accurate, and helpful analysis of documents."
            
            output = await llm.ai_ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=enhanced_prompt)
            ])
            
            processing_time = time.time() - start_time
            
            return DocumentSummary(
                file_key=file_key,
                bucket_name=bucket_name,
                file_type=doc_data['file_type'],
                summary=output.content,
                metadata=doc_data['metadata'],
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error summarizing document: {str(e)}")
            return DocumentSummary(
                file_key=file_key,
                bucket_name=bucket_name,
                file_type="unknown",
                summary=f"Error processing document: {str(e)}",
                metadata={},
                processing_time=time.time() - start_time,
                error=str(e)
            )
    
    def _get_summary_prompt(self, summary_type: str) -> str:
        """
        Get predefined prompt based on summary type
        
        Args:
            summary_type: Type of summary requested
            
        Returns:
            Appropriate prompt for the summary type
        """
        prompts = {
            "comprehensive": "Provide a comprehensive summary of this document, including main topics, key points, important details, and conclusions.",
            "brief": "Provide a brief, concise summary of this document highlighting only the most important points.",
            "key_points": "Extract and list the key points, main arguments, or important findings from this document in bullet point format.",
            "structure": "Analyze the structure and organization of this document, describing its sections, flow, and how information is presented.",
            "insights": "Provide insights and analysis about the content, including implications, significance, and potential applications.",
        }
        
        return prompts.get(summary_type, prompts["comprehensive"])
    
    async def batch_summarize_documents(
        self,
        bucket_name: str,
        file_keys: List[str],
        summary_type: str = "brief",
        max_concurrent: int = 3
    ) -> List[DocumentSummary]:
        """
        Summarize multiple documents concurrently
        
        Args:
            bucket_name: S3 bucket name
            file_keys: List of S3 file keys
            summary_type: Type of summary for all documents
            max_concurrent: Maximum number of concurrent processing tasks
            
        Returns:
            List of DocumentSummary objects
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_single_doc(file_key: str) -> DocumentSummary:
            async with semaphore:
                return await self.summarize_document(bucket_name, file_key, summary_type)
        
        tasks = [process_single_doc(file_key) for file_key in file_keys]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append(DocumentSummary(
                    file_key=file_keys[i],
                    bucket_name=bucket_name,
                    file_type="unknown",
                    summary=f"Error processing: {str(result)}",
                    metadata={},
                    processing_time=0.0,
                    error=str(result)
                ))
            else:
                processed_results.append(result)
        
        return processed_results
    
    def list_processable_files(
        self,
        bucket_name: str,
        prefix: str = "",
        max_files: int = 100
    ) -> List[Dict[str, Any]]:
        """
        List files in S3 bucket that can be processed
        
        Args:
            bucket_name: S3 bucket name
            prefix: Prefix to filter files
            max_files: Maximum number of files to return
            
        Returns:
            List of file information for processable files
        """
        try:
            supported_extensions = self.get_supported_file_types()
            all_files = self.s3_loader.list_files(
                bucket_name=bucket_name,
                prefix=prefix,
                file_extensions=[f".{ext}" for ext in supported_extensions]
            )
            
            # Limit results and add processing info
            processable_files = []
            for file_info in all_files[:max_files]:
                file_info['processable'] = self.is_file_supported(file_info['key'])
                file_info['file_type'] = file_info['key'].lower().split('.')[-1]
                processable_files.append(file_info)
            
            logger.info(f"Found {len(processable_files)} processable files in s3://{bucket_name}/{prefix}")
            return processable_files
            
        except Exception as e:
            logger.error(f"Error listing processable files: {str(e)}")
            return []


# Convenience functions
async def quick_summarize_s3_file(
    bucket_name: str,
    file_key: str,
    summary_type: str = "comprehensive"
) -> str:
    """
    Quick function to get summary of a single S3 file
    
    Args:
        bucket_name: S3 bucket name
        file_key: S3 file key
        summary_type: Type of summary
        
    Returns:
        Summary text
    """
    processor = S3DocumentProcessor()
    result = await processor.summarize_document(bucket_name, file_key, summary_type)
    return result.summary


def get_s3_document_processor() -> S3DocumentProcessor:
    """
    Get configured S3 document processor instance
    
    Returns:
        S3DocumentProcessor instance
    """
    return S3DocumentProcessor()
