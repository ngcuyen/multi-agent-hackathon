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
    
    def extract_text_from_pdf(self, pdf_bytes: bytes, max_pages: Optional[int] = None) -> Dict[str, Any]:
        """
        Extract text from PDF using lightweight OCR
        
        Args:
            pdf_bytes: PDF file content as bytes
            max_pages: Maximum number of pages to process (None = all pages)
            
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
            images = self._pdf_to_images(pdf_bytes, max_pages)
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
        return self._extract_with_tesseract(images, max_pages)
    
    def _pdf_to_images(self, pdf_bytes: bytes, max_pages: Optional[int] = None) -> List[Any]:
        """Convert PDF to images using pdf2image"""
        try:
            from pdf2image import convert_from_bytes
            
            # Prepare parameters for convert_from_bytes
            # First parameter is pdf_bytes directly, not as keyword argument
            convert_kwargs = {
                'dpi': 200,  # Lower DPI = faster processing
                'fmt': 'RGB',
                'first_page': 1
            }
            
            # Only add last_page if max_pages is specified
            if max_pages:
                convert_kwargs['last_page'] = max_pages
                logger.info(f"Converting PDF to images (max {max_pages} pages)")
            else:
                logger.info("Converting PDF to images (all pages)")
            
            # Call convert_from_bytes with pdf_bytes as first positional argument
            images = convert_from_bytes(pdf_bytes, **convert_kwargs)
            
            logger.info(f"Converted PDF to {len(images)} images")
            return images
            
        except ImportError:
            logger.error("pdf2image not available. Install with: pip install pdf2image")
            return []
        except Exception as e:
            logger.error(f"Error converting PDF to images: {str(e)}")
            return []
    
    def _extract_with_tesseract(self, images: List[Any], max_pages: Optional[int] = None) -> Dict[str, Any]:
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
            
            # Save OCR text to file for debugging
            if all_text.strip():
                self._save_ocr_text_to_file(all_text, pages_data)
            
            # Return results
            if successful_pages > 0:
                logger.info(f"✅ Tesseract OCR successful: {successful_pages}/{len(images)} pages, {len(all_text)} characters")
                return {
                    'success': True,
                    'text': all_text.strip(),
                    'pages': pages_data,
                    'engine_used': 'tesseract',
                    'successful_pages': successful_pages,
                    'total_pages': len(images),
                    'processing_info': {
                        'dpi': 200,
                        'max_pages': max_pages or 'all',
                        'languages': 'vie+eng'
                    }
                }
            else:
                return {
                    'success': False,
                    'error': 'Không thể trích xuất text từ bất kỳ trang nào',
                    'text': '',
                    'pages': pages_data,
                    'engine_used': 'tesseract'
                }
                
        except ImportError:
            return {
                'success': False,
                'error': 'pytesseract không khả dụng. Cài đặt: pip install pytesseract',
                'text': '',
                'pages': [],
                'engine_used': 'tesseract'
            }
        except Exception as e:
            logger.error(f"Tesseract OCR error: {str(e)}")
            return {
                'success': False,
                'error': f'Lỗi OCR: {str(e)}',
                'text': '',
                'pages': [],
                'engine_used': 'tesseract'
            }

    def _save_ocr_text_to_file(self, text: str, pages_data: List[Dict]):
        """
        Save OCR extracted text to logs directory for debugging
        """
        try:
            import os
            from datetime import datetime
            
            # Create logs directory if it doesn't exist (Docker path)
            logs_dir = "/app/logs"
            os.makedirs(logs_dir, exist_ok=True)
            
            # Add timestamp to filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}_ocr_extracted_text.txt"
            file_path = os.path.join(logs_dir, filename)
            
            # Save text to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write("="*80 + "\n")
                f.write(f"OCR EXTRACTED TEXT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Engine: Tesseract OCR (Vietnamese + English)\n")
                f.write("="*80 + "\n\n")
                
                # Write page-by-page breakdown
                f.write("PAGE BREAKDOWN:\n")
                f.write("-" * 40 + "\n")
                for page in pages_data:
                    f.write(f"Page {page['page_number']}: {page['char_count']} chars, {page['word_count']} words\n")
                    if 'error' in page:
                        f.write(f"  Error: {page['error']}\n")
                f.write("\n")
                
                # Write full text
                f.write("FULL EXTRACTED TEXT:\n")
                f.write("="*80 + "\n")
                f.write(text)
                f.write("\n\n" + "="*80 + "\n")
                f.write(f"Total characters: {len(text)}\n")
                f.write(f"Total words: {len(text.split())}\n")
                f.write(f"Total pages processed: {len(pages_data)}\n")
                f.write("="*80 + "\n")
            
            logger.info(f"📁 OCR extracted text saved to: {file_path}")
            
        except Exception as e:
            logger.warning(f"Failed to save OCR text to file: {e}")
    
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
def extract_text_with_lightweight_ocr(pdf_bytes: bytes, max_pages: Optional[int] = None) -> str:
    """
    Quick function to extract text using lightweight OCR
    
    Args:
        pdf_bytes: PDF file content as bytes
        max_pages: Maximum pages to process (None = all pages)
        
    Returns:
        Extracted text string
    """
    ocr = LightweightOCR()
    result = ocr.extract_text_from_pdf(pdf_bytes, max_pages)
    
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
