"""
Optimized Document Chunking Helper for VPBank K-MULT
Removed unused constants and optimized for performance
"""

import logging
import re
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    """Document chunk with metadata"""
    content: str
    chunk_id: int
    start_pos: int
    end_pos: int
    word_count: int
    char_count: int
    context_info: str = ""


@dataclass
class ChunkingResult:
    """Chunking process result"""
    chunks: List[DocumentChunk]
    total_chunks: int
    total_chars: int
    avg_chunk_size: int
    processing_strategy: str


class DocumentChunkingHelper:
    """Intelligent document chunking for VPBank K-MULT banking documents"""
    
    # Optimized constants for VPBank performance
    MAX_CHARS_PER_CHUNK = 504000  # 70% of Claude 3.5 Sonnet limit
    OVERLAP_SIZE = 300
    LARGE_DOCUMENT_THRESHOLD = 100000  # Increased from 50K for better performance
    PARALLEL_THRESHOLD = 5
    RATE_LIMIT_DELAY = 0.5
    
    def __init__(self):
        """Initialize with compiled patterns for performance"""
        self.sentence_pattern = re.compile(r'[.!?]\s+')
        self.paragraph_pattern = re.compile(r'\n\s*\n')
        self.section_pattern = re.compile(r'^[\d\w\s]*[:\-]\s*', re.MULTILINE)
        
        self.summary_instructions = {
            "general": "tóm tắt nội dung chính",
            "bullet_points": "liệt kê các điểm chính dưới dạng bullet points",
            "key_insights": "trích xuất những thông tin quan trọng nhất",
            "executive_summary": "tóm tắt ngắn gọn cho lãnh đạo",
            "detailed": "tóm tắt chi tiết nhưng súc tích"
        }
    
    def should_chunk_document(self, text: str) -> bool:
        """Check if document needs chunking"""
        return text and len(text.strip()) > self.LARGE_DOCUMENT_THRESHOLD
    
    def chunk_document(self, text: str, preserve_structure: bool = True) -> ChunkingResult:
        """Main chunking method with strategy selection"""
        if not text:
            raise ValueError("Input text cannot be empty")
        
        text = text.strip()
        
        # Single chunk for small documents
        if not self.should_chunk_document(text):
            chunk = DocumentChunk(
                content=text, chunk_id=0, start_pos=0, end_pos=len(text),
                word_count=len(text.split()), char_count=len(text),
                context_info="Single chunk"
            )
            return ChunkingResult([chunk], 1, len(text), len(text), "single_chunk")
        
        logger.info(f"📚 Chunking document: {len(text):,} chars")
        
        # Choose chunking strategy
        if preserve_structure and self._has_structure(text):
            chunks = self._chunk_by_structure(text)
            strategy = "structure_aware"
        else:
            chunks = self._chunk_by_sentences(text)
            strategy = "simple_chunking"
        
        result = ChunkingResult(
            chunks=chunks,
            total_chunks=len(chunks),
            total_chars=sum(c.char_count for c in chunks),
            avg_chunk_size=sum(c.char_count for c in chunks) // len(chunks),
            processing_strategy=strategy
        )
        
        logger.info(f"✅ Created {len(chunks)} chunks, avg: {result.avg_chunk_size:,} chars")
        return result
    
    def _has_structure(self, text: str) -> bool:
        """Quick check for document structure"""
        paragraphs = self.paragraph_pattern.split(text)
        sections = self.section_pattern.findall(text)
        return len(paragraphs) >= 3 and len(sections) >= 2
    
    def _chunk_by_structure(self, text: str) -> List[DocumentChunk]:
        """Chunk by paragraphs preserving structure"""
        chunks = []
        paragraphs = [p.strip() for p in self.paragraph_pattern.split(text) if p.strip()]
        
        current_chunk = ""
        start_pos = 0
        
        for i, paragraph in enumerate(paragraphs):
            if len(current_chunk) + len(paragraph) > self.MAX_CHARS_PER_CHUNK and current_chunk:
                # Save current chunk
                chunks.append(self._create_chunk(current_chunk, len(chunks), start_pos, "Structure"))
                current_chunk = paragraph
                start_pos = sum(len(p) for p in paragraphs[:i])
            else:
                if not current_chunk:
                    start_pos = sum(len(p) for p in paragraphs[:i])
                current_chunk = f"{current_chunk}\n\n{paragraph}" if current_chunk else paragraph
        
        # Add final chunk
        if current_chunk:
            chunks.append(self._create_chunk(current_chunk, len(chunks), start_pos, "Structure"))
        
        return chunks
    
    def _chunk_by_sentences(self, text: str) -> List[DocumentChunk]:
        """Simple sentence-based chunking"""
        chunks = []
        sentences = [s.strip() for s in self.sentence_pattern.split(text) if s.strip()]
        
        current_chunk = ""
        start_pos = 0
        
        for i, sentence in enumerate(sentences):
            if len(current_chunk) + len(sentence) > self.MAX_CHARS_PER_CHUNK and current_chunk:
                # Save current chunk
                chunks.append(self._create_chunk(current_chunk, len(chunks), start_pos, "Simple"))
                current_chunk = sentence
                start_pos = sum(len(s) for s in sentences[:i])
            else:
                if not current_chunk:
                    start_pos = sum(len(s) for s in sentences[:i])
                current_chunk = f"{current_chunk}. {sentence}" if current_chunk else sentence
        
        # Add final chunk
        if current_chunk:
            chunks.append(self._create_chunk(current_chunk, len(chunks), start_pos, "Simple"))
        
        return chunks
    
    def _create_chunk(self, content: str, chunk_id: int, start_pos: int, chunk_type: str) -> DocumentChunk:
        """Create chunk with metadata"""
        content = content.strip()
        return DocumentChunk(
            content=content,
            chunk_id=chunk_id,
            start_pos=start_pos,
            end_pos=start_pos + len(content),
            word_count=len(content.split()),
            char_count=len(content),
            context_info=f"{chunk_type} chunk {chunk_id + 1}"
        )
    
    async def process_chunks_with_bedrock(
        self,
        chunks: List[DocumentChunk],
        bedrock_service,
        summary_type: str,
        language: str,
        max_parallel: int = 3
    ) -> List[str]:
        """Process chunks with Bedrock using optimal strategy"""
        if not chunks:
            return []
        
        logger.info(f"🔄 Processing {len(chunks)} chunks")
        
        # Choose processing strategy
        if len(chunks) <= self.PARALLEL_THRESHOLD:
            return await self._process_parallel(chunks, bedrock_service, summary_type, language, max_parallel)
        else:
            return await self._process_sequential(chunks, bedrock_service, summary_type, language)
    
    async def _process_parallel(self, chunks, bedrock_service, summary_type, language, max_parallel):
        """Parallel processing with semaphore"""
        logger.info("⚡ Parallel processing")
        semaphore = asyncio.Semaphore(max_parallel)
        
        async def process_chunk(chunk):
            async with semaphore:
                try:
                    prompt = self._create_chunk_prompt(chunk, summary_type, language)
                    response = await bedrock_service.ai_ainvoke(prompt)
                    return self._extract_response_text(response)
                except Exception as e:
                    logger.error(f"❌ Chunk {chunk.chunk_id} failed: {e}")
                    return f"[Lỗi chunk {chunk.chunk_id}: {str(e)}]"
        
        tasks = [process_chunk(chunk) for chunk in chunks]
        return await asyncio.gather(*tasks, return_exceptions=False)
    
    async def _process_sequential(self, chunks, bedrock_service, summary_type, language):
        """Sequential processing with rate limiting"""
        logger.info("🔄 Sequential processing")
        results = []
        
        for i, chunk in enumerate(chunks):
            try:
                prompt = self._create_chunk_prompt(chunk, summary_type, language)
                response = await bedrock_service.ai_ainvoke(prompt)
                results.append(self._extract_response_text(response))
                
                # Rate limiting
                if i < len(chunks) - 1:
                    await asyncio.sleep(self.RATE_LIMIT_DELAY)
                    
            except Exception as e:
                logger.error(f"❌ Chunk {i} failed: {e}")
                results.append(f"[Lỗi chunk {i}: {str(e)}]")
        
        return results
    
    async def create_final_summary(
        self,
        chunk_summaries: List[str],
        bedrock_service,
        summary_type: str,
        max_length: int,
        language: str,
        original_text_length: int
    ) -> str:
        """Create final consolidated summary"""
        logger.info("📝 Creating final summary")
        
        # Filter valid summaries
        valid_summaries = [s for s in chunk_summaries if s and not s.startswith("[Lỗi")]
        
        if not valid_summaries:
            return "Không thể tạo tóm tắt do lỗi xử lý."
        
        # Combine summaries
        combined = "\n\n".join([f"Phần {i+1}: {s}" for i, s in enumerate(valid_summaries)])
        
        # Create final prompt
        prompt = self._create_final_prompt(combined, summary_type, max_length, language, len(valid_summaries), original_text_length)
        
        try:
            response = await bedrock_service.ai_ainvoke(prompt)
            final_summary = self._extract_response_text(response)
            logger.info(f"✅ Final summary: {len(final_summary)} chars")
            return final_summary
        except Exception as e:
            logger.error(f"❌ Final summary failed: {e}")
            # Fallback to combined summaries
            max_chars = max_length * 5
            return combined[:max_chars] + "..." if len(combined) > max_chars else combined
    
    def _create_chunk_prompt(self, chunk: DocumentChunk, summary_type: str, language: str) -> str:
        """Create chunk summarization prompt"""
        instruction = self.summary_instructions.get(summary_type, "tóm tắt nội dung")
        
        return f"""Bạn là chuyên gia tóm tắt. Hãy {instruction} cho phần {chunk.chunk_id + 1}:

YÊU CẦU:
- Ngôn ngữ: {language}
- Độ dài: 150-200 từ
- Giữ thông tin quan trọng và số liệu

{chunk.context_info}

NỘI DUNG:
{chunk.content}

TÓM TẮT:"""
    
    def _create_final_prompt(self, combined: str, summary_type: str, max_length: int, language: str, num_parts: int, original_length: int) -> str:
        """Create final summary prompt"""
        instruction = self.summary_instructions.get(summary_type, "tóm tắt toàn bộ")
        
        return f"""Tóm tắt cuối cùng từ {num_parts} phần ({original_length:,} ký tự):

YÊU CẦU:
- Ngôn ngữ: {language}
- Độ dài: tối đa {max_length} từ
- Thống nhất, mạch lạc
- Loại bỏ trùng lặp

{combined}

TÓM TẮT CUỐI:"""
    
    def _extract_response_text(self, response) -> str:
        """Extract text from Bedrock response"""
        try:
            if hasattr(response, 'content'):
                return response.content.strip()
            elif isinstance(response, str):
                return response.strip()
            elif isinstance(response, dict):
                return response.get('content', str(response)).strip()
            return str(response).strip()
        except Exception as e:
            logger.error(f"Response extraction error: {e}")
            return "Lỗi trích xuất response"
    
    def get_processing_stats(self, result: ChunkingResult) -> Dict[str, Any]:
        """Get processing statistics"""
        return {
            "total_chunks": result.total_chunks,
            "total_characters": result.total_chars,
            "avg_chunk_size": result.avg_chunk_size,
            "processing_strategy": result.processing_strategy,
            "estimated_bedrock_calls": result.total_chunks + 1,
            "estimated_time": f"{result.total_chunks * 8}-{result.total_chunks * 15}s",
            "parallel_processing": result.total_chunks <= self.PARALLEL_THRESHOLD,
            "optimization": "VPBank K-MULT optimized"
        }
