"""
Improved PDF Text Extraction with Multiple Fallback Methods
This script provides enhanced PDF text extraction with better error handling
"""

import logging
import re
from io import BytesIO
from typing import List, Callable, Tuple, Dict, Any, Optional

import PyPDF2

logger = logging.getLogger(__name__)


class ImprovedPDFExtractor:
    """Enhanced PDF text extractor with multiple fallback methods"""
    
    # Constants
    MIN_TEXT_LENGTH = 100
    METADATA_THRESHOLD = 0.7
    MAX_DIAGNOSTIC_PAGES = 3
    
    def __init__(self):
        """Initialize the PDF extractor with available extraction methods"""
        self.extraction_methods = self._get_extraction_methods()
    
    def _get_extraction_methods(self) -> List[Callable[[bytes], str]]:
        """Get list of extraction methods in order of preference"""
        return [
            self._extract_with_pypdf2_strict,
            self._extract_with_pypdf2_warnings_ignored,
            self._extract_with_pypdf2_page_by_page,
            self._extract_with_pypdf2_alternative_reader,
            self._extract_with_basic_ocr_fallback
        ]
    
    def extract_text_from_pdf(self, file_content: bytes, max_pages: Optional[int] = None) -> Dict[str, Any]:
        """
        Extract text from PDF with multiple fallback methods
        
        Args:
            file_content: PDF file content as bytes
            max_pages: Maximum pages to process (None = all pages)
            
        Returns:
            Dictionary with extracted text and source information
            
        Raises:
            ValueError: If no text could be extracted
        """
        # Store max_pages for use in extraction methods
        self.max_pages = max_pages
        
        # Try PyPDF2 methods first (faster and more accurate for text-based PDFs)
        pypdf_result = self._try_pypdf_methods(file_content)
        if pypdf_result and self._is_valid_text(pypdf_result):
            logger.info(f"✅ PyPDF2 extraction successful: {len(pypdf_result)} characters")
            return {
                'text': pypdf_result,
                'source': 'pypdf2',
                'method': 'PyPDF2 text extraction',
                'pages_processed': 'all',
                'char_count': len(pypdf_result)
            }
        
        # Only try OCR if PyPDF2 fails or returns insufficient text (for scanned PDFs)
        if pypdf_result:
            logger.info(f"PyPDF2 returned insufficient text ({len(pypdf_result)} chars), trying OCR for scanned PDF...")
        else:
            logger.info("PyPDF2 failed completely, trying OCR for scanned PDF...")
            
        ocr_result = self._try_ocr_extraction(file_content)
        if ocr_result:
            return {
                'text': ocr_result,
                'source': 'ocr',
                'method': 'Tesseract OCR',
                'pages_processed': getattr(self, 'max_pages', None) or 'all',
                'char_count': len(ocr_result)
            }
        
        # If all methods failed, raise detailed error
        raise ValueError(self._generate_error_message(file_content))
    
    def _try_ocr_extraction(self, file_content: bytes) -> str:
        """Try OCR extraction first for better results"""
        max_pages_info = f" (max {self.max_pages} pages)" if hasattr(self, 'max_pages') and self.max_pages else " (all pages)"
        logger.info(f"🔍 Trying OCR first for better text extraction{max_pages_info}")
        try:
            ocr_text = self._extract_with_basic_ocr_fallback(file_content)
            if self._is_valid_text(ocr_text):
                logger.info(f"✅ OCR successful: {len(ocr_text)} characters")
                return self._clean_extracted_text(ocr_text)
            else:
                logger.warning("OCR returned insufficient text, trying PyPDF2 methods...")
        except Exception as e:
            logger.warning(f"OCR failed: {e}, trying PyPDF2 methods...")
        return ""
    
    def _try_pypdf_methods(self, file_content: bytes) -> str:
        """Try PyPDF2 extraction methods"""
        errors = []
        pypdf_methods = self.extraction_methods[:-1]  # Exclude OCR method
        
        for i, method in enumerate(pypdf_methods, 1):
            try:
                logger.info(f"Trying extraction method {i}/{len(pypdf_methods)}")
                text = method(file_content)
                
                if self._is_valid_text(text):
                    logger.info(f"✅ Successfully extracted text using method {i}: {len(text)} characters")
                    return self._clean_extracted_text(text)
                else:
                    error_msg = self._log_insufficient_text(i, text)
                    errors.append(error_msg)
                    
            except Exception as e:
                error_msg = f"Method {i} failed: {str(e)}"
                logger.warning(error_msg)
                errors.append(error_msg)
        
        return ""
    
    def _is_valid_text(self, text: str) -> bool:
        """Check if extracted text is valid and meaningful"""
        return (text and 
                len(text.strip()) > self.MIN_TEXT_LENGTH and 
                not self._is_metadata_only(text))
    
    def _log_insufficient_text(self, method_num: int, text: str) -> str:
        """Log insufficient text and return error message"""
        text_length = len(text.strip()) if text else 0
        if text:
            logger.warning(f"❌ Method {method_num} returned insufficient/metadata text: {text_length} characters")
        else:
            logger.warning(f"❌ Method {method_num} returned empty text")
        return f"Method {method_num}: Insufficient text ({text_length} chars)"
    
    def _generate_error_message(self, file_content: bytes) -> str:
        """Generate detailed error message with diagnostic information"""
        base_error = "Không thể trích xuất text từ PDF."
        
        try:
            diagnostic_info = self._get_diagnostic_info(file_content)
            return f"{base_error}\n{diagnostic_info}"
        except Exception:
            return base_error
    
    def _get_diagnostic_info(self, file_content: bytes) -> str:
        """Get diagnostic information about the PDF"""
        pdf_file = BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
        
        return f"""
Thông tin chẩn đoán PDF:
- Số trang: {len(pdf_reader.pages)}
- Kích thước file: {len(file_content):,} bytes
- Mã hóa: {'Có' if pdf_reader.is_encrypted else 'Không'}

Khả năng nguyên nhân:
1. PDF được tạo từ scan/hình ảnh (cần OCR)
2. PDF sử dụng font đặc biệt hoặc encoding không hỗ trợ
3. PDF có cấu trúc phức tạp (form, table đặc biệt)

Gợi ý giải pháp:
- Thử chuyển đổi PDF sang định dạng khác (Word, Text)
- Sử dụng công cụ OCR nếu là PDF scan
- Kiểm tra PDF có mở được bình thường không
"""
    
    # PyPDF2 Extraction Methods
    
    def _extract_with_pypdf2_strict(self, file_content: bytes) -> str:
        """Method 1: Standard PyPDF2 extraction with strict mode"""
        try:
            pdf_reader = self._create_pdf_reader(file_content, strict=True)
            return self._extract_text_from_pages(pdf_reader.pages)
        except Exception as e:
            logger.debug(f"Strict PyPDF2 extraction failed: {e}")
            raise
    
    def _extract_with_pypdf2_warnings_ignored(self, file_content: bytes) -> str:
        """Method 2: PyPDF2 extraction ignoring warnings"""
        try:
            pdf_reader = self._create_pdf_reader(file_content, strict=False)
            return self._extract_text_with_error_handling(pdf_reader.pages)
        except Exception as e:
            logger.debug(f"Warnings-ignored PyPDF2 extraction failed: {e}")
            raise
    
    def _extract_with_pypdf2_page_by_page(self, file_content: bytes) -> str:
        """Method 3: Page-by-page extraction with error handling"""
        try:
            pdf_reader = self._create_pdf_reader(file_content, strict=False)
            text, successful_pages = self._extract_pages_with_stats(pdf_reader.pages)
            
            if successful_pages == 0:
                raise ValueError("No pages could be extracted")
            
            logger.info(f"Successfully extracted {successful_pages}/{len(pdf_reader.pages)} pages")
            return text
        except Exception as e:
            logger.debug(f"Page-by-page extraction failed: {e}")
            raise
    
    def _extract_with_pypdf2_alternative_reader(self, file_content: bytes) -> str:
        """Method 4: Alternative PyPDF2 reader approach"""
        try:
            pdf_reader = self._create_pdf_reader(file_content)
            return self._extract_text_alternative_method(pdf_reader.pages)
        except Exception as e:
            logger.debug(f"Alternative reader extraction failed: {e}")
            raise
    
    def _extract_with_basic_ocr_fallback(self, file_content: bytes) -> str:
        """Method 5: OCR fallback for image-based PDFs"""
        try:
            pdf_analysis = self._analyze_pdf_content(file_content)
            
            # Try OCR if we have images or very little meaningful text
            if pdf_analysis['needs_ocr']:
                logger.info(f"Detected PDF needing OCR - has_images: {pdf_analysis['has_images']}, has_text: {pdf_analysis['has_text']}")
                return self._perform_ocr_extraction(file_content, pdf_analysis)
            else:
                # Not an image-based PDF, return empty to continue with error
                return ""
                
        except Exception as e:
            logger.warning(f"OCR fallback detection failed: {e}")
            return ""
    
    # Helper Methods for PDF Processing
    
    def _create_pdf_reader(self, file_content: bytes, strict: bool = False) -> PyPDF2.PdfReader:
        """Create a PDF reader from file content"""
        pdf_file = BytesIO(file_content)
        return PyPDF2.PdfReader(pdf_file, strict=strict)
    
    def _extract_text_from_pages(self, pages) -> str:
        """Extract text from all pages"""
        text = ""
        for page in pages:
            text += page.extract_text()
        return text
    
    def _extract_text_with_error_handling(self, pages) -> str:
        """Extract text with error handling for individual pages"""
        text = ""
        for page in pages:
            try:
                page_text = page.extract_text()
                text += page_text
            except Exception as e:
                logger.debug(f"Warning ignored for page: {e}")
                continue
        return text
    
    def _extract_pages_with_stats(self, pages) -> Tuple[str, int]:
        """Extract text from pages and return statistics"""
        text = ""
        successful_pages = 0
        
        for page_num, page in enumerate(pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    successful_pages += 1
            except Exception as e:
                logger.debug(f"Failed to extract page {page_num}: {e}")
                continue
        
        return text, successful_pages
    
    def _extract_text_alternative_method(self, pages) -> str:
        """Alternative text extraction method"""
        text = ""
        for page in pages:
            try:
                # Only use extract_text(), don't use get_contents() as it returns raw PDF data
                page_text = page.extract_text()
                if page_text and len(page_text.strip()) > 0:
                    text += page_text
            except Exception as e:
                logger.debug(f"Alternative reader page extraction failed: {e}")
                continue
        return text
    
    def _analyze_pdf_content(self, file_content: bytes) -> Dict[str, Any]:
        """Analyze PDF content to determine if OCR is needed"""
        pdf_reader = self._create_pdf_reader(file_content, strict=False)
        
        has_images = False
        has_text = False
        
        # Check first few pages for content analysis
        pages_to_check = min(self.MAX_DIAGNOSTIC_PAGES, len(pdf_reader.pages))
        
        for page_num in range(pages_to_check):
            try:
                page = pdf_reader.pages[page_num]
                
                # Check for text
                page_text = page.extract_text()
                if page_text and len(page_text.strip()) > 10:
                    has_text = True
                    break
                
                # Check for images
                if self._page_has_images(page):
                    has_images = True
                    
            except Exception as e:
                logger.debug(f"Error checking page {page_num}: {e}")
                continue
        
        return {
            'has_images': has_images,
            'has_text': has_text,
            'needs_ocr': has_images or not has_text,
            'total_pages': len(pdf_reader.pages)
        }
    
    def _page_has_images(self, page) -> bool:
        """Check if a page contains images"""
        try:
            resources = page.get('/Resources', {})
            if '/XObject' in resources:
                xobjects = resources['/XObject']
                for obj_name in xobjects:
                    obj = xobjects[obj_name]
                    if obj.get('/Subtype') == '/Image':
                        return True
        except Exception:
            pass
        return False
    
    def _perform_ocr_extraction(self, file_content: bytes, pdf_analysis: Dict[str, Any]) -> str:
        """Perform OCR extraction with fallback message"""
        try:
            from app.riskassessment.helpers.lightweight_ocr import LightweightOCR
            
            ocr_extractor = LightweightOCR()
            # Use max_pages from instance variable if available
            max_pages = getattr(self, 'max_pages', None)
            ocr_result = ocr_extractor.extract_text_from_pdf(file_content, max_pages=max_pages)
            
            if ocr_result['success'] and ocr_result['text'].strip():
                pages_info = f"from {ocr_result['total_pages']} pages" if max_pages is None else f"from {ocr_result['total_pages']} pages (max {max_pages})"
                logger.info(f"✅ Lightweight OCR successful with {ocr_result['engine_used']}: {len(ocr_result['text'])} characters {pages_info}")
                return ocr_result['text']
            else:
                logger.warning(f"Lightweight OCR failed: {ocr_result.get('error', 'Unknown error')}")
                
        except ImportError:
            logger.warning("Lightweight OCR not available")
        except Exception as e:
            logger.warning(f"Lightweight OCR extraction failed: {str(e)}")
        
        # Fallback message if OCR fails
        return self._generate_ocr_fallback_message(file_content, pdf_analysis)
    
    def _generate_ocr_fallback_message(self, file_content: bytes, pdf_analysis: Dict[str, Any]) -> str:
        """Generate fallback message when OCR is not available"""
        return f"""[PDF chứa hình ảnh - cần OCR]

Tài liệu này có vẻ là PDF được tạo từ scan hoặc chứa chủ yếu hình ảnh.
OCR không khả dụng hoặc thất bại.

Thông tin PDF:
- Số trang: {pdf_analysis['total_pages']}
- Kích thước: {len(file_content):,} bytes
- Chứa hình ảnh: {'Có' if pdf_analysis['has_images'] else 'Không'}
- Chứa text: {'Có' if pdf_analysis['has_text'] else 'Không'}

Gợi ý:
1. Cài đặt OCR: pip install easyocr pdf2image
2. Sử dụng công cụ OCR như Adobe Acrobat, Google Drive OCR
3. Chuyển đổi PDF sang định dạng khác
4. Sử dụng dịch vụ OCR online
"""
    
    # Text Validation and Cleaning Methods
    
    def _is_metadata_only(self, text: str) -> bool:
        """Check if extracted text is just PDF metadata/filters"""
        if not text:
            return True
        
        text_lower = text.lower().strip()
        metadata_patterns = self._get_metadata_patterns()
        
        # Count how much of the text is metadata
        metadata_chars = sum(
            text_lower.count(pattern) * len(pattern) 
            for pattern in metadata_patterns
        )
        
        # If more than threshold is metadata, consider it metadata-only
        metadata_ratio = metadata_chars / len(text)
        
        logger.debug(f"Metadata detection: {metadata_ratio:.2%} metadata content")
        
        return metadata_ratio > self.METADATA_THRESHOLD
    
    def _get_metadata_patterns(self) -> List[str]:
        """Get list of common PDF metadata patterns"""
        return [
            'filter:',
            'flatedecode',
            'flatdecodefilter',
            'dctdecode',
            'ascii85decode',
            'lzwdecode',
            'runlengthdecode',
            '/filter',
            '/length',
            '/type',
            'stream',
            'endstream',
            'obj',
            'endobj'
        ]
    
    def _clean_extracted_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Apply text cleaning operations
        text = self._remove_excessive_whitespace(text)
        text = self._remove_problematic_characters(text)
        text = self._normalize_line_breaks(text)
        text = self._remove_excessive_line_breaks(text)
        
        return text.strip()
    
    def _remove_excessive_whitespace(self, text: str) -> str:
        """Remove excessive whitespace"""
        return re.sub(r'\s+', ' ', text)
    
    def _remove_problematic_characters(self, text: str) -> str:
        """Remove null characters and other problematic characters"""
        return text.replace('\x00', '').replace('\ufffd', '')
    
    def _normalize_line_breaks(self, text: str) -> str:
        """Normalize line breaks"""
        return re.sub(r'\r\n|\r|\n', '\n', text)
    
    def _remove_excessive_line_breaks(self, text: str) -> str:
        """Remove excessive line breaks"""
        return re.sub(r'\n{3,}', '\n\n', text)
