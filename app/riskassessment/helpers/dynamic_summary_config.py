"""
Dynamic Summary Configuration
Automatically adjust summary length based on document size
"""

import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)


class DynamicSummaryConfig:
    """Dynamically configure summary parameters based on document characteristics"""
    
    # Base ratios for different summary types
    SUMMARY_RATIOS = {
        "brief": 0.03,      # 3% of original
        "general": 0.08,    # 8% of original  
        "detailed": 0.15,   # 15% of original
        "comprehensive": 0.25  # 25% of original
    }
    
    # Minimum and maximum word limits
    MIN_SUMMARY_LENGTH = 50
    MAX_SUMMARY_LENGTH = 5000
    
    # Document size categories
    SIZE_CATEGORIES = {
        "very_short": (0, 500),      # < 500 words
        "short": (500, 2000),        # 500-2K words  
        "medium": (2000, 8000),      # 2K-8K words
        "long": (8000, 20000),       # 8K-20K words
        "very_long": (20000, float('inf'))  # 20K+ words
    }
    
    @classmethod
    def calculate_optimal_max_length(
        cls, 
        original_text: str, 
        summary_type: str = "general",
        user_max_length: int = None
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Calculate optimal max_length based on document characteristics
        
        Args:
            original_text: The original document text
            summary_type: Type of summary requested
            user_max_length: User-specified max length (optional)
            
        Returns:
            Tuple of (optimal_max_length, analysis_info)
        """
        
        # Analyze document
        word_count = len(original_text.split())
        char_count = len(original_text)
        
        # Determine document category
        doc_category = cls._categorize_document_size(word_count)
        
        # Calculate base max length using ratio
        ratio = cls.SUMMARY_RATIOS.get(summary_type, cls.SUMMARY_RATIOS["general"])
        calculated_max_length = int(word_count * ratio)
        
        # Apply bounds
        calculated_max_length = max(cls.MIN_SUMMARY_LENGTH, calculated_max_length)
        calculated_max_length = min(cls.MAX_SUMMARY_LENGTH, calculated_max_length)
        
        # Use user preference if provided and reasonable
        if user_max_length:
            if user_max_length < calculated_max_length * 0.5:
                logger.warning(f"User max_length ({user_max_length}) seems too small for document size")
            elif user_max_length > calculated_max_length * 3:
                logger.warning(f"User max_length ({user_max_length}) seems too large for document size")
            
            final_max_length = user_max_length
        else:
            final_max_length = calculated_max_length
        
        # Analysis info
        analysis = {
            "original_word_count": word_count,
            "original_char_count": char_count,
            "document_category": doc_category,
            "summary_type": summary_type,
            "calculated_max_length": calculated_max_length,
            "final_max_length": final_max_length,
            "compression_ratio": f"{final_max_length}/{word_count} = {final_max_length/word_count:.1%}",
            "recommendations": cls._get_recommendations(doc_category, summary_type)
        }
        
        logger.info(f"Dynamic config: {word_count} words → {final_max_length} max_length ({doc_category})")
        
        return final_max_length, analysis
    
    @classmethod
    def _categorize_document_size(cls, word_count: int) -> str:
        """Categorize document by size"""
        for category, (min_words, max_words) in cls.SIZE_CATEGORIES.items():
            if min_words <= word_count < max_words:
                return category
        return "very_long"
    
    @classmethod
    def _get_recommendations(cls, doc_category: str, summary_type: str) -> Dict[str, Any]:
        """Get recommendations based on document category"""
        
        recommendations = {
            "very_short": {
                "suggested_types": ["brief", "general"],
                "note": "Document ngắn, tóm tắt có thể không cần thiết"
            },
            "short": {
                "suggested_types": ["brief", "general"],
                "note": "Phù hợp cho tóm tắt ngắn gọn"
            },
            "medium": {
                "suggested_types": ["general", "detailed"],
                "note": "Kích thước vừa phải, có thể tóm tắt chi tiết"
            },
            "long": {
                "suggested_types": ["general", "detailed", "comprehensive"],
                "note": "Document dài, nên tóm tắt chi tiết để không bỏ sót thông tin"
            },
            "very_long": {
                "suggested_types": ["detailed", "comprehensive"],
                "note": "Document rất dài, cần tóm tắt toàn diện hoặc chia nhỏ"
            }
        }
        
        return recommendations.get(doc_category, {})
    
    @classmethod
    def get_suggested_max_lengths(cls, word_count: int) -> Dict[str, int]:
        """Get suggested max lengths for all summary types"""
        suggestions = {}
        
        for summary_type, ratio in cls.SUMMARY_RATIOS.items():
            calculated = int(word_count * ratio)
            calculated = max(cls.MIN_SUMMARY_LENGTH, calculated)
            calculated = min(cls.MAX_SUMMARY_LENGTH, calculated)
            suggestions[summary_type] = calculated
        
        return suggestions


# Convenience functions
def get_optimal_max_length(text: str, summary_type: str = "general", user_max_length: int = None) -> int:
    """Quick function to get optimal max length"""
    max_length, _ = DynamicSummaryConfig.calculate_optimal_max_length(
        text, summary_type, user_max_length
    )
    return max_length


def analyze_document_for_summary(text: str) -> Dict[str, Any]:
    """Analyze document and provide summary recommendations"""
    word_count = len(text.split())
    suggestions = DynamicSummaryConfig.get_suggested_max_lengths(word_count)
    category = DynamicSummaryConfig._categorize_document_size(word_count)
    
    return {
        "word_count": word_count,
        "character_count": len(text),
        "category": category,
        "suggested_max_lengths": suggestions,
        "recommendations": DynamicSummaryConfig._get_recommendations(category, "general")
    }
