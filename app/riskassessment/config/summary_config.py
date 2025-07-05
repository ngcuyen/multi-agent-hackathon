"""
Configuration for text summarization
"""

import os

# Default summary settings
DEFAULT_SUMMARY_SETTINGS = {
    "max_length": {
        "brief": 100,
        "general": 300,  # Tăng từ 200 lên 300
        "detailed": 500,
        "comprehensive": 800
    },
    "summary_types": {
        "general": "Tóm tắt chung",
        "bullet_points": "Điểm chính",
        "key_insights": "Thông tin quan trọng",
        "executive_summary": "Tóm tắt điều hành",
        "detailed": "Chi tiết"
    },
    "languages": {
        "vietnamese": "vi",
        "english": "en"
    }
}

# Environment-based overrides
MAX_LENGTH_DEFAULT = int(os.getenv("SUMMARY_MAX_LENGTH", 300))
SUMMARY_TYPE_DEFAULT = os.getenv("SUMMARY_TYPE_DEFAULT", "general")
LANGUAGE_DEFAULT = os.getenv("SUMMARY_LANGUAGE_DEFAULT", "vietnamese")

def get_max_length_for_type(summary_type: str) -> int:
    """Get appropriate max length for summary type"""
    return DEFAULT_SUMMARY_SETTINGS["max_length"].get(summary_type, MAX_LENGTH_DEFAULT)

def get_available_types():
    """Get available summary types"""
    return DEFAULT_SUMMARY_SETTINGS["summary_types"]
