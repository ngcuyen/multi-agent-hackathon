"""
Smart Chunking Service for Large Document Processing with Bedrock
Handles intelligent text chunking while preserving context
"""

import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ChunkInfo:
    """Information about a text chunk"""
    content: str
    start_pos: int
    end_pos: int
    chunk_id: int
    word_count: int
    char_count: int
    has_headers: bool
    has_tables: bool
    context_overlap: str = ""


class SmartChunkingService:
    """
    Smart chunking service that preserves document context and structure
    """
    
    # Bedrock Claude limits (conservative estimates)
    MAX_TOKENS_CLAUDE = 200000  # Claude 3.5 Sonnet limit
    CHARS_PER_TOKEN = 4  # Conservative estimate for Vietnamese/English mix
    MAX_CHARS_PER_CHUNK = MAX_TOKENS_CLAUDE * CHARS_PER_TOKEN * 0.7  # 70% of limit for safety
    
    # Chunking parameters
    OVERLAP_SIZE = 500  # Characters to overlap between chunks
    MIN_CHUNK_SIZE = 1000  # Minimum chunk size
    PREFERRED_CHUNK_SIZE = MAX_CHARS_PER_CHUNK // 2  # Preferred chunk size
    
    def __init__(self):
        self.sentence_endings = re.compile(r'[.!?]\s+')
        self.paragraph_breaks = re.compile(r'\n\s*\n')
        self.section_headers = re.compile(r'^[\d\w\s]*[:\-]\s*', re.MULTILINE)
        
    def chunk_document(
        self, 
        text: str, 
        preserve_structure: bool = True,
        max_chunks: Optional[int] = None
    ) -> List[ChunkInfo]:
        """
        Intelligently chunk document while preserving context
        
        Args:
            text: Input text to chunk
            preserve_structure: Whether to preserve document structure
            max_chunks: Maximum number of chunks (None = no limit)
            
        Returns:
            List of ChunkInfo objects
        """
        if not text or len(text.strip()) < self.MIN_CHUNK_SIZE:
            return [ChunkInfo(
                content=text,
                start_pos=0,
                end_pos=len(text),
                chunk_id=0,
                word_count=len(text.split()),
                char_count=len(text),
                has_headers=bool(self.section_headers.search(text)),
                has_tables=self._detect_tables(text)
            )]
        
        logger.info(f"🔄 Chunking document: {len(text):,} characters")
        
        if len(text) <= self.MAX_CHARS_PER_CHUNK:
            logger.info("📄 Document fits in single chunk")
            return [ChunkInfo(
                content=text,
                start_pos=0,
                end_pos=len(text),
                chunk_id=0,
                word_count=len(text.split()),
                char_count=len(text),
                has_headers=bool(self.section_headers.search(text)),
                has_tables=self._detect_tables(text)
            )]
        
        # Choose chunking strategy
        if preserve_structure:
            chunks = self._structure_aware_chunking(text)
        else:
            chunks = self._simple_chunking(text)
        
        # Apply max_chunks limit if specified
        if max_chunks and len(chunks) > max_chunks:
            logger.warning(f"⚠️ Limiting chunks from {len(chunks)} to {max_chunks}")
            chunks = self._merge_chunks_to_limit(chunks, max_chunks)
        
        # Add context overlap
        chunks = self._add_context_overlap(chunks, text)
        
        logger.info(f"✅ Created {len(chunks)} chunks")
        for i, chunk in enumerate(chunks):
            logger.debug(f"   Chunk {i}: {chunk.char_count:,} chars, {chunk.word_count} words")
        
        return chunks
    
    def _structure_aware_chunking(self, text: str) -> List[ChunkInfo]:
        """
        Chunk text while preserving document structure
        """
        chunks = []
        
        # First, try to split by major sections
        sections = self._split_by_sections(text)
        
        current_chunk = ""
        current_start = 0
        chunk_id = 0
        
        for section_start, section_end, section_text in sections:
            # If adding this section would exceed chunk size
            if len(current_chunk) + len(section_text) > self.PREFERRED_CHUNK_SIZE:
                # Save current chunk if it has content
                if current_chunk.strip():
                    chunks.append(ChunkInfo(
                        content=current_chunk.strip(),
                        start_pos=current_start,
                        end_pos=current_start + len(current_chunk),
                        chunk_id=chunk_id,
                        word_count=len(current_chunk.split()),
                        char_count=len(current_chunk),
                        has_headers=bool(self.section_headers.search(current_chunk)),
                        has_tables=self._detect_tables(current_chunk)
                    ))
                    chunk_id += 1
                
                # Start new chunk
                current_chunk = section_text
                current_start = section_start
            else:
                # Add to current chunk
                if not current_chunk:
                    current_start = section_start
                current_chunk += section_text
        
        # Add final chunk
        if current_chunk.strip():
            chunks.append(ChunkInfo(
                content=current_chunk.strip(),
                start_pos=current_start,
                end_pos=current_start + len(current_chunk),
                chunk_id=chunk_id,
                word_count=len(current_chunk.split()),
                char_count=len(current_chunk),
                has_headers=bool(self.section_headers.search(current_chunk)),
                has_tables=self._detect_tables(current_chunk)
            ))
        
        return chunks
    
    def _simple_chunking(self, text: str) -> List[ChunkInfo]:
        """
        Simple chunking by sentences and paragraphs
        """
        chunks = []
        chunk_id = 0
        
        # Split by paragraphs first
        paragraphs = self.paragraph_breaks.split(text)
        
        current_chunk = ""
        current_start = 0
        text_pos = 0
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                text_pos += len(paragraph) + 2  # Account for paragraph breaks
                continue
            
            # If adding this paragraph would exceed chunk size
            if len(current_chunk) + len(paragraph) > self.PREFERRED_CHUNK_SIZE:
                # Try to split paragraph by sentences
                if len(paragraph) > self.PREFERRED_CHUNK_SIZE:
                    # Split long paragraph
                    sentences = self._split_by_sentences(paragraph)
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) > self.PREFERRED_CHUNK_SIZE:
                            # Save current chunk
                            if current_chunk.strip():
                                chunks.append(ChunkInfo(
                                    content=current_chunk.strip(),
                                    start_pos=current_start,
                                    end_pos=text_pos,
                                    chunk_id=chunk_id,
                                    word_count=len(current_chunk.split()),
                                    char_count=len(current_chunk),
                                    has_headers=bool(self.section_headers.search(current_chunk)),
                                    has_tables=self._detect_tables(current_chunk)
                                ))
                                chunk_id += 1
                            
                            # Start new chunk
                            current_chunk = sentence
                            current_start = text_pos
                        else:
                            current_chunk += " " + sentence if current_chunk else sentence
                else:
                    # Save current chunk and start new one with this paragraph
                    if current_chunk.strip():
                        chunks.append(ChunkInfo(
                            content=current_chunk.strip(),
                            start_pos=current_start,
                            end_pos=text_pos,
                            chunk_id=chunk_id,
                            word_count=len(current_chunk.split()),
                            char_count=len(current_chunk),
                            has_headers=bool(self.section_headers.search(current_chunk)),
                            has_tables=self._detect_tables(current_chunk)
                        ))
                        chunk_id += 1
                    
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
            chunks.append(ChunkInfo(
                content=current_chunk.strip(),
                start_pos=current_start,
                end_pos=text_pos,
                chunk_id=chunk_id,
                word_count=len(current_chunk.split()),
                char_count=len(current_chunk),
                has_headers=bool(self.section_headers.search(current_chunk)),
                has_tables=self._detect_tables(current_chunk)
            ))
        
        return chunks
    
    def _split_by_sections(self, text: str) -> List[Tuple[int, int, str]]:
        """Split text by sections (headers, numbered items, etc.)"""
        sections = []
        
        # Find section headers
        header_matches = list(self.section_headers.finditer(text))
        
        if not header_matches:
            # No clear sections, return whole text
            return [(0, len(text), text)]
        
        last_end = 0
        for match in header_matches:
            start = match.start()
            if start > last_end:
                # Add text before this header
                sections.append((last_end, start, text[last_end:start]))
            last_end = start
        
        # Add final section
        if last_end < len(text):
            sections.append((last_end, len(text), text[last_end:]))
        
        return sections
    
    def _split_by_sentences(self, text: str) -> List[str]:
        """Split text by sentences"""
        sentences = self.sentence_endings.split(text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _detect_tables(self, text: str) -> bool:
        """Detect if text contains tables"""
        # Simple heuristics for table detection
        lines = text.split('\n')
        table_indicators = 0
        
        for line in lines:
            # Check for common table patterns
            if '|' in line or '\t' in line:
                table_indicators += 1
            elif re.search(r'\s{3,}', line):  # Multiple spaces (column alignment)
                table_indicators += 1
        
        return table_indicators > len(lines) * 0.1  # 10% of lines have table indicators
    
    def _add_context_overlap(self, chunks: List[ChunkInfo], original_text: str) -> List[ChunkInfo]:
        """Add context overlap between chunks"""
        if len(chunks) <= 1:
            return chunks
        
        for i in range(len(chunks)):
            overlap_parts = []
            
            # Add context from previous chunk
            if i > 0:
                prev_chunk = chunks[i-1]
                prev_end = prev_chunk.content[-self.OVERLAP_SIZE:] if len(prev_chunk.content) > self.OVERLAP_SIZE else prev_chunk.content
                overlap_parts.append(f"[Tiếp theo từ phần trước: ...{prev_end}]")
            
            # Add context to next chunk
            if i < len(chunks) - 1:
                next_chunk = chunks[i+1]
                next_start = next_chunk.content[:self.OVERLAP_SIZE] if len(next_chunk.content) > self.OVERLAP_SIZE else next_chunk.content
                overlap_parts.append(f"[Tiếp tục ở phần sau: {next_start}...]")
            
            chunks[i].context_overlap = "\n".join(overlap_parts)
        
        return chunks
    
    def _merge_chunks_to_limit(self, chunks: List[ChunkInfo], max_chunks: int) -> List[ChunkInfo]:
        """Merge chunks to fit within limit"""
        if len(chunks) <= max_chunks:
            return chunks
        
        # Simple strategy: merge adjacent chunks
        merged = []
        chunks_per_group = len(chunks) // max_chunks
        remainder = len(chunks) % max_chunks
        
        i = 0
        group_id = 0
        
        while i < len(chunks):
            group_size = chunks_per_group + (1 if group_id < remainder else 0)
            
            # Merge chunks in this group
            group_chunks = chunks[i:i+group_size]
            merged_content = "\n\n".join(chunk.content for chunk in group_chunks)
            
            merged.append(ChunkInfo(
                content=merged_content,
                start_pos=group_chunks[0].start_pos,
                end_pos=group_chunks[-1].end_pos,
                chunk_id=group_id,
                word_count=sum(chunk.word_count for chunk in group_chunks),
                char_count=len(merged_content),
                has_headers=any(chunk.has_headers for chunk in group_chunks),
                has_tables=any(chunk.has_tables for chunk in group_chunks)
            ))
            
            i += group_size
            group_id += 1
        
        return merged
    
    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for text"""
        return len(text) // self.CHARS_PER_TOKEN
    
    def get_chunking_stats(self, chunks: List[ChunkInfo]) -> Dict[str, Any]:
        """Get statistics about chunking"""
        if not chunks:
            return {}
        
        total_chars = sum(chunk.char_count for chunk in chunks)
        total_words = sum(chunk.word_count for chunk in chunks)
        
        return {
            "total_chunks": len(chunks),
            "total_characters": total_chars,
            "total_words": total_words,
            "avg_chunk_size": total_chars // len(chunks),
            "min_chunk_size": min(chunk.char_count for chunk in chunks),
            "max_chunk_size": max(chunk.char_count for chunk in chunks),
            "chunks_with_headers": sum(1 for chunk in chunks if chunk.has_headers),
            "chunks_with_tables": sum(1 for chunk in chunks if chunk.has_tables),
            "estimated_tokens": sum(self.estimate_tokens(chunk.content) for chunk in chunks)
        }


# Convenience functions
def chunk_text_smart(text: str, max_chunks: Optional[int] = None) -> List[ChunkInfo]:
    """Convenience function for smart text chunking"""
    chunker = SmartChunkingService()
    return chunker.chunk_document(text, preserve_structure=True, max_chunks=max_chunks)


def estimate_processing_cost(text: str) -> Dict[str, Any]:
    """Estimate processing cost and requirements"""
    chunker = SmartChunkingService()
    chunks = chunker.chunk_document(text, preserve_structure=True)
    stats = chunker.get_chunking_stats(chunks)
    
    return {
        "chunking_stats": stats,
        "bedrock_calls_needed": len(chunks),
        "estimated_tokens": stats.get("estimated_tokens", 0),
        "processing_time_estimate": f"{len(chunks) * 10}-{len(chunks) * 30} seconds",
        "recommended_strategy": "parallel" if len(chunks) <= 5 else "sequential"
    }
