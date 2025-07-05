"""
Document Chunking Helper for Large Document Processing with Bedrock
Handles intelligent text chunking and result aggregation
"""

import logging
import re
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    """Represents a chunk of document text"""
    content: str
    chunk_id: int
    start_pos: int
    end_pos: int
    word_count: int
    char_count: int
    context_info: str = ""


@dataclass
class ChunkingResult:
    """Result from document chunking process"""
    chunks: List[DocumentChunk]
    total_chunks: int
    total_chars: int
    avg_chunk_size: int
    processing_strategy: str


class DocumentChunkingHelper:
    """
    Helper class for intelligent document chunking and Bedrock processing
    """
    
    # Bedrock Claude token limits (conservative)
    MAX_TOKENS_PER_REQUEST = 180000  # Conservative limit for Claude 3.5 Sonnet
    CHARS_PER_TOKEN = 4  # Estimate for Vietnamese/English mix
    MAX_CHARS_PER_CHUNK = MAX_TOKENS_PER_REQUEST * CHARS_PER_TOKEN * 0.7  # 70% safety margin
    
    # Chunking parameters
    OVERLAP_SIZE = 300  # Characters to overlap between chunks
    MIN_CHUNK_SIZE = 1000  # Minimum chunk size
    LARGE_DOCUMENT_THRESHOLD = 50000  # Threshold for chunking (50K chars)
    
    def __init__(self):
        self.sentence_pattern = re.compile(r'[.!?]\s+')
        self.paragraph_pattern = re.compile(r'\n\s*\n')
        self.section_pattern = re.compile(r'^[\d\w\s]*[:\-]\s*', re.MULTILINE)
    
    def should_chunk_document(self, text: str) -> bool:
        """
        Determine if document should be chunked based on size
        
        Args:
            text: Input text to analyze
            
        Returns:
            True if document should be chunked, False otherwise
        """
        return len(text) > self.LARGE_DOCUMENT_THRESHOLD
    
    def chunk_document(self, text: str, preserve_structure: bool = True) -> ChunkingResult:
        """
        Intelligently chunk document while preserving context
        
        Args:
            text: Input text to chunk
            preserve_structure: Whether to preserve document structure
            
        Returns:
            ChunkingResult with chunks and metadata
        """
        if not self.should_chunk_document(text):
            # Return single chunk for small documents
            chunk = DocumentChunk(
                content=text,
                chunk_id=0,
                start_pos=0,
                end_pos=len(text),
                word_count=len(text.split()),
                char_count=len(text),
                context_info="Single document chunk"
            )
            
            return ChunkingResult(
                chunks=[chunk],
                total_chunks=1,
                total_chars=len(text),
                avg_chunk_size=len(text),
                processing_strategy="single_chunk"
            )
        
        logger.info(f"📚 Chunking large document: {len(text):,} characters")
        
        if preserve_structure:
            chunks = self._structure_aware_chunking(text)
            strategy = "structure_aware"
        else:
            chunks = self._simple_chunking(text)
            strategy = "simple_chunking"
        
        # Add context overlap between chunks
        chunks = self._add_context_overlap(chunks, text)
        
        # Calculate statistics
        total_chars = sum(chunk.char_count for chunk in chunks)
        avg_chunk_size = total_chars // len(chunks) if chunks else 0
        
        result = ChunkingResult(
            chunks=chunks,
            total_chunks=len(chunks),
            total_chars=total_chars,
            avg_chunk_size=avg_chunk_size,
            processing_strategy=strategy
        )
        
        logger.info(f"✅ Created {len(chunks)} chunks, avg size: {avg_chunk_size:,} chars")
        return result
    
    def _structure_aware_chunking(self, text: str) -> List[DocumentChunk]:
        """
        Chunk text while preserving document structure
        """
        chunks = []
        
        # Split by paragraphs first
        paragraphs = self.paragraph_pattern.split(text)
        
        current_chunk = ""
        current_start = 0
        chunk_id = 0
        text_pos = 0
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                text_pos += 2  # Account for paragraph breaks
                continue
            
            # Check if adding this paragraph would exceed chunk size
            if len(current_chunk) + len(paragraph) > self.MAX_CHARS_PER_CHUNK:
                # Save current chunk if it has content
                if current_chunk.strip():
                    chunks.append(DocumentChunk(
                        content=current_chunk.strip(),
                        chunk_id=chunk_id,
                        start_pos=current_start,
                        end_pos=text_pos,
                        word_count=len(current_chunk.split()),
                        char_count=len(current_chunk),
                        context_info=f"Structure-aware chunk {chunk_id + 1}"
                    ))
                    chunk_id += 1
                
                # Start new chunk
                current_chunk = paragraph
                current_start = text_pos
            else:
                # Add to current chunk
                if not current_chunk:
                    current_start = text_pos
                current_chunk += "\n\n" + paragraph if current_chunk else paragraph
            
            text_pos += len(paragraph) + 2
        
        # Add final chunk
        if current_chunk.strip():
            chunks.append(DocumentChunk(
                content=current_chunk.strip(),
                chunk_id=chunk_id,
                start_pos=current_start,
                end_pos=text_pos,
                word_count=len(current_chunk.split()),
                char_count=len(current_chunk),
                context_info=f"Structure-aware chunk {chunk_id + 1}"
            ))
        
        return chunks
    
    def _simple_chunking(self, text: str) -> List[DocumentChunk]:
        """
        Simple chunking by character count with sentence boundaries
        """
        chunks = []
        chunk_id = 0
        
        # Split text into sentences
        sentences = self.sentence_pattern.split(text)
        
        current_chunk = ""
        current_start = 0
        text_pos = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Check if adding this sentence would exceed chunk size
            if len(current_chunk) + len(sentence) > self.MAX_CHARS_PER_CHUNK:
                # Save current chunk
                if current_chunk.strip():
                    chunks.append(DocumentChunk(
                        content=current_chunk.strip(),
                        chunk_id=chunk_id,
                        start_pos=current_start,
                        end_pos=text_pos,
                        word_count=len(current_chunk.split()),
                        char_count=len(current_chunk),
                        context_info=f"Simple chunk {chunk_id + 1}"
                    ))
                    chunk_id += 1
                
                # Start new chunk
                current_chunk = sentence
                current_start = text_pos
            else:
                # Add to current chunk
                if not current_chunk:
                    current_start = text_pos
                current_chunk += ". " + sentence if current_chunk else sentence
            
            text_pos += len(sentence) + 2
        
        # Add final chunk
        if current_chunk.strip():
            chunks.append(DocumentChunk(
                content=current_chunk.strip(),
                chunk_id=chunk_id,
                start_pos=current_start,
                end_pos=text_pos,
                word_count=len(current_chunk.split()),
                char_count=len(current_chunk),
                context_info=f"Simple chunk {chunk_id + 1}"
            ))
        
        return chunks
    
    def _add_context_overlap(self, chunks: List[DocumentChunk], original_text: str) -> List[DocumentChunk]:
        """
        Add context overlap between chunks for better continuity
        """
        if len(chunks) <= 1:
            return chunks
        
        for i, chunk in enumerate(chunks):
            context_parts = []
            
            # Add context from previous chunk
            if i > 0:
                prev_chunk = chunks[i-1]
                prev_context = prev_chunk.content[-self.OVERLAP_SIZE:] if len(prev_chunk.content) > self.OVERLAP_SIZE else prev_chunk.content
                context_parts.append(f"[Tiếp theo từ phần trước: ...{prev_context.strip()}]")
            
            # Add context to next chunk
            if i < len(chunks) - 1:
                next_chunk = chunks[i+1]
                next_context = next_chunk.content[:self.OVERLAP_SIZE] if len(next_chunk.content) > self.OVERLAP_SIZE else next_chunk.content
                context_parts.append(f"[Tiếp tục ở phần sau: {next_context.strip()}...]")
            
            # Update context info
            if context_parts:
                chunk.context_info += f" (với context: {len(context_parts)} liên kết)"
        
        return chunks
    
    async def process_chunks_with_bedrock(
        self,
        chunks: List[DocumentChunk],
        bedrock_service,
        summary_type: str,
        language: str,
        max_parallel: int = 3
    ) -> List[str]:
        """
        Process chunks with Bedrock service (parallel or sequential)
        
        Args:
            chunks: List of document chunks
            bedrock_service: Bedrock service instance
            summary_type: Type of summary to generate
            language: Output language
            max_parallel: Maximum parallel requests
            
        Returns:
            List of chunk summaries
        """
        logger.info(f"🔄 Processing {len(chunks)} chunks with Bedrock")
        
        if len(chunks) <= max_parallel:
            # Process in parallel for small number of chunks
            return await self._process_chunks_parallel(
                chunks, bedrock_service, summary_type, language, max_parallel
            )
        else:
            # Process sequentially for many chunks
            return await self._process_chunks_sequential(
                chunks, bedrock_service, summary_type, language
            )
    
    async def _process_chunks_parallel(
        self,
        chunks: List[DocumentChunk],
        bedrock_service,
        summary_type: str,
        language: str,
        max_parallel: int
    ) -> List[str]:
        """Process chunks in parallel with concurrency control"""
        logger.info("⚡ Processing chunks in parallel")
        
        semaphore = asyncio.Semaphore(max_parallel)
        
        async def process_single_chunk(chunk: DocumentChunk) -> str:
            async with semaphore:
                try:
                    prompt = self._create_chunk_prompt(chunk, summary_type, language)
                    response = await bedrock_service.ai_ainvoke(prompt)
                    summary = self._extract_text_from_response(response)
                    logger.debug(f"✅ Processed chunk {chunk.chunk_id}: {len(summary)} chars")
                    return summary
                except Exception as e:
                    logger.error(f"❌ Error processing chunk {chunk.chunk_id}: {str(e)}")
                    return f"[Lỗi xử lý chunk {chunk.chunk_id}: {str(e)}]"
        
        # Execute all chunks in parallel
        tasks = [process_single_chunk(chunk) for chunk in chunks]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
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
        chunks: List[DocumentChunk],
        bedrock_service,
        summary_type: str,
        language: str
    ) -> List[str]:
        """Process chunks sequentially to avoid rate limits"""
        logger.info("🔄 Processing chunks sequentially")
        
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            try:
                prompt = self._create_chunk_prompt(chunk, summary_type, language)
                response = await bedrock_service.ai_ainvoke(prompt)
                summary = self._extract_text_from_response(response)
                chunk_summaries.append(summary)
                
                logger.debug(f"✅ Processed chunk {i+1}/{len(chunks)}: {len(summary)} chars")
                
                # Small delay to avoid rate limiting
                if i < len(chunks) - 1:
                    await asyncio.sleep(0.5)
                    
            except Exception as e:
                logger.error(f"❌ Error processing chunk {i}: {str(e)}")
                chunk_summaries.append(f"[Lỗi xử lý chunk {i}: {str(e)}]")
        
        return chunk_summaries
    
    async def create_final_summary(
        self,
        chunk_summaries: List[str],
        bedrock_service,
        summary_type: str,
        max_length: int,
        language: str,
        original_text_length: int
    ) -> str:
        """
        Create final summary from chunk summaries
        
        Args:
            chunk_summaries: List of individual chunk summaries
            bedrock_service: Bedrock service instance
            summary_type: Type of summary
            max_length: Maximum length of final summary
            language: Output language
            original_text_length: Length of original document
            
        Returns:
            Final consolidated summary
        """
        logger.info("📝 Creating final summary from chunk summaries")
        
        # Filter out error chunks
        valid_summaries = [
            summary for summary in chunk_summaries 
            if summary and not summary.startswith("[Lỗi")
        ]
        
        if not valid_summaries:
            return "Không thể tạo tóm tắt do lỗi xử lý tất cả các phần."
        
        # Combine chunk summaries
        combined_text = "\n\n".join([
            f"Phần {i+1}: {summary}" 
            for i, summary in enumerate(valid_summaries)
        ])
        
        # Create final summary prompt
        prompt = self._create_final_summary_prompt(
            combined_text, summary_type, max_length, language, 
            len(valid_summaries), original_text_length
        )
        
        try:
            response = await bedrock_service.ai_ainvoke(prompt)
            final_summary = self._extract_text_from_response(response)
            
            logger.info(f"✅ Final summary created: {len(final_summary)} characters")
            return final_summary
            
        except Exception as e:
            logger.error(f"❌ Error creating final summary: {str(e)}")
            # Fallback: return combined summaries (truncated)
            fallback = combined_text[:max_length*5] if combined_text else "Không thể tạo tóm tắt cuối cùng."
            return fallback
    
    def _create_chunk_prompt(self, chunk: DocumentChunk, summary_type: str, language: str) -> str:
        """Create prompt for individual chunk summarization"""
        
        type_instructions = {
            "general": "tóm tắt nội dung chính",
            "bullet_points": "liệt kê các điểm chính dưới dạng bullet points",
            "key_insights": "trích xuất những thông tin quan trọng nhất",
            "executive_summary": "tóm tắt ngắn gọn cho lãnh đạo",
            "detailed": "tóm tắt chi tiết nhưng súc tích"
        }
        
        instruction = type_instructions.get(summary_type, "tóm tắt nội dung")
        
        prompt = f"""Bạn là chuyên gia tóm tắt văn bản. Hãy {instruction} cho phần văn bản sau (đây là phần {chunk.chunk_id + 1} của một tài liệu lớn).

YÊU CẦU:
- Ngôn ngữ: {language}
- Độ dài: khoảng 150-200 từ
- Tập trung vào thông tin quan trọng nhất
- Giữ nguyên số liệu và tên riêng

{chunk.context_info}

NỘI DUNG PHẦN {chunk.chunk_id + 1}:
{chunk.content}

TÓM TẮT PHẦN {chunk.chunk_id + 1}:"""
        
        return prompt
    
    def _create_final_summary_prompt(
        self, 
        combined_summaries: str, 
        summary_type: str, 
        max_length: int, 
        language: str,
        num_parts: int,
        original_length: int
    ) -> str:
        """Create prompt for final summary consolidation"""
        
        type_instructions = {
            "general": "tóm tắt tổng quan toàn bộ tài liệu",
            "bullet_points": "tổng hợp thành các điểm chính dưới dạng bullet points",
            "key_insights": "tổng hợp những insight quan trọng nhất",
            "executive_summary": "tạo bản tóm tắt điều hành",
            "detailed": "tạo bản tóm tắt chi tiết thống nhất"
        }
        
        instruction = type_instructions.get(summary_type, "tóm tắt toàn bộ nội dung")
        
        prompt = f"""Bạn là chuyên gia tóm tắt văn bản. Dưới đây là tóm tắt từ {num_parts} phần của một tài liệu lớn ({original_length:,} ký tự).

Hãy {instruction} dựa trên các phần tóm tắt này:

YÊU CẦU:
- Ngôn ngữ: {language}
- Độ dài: tối đa {max_length} từ
- Tạo bản tóm tắt thống nhất, mạch lạc
- Loại bỏ thông tin trùng lặp
- Giữ nguyên thông tin quan trọng và số liệu

CÁC PHẦN ĐÃ TÓM TẮT:
{combined_summaries}

TÓM TẮT CUỐI CÙNG:"""
        
        return prompt
    
    def _extract_text_from_response(self, response) -> str:
        """Extract text from Bedrock response"""
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
            logger.error(f"Error extracting text from response: {e}")
            return "Lỗi trích xuất kết quả từ Bedrock"
    
    def get_processing_stats(self, chunking_result: ChunkingResult) -> Dict[str, Any]:
        """Get processing statistics"""
        return {
            "total_chunks": chunking_result.total_chunks,
            "total_characters": chunking_result.total_chars,
            "avg_chunk_size": chunking_result.avg_chunk_size,
            "processing_strategy": chunking_result.processing_strategy,
            "estimated_bedrock_calls": chunking_result.total_chunks + 1,  # +1 for final summary
            "estimated_processing_time": f"{chunking_result.total_chunks * 10}-{chunking_result.total_chunks * 20} seconds"
        }
