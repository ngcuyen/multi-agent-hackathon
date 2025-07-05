"""
Enhanced Bedrock Service with Smart Chunking and Context Management
Optimized for large document summarization
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from app.riskassessment.services.bedrock_service import BedrockService
from app.riskassessment.helpers.smart_chunking_service import SmartChunkingService, ChunkInfo

logger = logging.getLogger(__name__)


@dataclass
class SummaryResult:
    """Result from summarization process"""
    summary: str
    chunk_summaries: List[str]
    processing_stats: Dict[str, Any]
    source_info: Dict[str, Any]


class EnhancedBedrockService:
    """
    Enhanced Bedrock service with intelligent chunking and context management
    """
    
    def __init__(self, bedrock_service: BedrockService):
        self.bedrock_service = bedrock_service
        self.chunking_service = SmartChunkingService()
        
    async def summarize_large_document(
        self,
        text: str,
        summary_type: str = "general",
        max_length: int = 300,
        language: str = "vietnamese",
        max_chunks: Optional[int] = None,
        use_parallel_processing: bool = True
    ) -> SummaryResult:
        """
        Summarize large document using intelligent chunking
        
        Args:
            text: Input text to summarize
            summary_type: Type of summary (general, bullet_points, etc.)
            max_length: Maximum length of final summary
            language: Output language
            max_chunks: Maximum number of chunks to process
            use_parallel_processing: Whether to process chunks in parallel
            
        Returns:
            SummaryResult with comprehensive information
        """
        logger.info(f"🚀 Starting large document summarization: {len(text):,} characters")
        
        # Step 1: Chunk the document
        chunks = self.chunking_service.chunk_document(
            text=text,
            preserve_structure=True,
            max_chunks=max_chunks
        )
        
        chunking_stats = self.chunking_service.get_chunking_stats(chunks)
        logger.info(f"📊 Chunking complete: {chunking_stats}")
        
        # Step 2: Process chunks
        if len(chunks) == 1:
            # Single chunk - direct processing
            logger.info("📄 Single chunk processing")
            chunk_summaries = [await self._summarize_single_chunk(
                chunks[0], summary_type, max_length, language
            )]
            final_summary = chunk_summaries[0]
        else:
            # Multiple chunks - hierarchical processing
            logger.info(f"📚 Multi-chunk processing: {len(chunks)} chunks")
            
            # Summarize individual chunks
            if use_parallel_processing and len(chunks) <= 5:
                chunk_summaries = await self._process_chunks_parallel(
                    chunks, summary_type, language
                )
            else:
                chunk_summaries = await self._process_chunks_sequential(
                    chunks, summary_type, language
                )
            
            # Create final summary from chunk summaries
            final_summary = await self._create_final_summary(
                chunk_summaries, chunks, summary_type, max_length, language
            )
        
        # Step 3: Prepare result
        processing_stats = {
            "total_chunks": len(chunks),
            "processing_method": "parallel" if use_parallel_processing and len(chunks) <= 5 else "sequential",
            "bedrock_calls": len(chunks) + (1 if len(chunks) > 1 else 0),
            "chunking_stats": chunking_stats
        }
        
        source_info = {
            "original_length": len(text),
            "final_summary_length": len(final_summary),
            "compression_ratio": len(text) / len(final_summary) if final_summary else 0,
            "chunks_processed": len(chunks)
        }
        
        logger.info(f"✅ Summarization complete: {len(final_summary)} characters")
        
        return SummaryResult(
            summary=final_summary,
            chunk_summaries=chunk_summaries,
            processing_stats=processing_stats,
            source_info=source_info
        )
    
    async def _summarize_single_chunk(
        self,
        chunk: ChunkInfo,
        summary_type: str,
        max_length: int,
        language: str
    ) -> str:
        """Summarize a single chunk"""
        prompt = self._create_chunk_summary_prompt(
            chunk, summary_type, max_length, language
        )
        
        logger.debug(f"📝 Processing chunk {chunk.chunk_id}: {chunk.char_count} chars")
        
        try:
            response = await self.bedrock_service.ai_ainvoke(prompt)
            summary = self._extract_summary_from_response(response)
            
            logger.debug(f"✅ Chunk {chunk.chunk_id} summarized: {len(summary)} chars")
            return summary
            
        except Exception as e:
            logger.error(f"❌ Error summarizing chunk {chunk.chunk_id}: {str(e)}")
            return f"[Lỗi xử lý chunk {chunk.chunk_id}: {str(e)}]"
    
    async def _process_chunks_parallel(
        self,
        chunks: List[ChunkInfo],
        summary_type: str,
        language: str
    ) -> List[str]:
        """Process chunks in parallel"""
        logger.info("⚡ Processing chunks in parallel")
        
        # Create tasks for parallel processing
        tasks = []
        for chunk in chunks:
            task = self._summarize_single_chunk(
                chunk, summary_type, 200, language  # Shorter summaries for chunks
            )
            tasks.append(task)
        
        # Execute in parallel with some concurrency control
        semaphore = asyncio.Semaphore(3)  # Limit concurrent requests
        
        async def process_with_semaphore(task):
            async with semaphore:
                return await task
        
        results = await asyncio.gather(
            *[process_with_semaphore(task) for task in tasks],
            return_exceptions=True
        )
        
        # Handle any exceptions
        chunk_summaries = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"❌ Chunk {i} failed: {str(result)}")
                chunk_summaries.append(f"[Lỗi xử lý chunk {i}: {str(result)}]")
            else:
                chunk_summaries.append(result)
        
        return chunk_summaries
    
    async def _process_chunks_sequential(
        self,
        chunks: List[ChunkInfo],
        summary_type: str,
        language: str
    ) -> List[str]:
        """Process chunks sequentially"""
        logger.info("🔄 Processing chunks sequentially")
        
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            try:
                summary = await self._summarize_single_chunk(
                    chunk, summary_type, 200, language
                )
                chunk_summaries.append(summary)
                
                # Small delay to avoid rate limiting
                if i < len(chunks) - 1:
                    await asyncio.sleep(0.5)
                    
            except Exception as e:
                logger.error(f"❌ Error processing chunk {i}: {str(e)}")
                chunk_summaries.append(f"[Lỗi xử lý chunk {i}: {str(e)}]")
        
        return chunk_summaries
    
    async def _create_final_summary(
        self,
        chunk_summaries: List[str],
        chunks: List[ChunkInfo],
        summary_type: str,
        max_length: int,
        language: str
    ) -> str:
        """Create final summary from chunk summaries"""
        logger.info("📝 Creating final summary from chunk summaries")
        
        # Combine chunk summaries
        combined_summaries = "\n\n".join([
            f"Phần {i+1}: {summary}" 
            for i, summary in enumerate(chunk_summaries)
            if summary and not summary.startswith("[Lỗi")
        ])
        
        # Create final summary prompt
        prompt = self._create_final_summary_prompt(
            combined_summaries, chunks, summary_type, max_length, language
        )
        
        try:
            response = await self.bedrock_service.ai_ainvoke(prompt)
            final_summary = self._extract_summary_from_response(response)
            
            logger.info(f"✅ Final summary created: {len(final_summary)} characters")
            return final_summary
            
        except Exception as e:
            logger.error(f"❌ Error creating final summary: {str(e)}")
            # Fallback: return combined summaries
            return combined_summaries[:max_length*5] if combined_summaries else "Không thể tạo tóm tắt cuối cùng."
    
    def _create_chunk_summary_prompt(
        self,
        chunk: ChunkInfo,
        summary_type: str,
        max_length: int,
        language: str
    ) -> str:
        """Create prompt for chunk summarization"""
        
        # Context information
        context_info = []
        if chunk.has_headers:
            context_info.append("có tiêu đề/mục lục")
        if chunk.has_tables:
            context_info.append("có bảng biểu")
        if chunk.context_overlap:
            context_info.append("có liên kết với các phần khác")
        
        context_str = f" (phần này {', '.join(context_info)})" if context_info else ""
        
        # Summary type instructions
        type_instructions = {
            "general": "tóm tắt tổng quan nội dung chính",
            "bullet_points": "liệt kê các điểm chính dưới dạng bullet points",
            "key_insights": "trích xuất những thông tin và insight quan trọng nhất",
            "executive_summary": "tóm tắt ngắn gọn dành cho lãnh đạo",
            "detailed": "tóm tắt chi tiết nhưng súc tích hơn bản gốc"
        }
        
        instruction = type_instructions.get(summary_type, "tóm tắt nội dung")
        
        prompt = f"""Bạn là một chuyên gia tóm tắt văn bản. Hãy {instruction} cho đoạn văn bản sau{context_str}.

YÊU CẦU:
- Ngôn ngữ: {language}
- Độ dài: khoảng {max_length} từ
- Giữ nguyên thông tin quan trọng và số liệu
- Đảm bảo tính chính xác và mạch lạc

{chunk.context_overlap}

NỘI DUNG CẦN TÓM TẮT:
{chunk.content}

TÓM TẮT:"""
        
        return prompt
    
    def _create_final_summary_prompt(
        self,
        combined_summaries: str,
        chunks: List[ChunkInfo],
        summary_type: str,
        max_length: int,
        language: str
    ) -> str:
        """Create prompt for final summary"""
        
        # Document characteristics
        doc_info = []
        if any(chunk.has_headers for chunk in chunks):
            doc_info.append("có cấu trúc phân mục rõ ràng")
        if any(chunk.has_tables for chunk in chunks):
            doc_info.append("chứa bảng biểu và số liệu")
        
        doc_characteristics = f" Tài liệu {', '.join(doc_info)}." if doc_info else ""
        
        type_instructions = {
            "general": "tóm tắt tổng quan toàn bộ tài liệu",
            "bullet_points": "tổng hợp thành các điểm chính dưới dạng bullet points",
            "key_insights": "tổng hợp những insight và thông tin quan trọng nhất",
            "executive_summary": "tạo bản tóm tắt điều hành ngắn gọn",
            "detailed": "tạo bản tóm tắt chi tiết nhưng súc tích"
        }
        
        instruction = type_instructions.get(summary_type, "tóm tắt toàn bộ nội dung")
        
        prompt = f"""Bạn là một chuyên gia tóm tắt văn bản. Dưới đây là các phần tóm tắt từ một tài liệu lớn gồm {len(chunks)} phần.{doc_characteristics}

Hãy {instruction} dựa trên các phần tóm tắt này:

YÊU CẦU:
- Ngôn ngữ: {language}
- Độ dài: tối đa {max_length} từ
- Tạo bản tóm tắt thống nhất, mạch lạc
- Giữ nguyên thông tin quan trọng và số liệu
- Loại bỏ thông tin trùng lặp giữa các phần

CÁC PHẦN TÓM TẮT:
{combined_summaries}

TÓM TẮT CUỐI CÙNG:"""
        
        return prompt
    
    def _extract_summary_from_response(self, response) -> str:
        """Extract summary text from Bedrock response"""
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
            return "Lỗi trích xuất kết quả từ Bedrock"
    
    def estimate_processing_time(self, text: str) -> Dict[str, Any]:
        """Estimate processing time and cost"""
        chunks = self.chunking_service.chunk_document(text, preserve_structure=True)
        stats = self.chunking_service.get_chunking_stats(chunks)
        
        # Estimate processing time (rough estimates)
        chunk_processing_time = len(chunks) * 15  # 15 seconds per chunk
        final_summary_time = 10 if len(chunks) > 1 else 0
        total_time = chunk_processing_time + final_summary_time
        
        return {
            "estimated_time_seconds": total_time,
            "estimated_time_minutes": total_time / 60,
            "bedrock_calls": len(chunks) + (1 if len(chunks) > 1 else 0),
            "chunking_stats": stats,
            "recommended_approach": "parallel" if len(chunks) <= 5 else "sequential"
        }
