"""
Helpers module for S3 file loading utilities and PDF processing
"""

from .s3_file_loader import (
    S3FileLoader, 
    load_csv_from_s3, 
    load_pdf_from_s3,
    load_json_from_s3,
    load_text_from_s3
)
from .s3_config import S3Config, get_s3_config
from .improved_pdf_extractor import ImprovedPDFExtractor

__all__ = [
    'S3FileLoader',
    'load_csv_from_s3', 
    'load_pdf_from_s3',
    'load_json_from_s3',
    'load_text_from_s3',
    'S3Config',
    'get_s3_config',
    'ImprovedPDFExtractor'
]

def extract_text_from_docx(docx_bytes: bytes) -> str:
    try:
        from docx import Document
        from io import BytesIO
        doc = Document(BytesIO(docx_bytes))
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        return ''
