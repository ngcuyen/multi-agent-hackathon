"""
OCR Text Extractor for Vietnamese PDFs
Supports multiple OCR engines with fallback
"""

import logging
import os
from typing import Dict, Any, List, Optional
from io import BytesIO
import tempfile

logger = logging.getLogger(__name__)


class OCRExtractor:
    """OCR text extractor with multiple engine support"""
    
    def __init__(self):
        self.available_engines = self._check_available_engines()
        logger.info(f"Available OCR engines: {list(self.available_engines.keys())}")
    
    def _check_available_engines(self) -> Dict[str, bool]:
        """Check which OCR engines are available"""
        engines = {}
        
        # Check EasyOCR
        try:
            import easyocr
            engines['easyocr'] = True
            logger.info("✅ EasyOCR available")
        except ImportError:
            engines['easyocr'] = False
            logger.warning("❌ EasyOCR not available")
        
        # Check Tesseract
        try:
            import pytesseract
            from PIL import Image
            # Test if tesseract is installed
            pytesseract.get_tesseract_version()
            engines['tesseract'] = True
            logger.info("✅ Tesseract available")
        except (ImportError, Exception):
            engines['tesseract'] = False
            logger.warning("❌ Tesseract not available")
        
        # Check PaddleOCR
        try:
            from paddleocr import PaddleOCR
            engines['paddleocr'] = True
            logger.info("✅ PaddleOCR available")
        except ImportError:
            engines['paddleocr'] = False
            logger.warning("❌ PaddleOCR not available")
        
        return engines
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from PDF using OCR
        
        Args:
            pdf_bytes: PDF file content as bytes
            
        Returns:
            Dictionary with extracted text and metadata
        """
        
        if not any(self.available_engines.values()):
            return {
                'success': False,
                'error': 'Không có OCR engine nào khả dụng. Cần cài đặt easyocr, pytesseract hoặc paddleocr',
                'text': '',
                'pages': [],
                'engine_used': None
            }
        
        # Convert PDF to images first
        try:
            images = self._pdf_to_images(pdf_bytes)
            if not images:
                return {
                    'success': False,
                    'error': 'Không thể chuyển đổi PDF thành hình ảnh',
                    'text': '',
                    'pages': [],
                    'engine_used': None
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi chuyển đổi PDF: {str(e)}',
                'text': '',
                'pages': [],
                'engine_used': None
            }
        
        # Try OCR engines in order of preference
        engines_to_try = [
            ('easyocr', self._extract_with_easyocr),
            ('tesseract', self._extract_with_tesseract),
            ('paddleocr', self._extract_with_paddleocr)
        ]
        
        for engine_name, extract_func in engines_to_try:
            if self.available_engines.get(engine_name, False):
                try:
                    logger.info(f"Trying OCR with {engine_name}")
                    result = extract_func(images)
                    if result['success']:
                        logger.info(f"✅ OCR successful with {engine_name}: {len(result['text'])} characters")
                        return result
                    else:
                        logger.warning(f"❌ {engine_name} failed: {result.get('error', 'Unknown error')}")
                except Exception as e:
                    logger.error(f"❌ {engine_name} exception: {str(e)}")
                    continue
        
        return {
            'success': False,
            'error': 'Tất cả OCR engines đều thất bại',
            'text': '',
            'pages': [],
            'engine_used': None
        }
    
    def _pdf_to_images(self, pdf_bytes: bytes) -> List[Any]:
        """Convert PDF to images using pdf2image"""
        try:
            from pdf2image import convert_from_bytes
            
            # Convert PDF to images
            images = convert_from_bytes(
                pdf_bytes,
                dpi=300,  # High DPI for better OCR accuracy
                fmt='RGB'
            )
            
            logger.info(f"Converted PDF to {len(images)} images")
            return images
            
        except ImportError:
            logger.error("pdf2image not available. Install with: pip install pdf2image")
            return []
        except Exception as e:
            logger.error(f"Error converting PDF to images: {str(e)}")
            return []
    
    def _extract_with_easyocr(self, images: List[Any]) -> Dict[str, Any]:
        """Extract text using EasyOCR"""
        try:
            import easyocr
            
            # Initialize EasyOCR reader for Vietnamese and English
            reader = easyocr.Reader(['vi', 'en'], gpu=False)
            
            all_text = ""
            pages_data = []
            
            for page_num, image in enumerate(images):
                try:
                    # Convert PIL image to numpy array if needed
                    import numpy as np
                    if hasattr(image, 'convert'):
                        image_array = np.array(image.convert('RGB'))
                    else:
                        image_array = image
                    
                    # Extract text
                    results = reader.readtext(image_array)
                    
                    page_text = ""
                    for (bbox, text, confidence) in results:
                        if confidence > 0.5:  # Filter low confidence results
                            page_text += text + " "
                    
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': page_text.strip(),
                        'char_count': len(page_text.strip()),
                        'word_count': len(page_text.split())
                    })
                    
                    all_text += page_text + "\n"
                    
                    logger.debug(f"EasyOCR page {page_num + 1}: {len(page_text)} characters")
                    
                except Exception as e:
                    logger.warning(f"EasyOCR failed on page {page_num + 1}: {str(e)}")
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': '',
                        'char_count': 0,
                        'word_count': 0,
                        'error': str(e)
                    })
            
            return {
                'success': True,
                'text': all_text.strip(),
                'pages': pages_data,
                'engine_used': 'easyocr',
                'total_pages': len(images),
                'successful_pages': len([p for p in pages_data if p.get('char_count', 0) > 0])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'EasyOCR error: {str(e)}',
                'text': '',
                'pages': [],
                'engine_used': 'easyocr'
            }
    
    def _extract_with_tesseract(self, images: List[Any]) -> Dict[str, Any]:
        """Extract text using Tesseract OCR"""
        try:
            import pytesseract
            
            # Configure for Vietnamese
            config = '--oem 3 --psm 6 -l vie+eng'
            
            all_text = ""
            pages_data = []
            
            for page_num, image in enumerate(images):
                try:
                    # Extract text
                    page_text = pytesseract.image_to_string(image, config=config)
                    
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': page_text.strip(),
                        'char_count': len(page_text.strip()),
                        'word_count': len(page_text.split())
                    })
                    
                    all_text += page_text + "\n"
                    
                    logger.debug(f"Tesseract page {page_num + 1}: {len(page_text)} characters")
                    
                except Exception as e:
                    logger.warning(f"Tesseract failed on page {page_num + 1}: {str(e)}")
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': '',
                        'char_count': 0,
                        'word_count': 0,
                        'error': str(e)
                    })
            
            return {
                'success': True,
                'text': all_text.strip(),
                'pages': pages_data,
                'engine_used': 'tesseract',
                'total_pages': len(images),
                'successful_pages': len([p for p in pages_data if p.get('char_count', 0) > 0])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Tesseract error: {str(e)}',
                'text': '',
                'pages': [],
                'engine_used': 'tesseract'
            }
    
    def _extract_with_paddleocr(self, images: List[Any]) -> Dict[str, Any]:
        """Extract text using PaddleOCR"""
        try:
            from paddleocr import PaddleOCR
            
            # Initialize PaddleOCR
            ocr = PaddleOCR(use_angle_cls=True, lang='vi', use_gpu=False)
            
            all_text = ""
            pages_data = []
            
            for page_num, image in enumerate(images):
                try:
                    # Convert PIL image to numpy array
                    import numpy as np
                    if hasattr(image, 'convert'):
                        image_array = np.array(image.convert('RGB'))
                    else:
                        image_array = image
                    
                    # Extract text
                    results = ocr.ocr(image_array, cls=True)
                    
                    page_text = ""
                    if results and results[0]:
                        for line in results[0]:
                            if len(line) >= 2:
                                text = line[1][0]  # Extract text from result
                                confidence = line[1][1]  # Extract confidence
                                if confidence > 0.5:
                                    page_text += text + " "
                    
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': page_text.strip(),
                        'char_count': len(page_text.strip()),
                        'word_count': len(page_text.split())
                    })
                    
                    all_text += page_text + "\n"
                    
                    logger.debug(f"PaddleOCR page {page_num + 1}: {len(page_text)} characters")
                    
                except Exception as e:
                    logger.warning(f"PaddleOCR failed on page {page_num + 1}: {str(e)}")
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': '',
                        'char_count': 0,
                        'word_count': 0,
                        'error': str(e)
                    })
            
            return {
                'success': True,
                'text': all_text.strip(),
                'pages': pages_data,
                'engine_used': 'paddleocr',
                'total_pages': len(images),
                'successful_pages': len([p for p in pages_data if p.get('char_count', 0) > 0])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'PaddleOCR error: {str(e)}',
                'text': '',
                'pages': [],
                'engine_used': 'paddleocr'
            }


# Convenience function
def extract_text_from_pdf_with_ocr(pdf_bytes: bytes) -> str:
    """
    Quick function to extract text from PDF using OCR
    
    Args:
        pdf_bytes: PDF file content as bytes
        
    Returns:
        Extracted text string
    """
    extractor = OCRExtractor()
    result = extractor.extract_text_from_pdf(pdf_bytes)
    
    if result['success']:
        return result['text']
    else:
        raise ValueError(f"OCR failed: {result['error']}")
