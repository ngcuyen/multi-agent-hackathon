"""
Lightweight OCR using Tesseract for Vietnamese text
Much smaller than EasyOCR (~50MB vs 500MB+)
"""

import logging
import os
from typing import Dict, Any, List, Optional
from io import BytesIO
import tempfile

logger = logging.getLogger(__name__)


class LightweightOCR:
    """Lightweight OCR using Tesseract"""
    
    def __init__(self):
        self.available = self._check_tesseract_available()
        if self.available:
            logger.info("✅ Tesseract OCR available")
        else:
            logger.warning("❌ Tesseract OCR not available")
    
    def _check_tesseract_available(self) -> bool:
        """Check if Tesseract is available"""
        try:
            import pytesseract
            from PIL import Image
            # Test if tesseract is installed
            pytesseract.get_tesseract_version()
            return True
        except (ImportError, Exception) as e:
            logger.warning(f"Tesseract not available: {e}")
            return False
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from PDF using lightweight OCR
        
        Args:
            pdf_bytes: PDF file content as bytes
            
        Returns:
            Dictionary with extracted text and metadata
        """
        
        if not self.available:
            return {
                'success': False,
                'error': 'Tesseract OCR không khả dụng. Cần cài đặt: apt-get install tesseract-ocr tesseract-ocr-vie && pip install pytesseract',
                'text': '',
                'pages': [],
                'engine_used': 'tesseract'
            }
        
        # Convert PDF to images
        try:
            images = self._pdf_to_images(pdf_bytes)
            if not images:
                return {
                    'success': False,
                    'error': 'Không thể chuyển đổi PDF thành hình ảnh',
                    'text': '',
                    'pages': [],
                    'engine_used': 'tesseract'
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Lỗi chuyển đổi PDF: {str(e)}',
                'text': '',
                'pages': [],
                'engine_used': 'tesseract'
            }
        
        # Extract text using Tesseract
        return self._extract_with_tesseract(images)
    
    def _pdf_to_images(self, pdf_bytes: bytes) -> List[Any]:
        """Convert PDF to images using pdf2image"""
        try:
            from pdf2image import convert_from_bytes
            
            # Convert with lower DPI for faster processing
            images = convert_from_bytes(
                pdf_bytes,
                dpi=200,  # Lower DPI = faster processing
                fmt='RGB',
                first_page=1,
                last_page=10  # Limit to first 10 pages for speed
            )
            
            logger.info(f"Converted PDF to {len(images)} images (max 10 pages)")
            return images
            
        except ImportError:
            logger.error("pdf2image not available. Install with: pip install pdf2image")
            return []
        except Exception as e:
            logger.error(f"Error converting PDF to images: {str(e)}")
            return []
    
    def _extract_with_tesseract(self, images: List[Any]) -> Dict[str, Any]:
        """Extract text using Tesseract OCR with Vietnamese support"""
        try:
            import pytesseract
            
            # Optimized config for Vietnamese
            # --oem 3: Use default OCR Engine Mode
            # --psm 6: Assume uniform block of text
            # -l vie+eng: Vietnamese + English languages
            config = '--oem 3 --psm 6 -l vie+eng'
            
            all_text = ""
            pages_data = []
            successful_pages = 0
            
            for page_num, image in enumerate(images):
                try:
                    # Preprocess image for better OCR (optional)
                    processed_image = self._preprocess_image(image)
                    
                    # Extract text
                    page_text = pytesseract.image_to_string(processed_image, config=config)
                    
                    # Clean up text
                    page_text = self._clean_ocr_text(page_text)
                    
                    pages_data.append({
                        'page_number': page_num + 1,
                        'text': page_text,
                        'char_count': len(page_text),
                        'word_count': len(page_text.split())
                    })
                    
                    if len(page_text.strip()) > 10:  # Only count pages with meaningful text
                        all_text += page_text + "\n\n"
                        successful_pages += 1
                    
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
                'successful_pages': successful_pages,
                'processing_info': {
                    'dpi': 200,
                    'max_pages': 10,
                    'languages': 'vie+eng'
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Tesseract error: {str(e)}',
                'text': '',
                'pages': [],
                'engine_used': 'tesseract'
            }
    
    def _preprocess_image(self, image):
        """Simple image preprocessing for better OCR"""
        try:
            from PIL import Image, ImageEnhance, ImageFilter
            
            # Convert to grayscale for better OCR
            if image.mode != 'L':
                image = image.convert('L')
            
            # Enhance contrast slightly
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            # Optional: Apply slight sharpening
            # image = image.filter(ImageFilter.SHARPEN)
            
            return image
            
        except Exception as e:
            logger.debug(f"Image preprocessing failed: {e}")
            return image  # Return original if preprocessing fails
    
    def _clean_ocr_text(self, text: str) -> str:
        """Clean OCR output text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        import re
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common OCR artifacts
        text = re.sub(r'[^\w\s\u00C0-\u1EF9.,!?;:()\-"\'%]', '', text)
        
        # Fix common Vietnamese OCR errors (optional)
        replacements = {
            'đ': 'đ',  # Normalize Vietnamese characters
            'Đ': 'Đ',
            # Add more common OCR corrections here
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text.strip()


# Convenience function
def extract_text_with_lightweight_ocr(pdf_bytes: bytes) -> str:
    """
    Quick function to extract text using lightweight OCR
    
    Args:
        pdf_bytes: PDF file content as bytes
        
    Returns:
        Extracted text string
    """
    ocr = LightweightOCR()
    result = ocr.extract_text_from_pdf(pdf_bytes)
    
    if result['success']:
        return result['text']
    else:
        raise ValueError(f"Lightweight OCR failed: {result['error']}")


# Test function
def test_lightweight_ocr(pdf_path: str):
    """Test lightweight OCR with a PDF file"""
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        return
    
    print(f"🔍 Testing Lightweight OCR with: {pdf_path}")
    
    try:
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()
        
        ocr = LightweightOCR()
        result = ocr.extract_text_from_pdf(pdf_bytes)
        
        if result['success']:
            print(f"✅ OCR successful!")
            print(f"📊 Engine: {result['engine_used']}")
            print(f"📊 Total pages: {result['total_pages']}")
            print(f"📊 Successful pages: {result['successful_pages']}")
            print(f"📊 Text length: {len(result['text']):,} characters")
            print(f"📊 Word count: {len(result['text'].split()):,}")
            
            # Show first 300 characters
            print(f"\n📄 First 300 characters:")
            print("-" * 50)
            print(result['text'][:300])
            if len(result['text']) > 300:
                print("...")
            print("-" * 50)
            
        else:
            print(f"❌ OCR failed: {result['error']}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        test_lightweight_ocr(sys.argv[1])
    else:
        print("Usage: python lightweight_ocr.py <pdf_file_path>")
