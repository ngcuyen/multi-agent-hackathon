"""
Improved PDF Text Extraction with Multiple Fallback Methods
This script provides enhanced PDF text extraction with better error handling
"""

import logging
from typing import Optional, Dict, Any
from io import BytesIO
import PyPDF2
import re

logger = logging.getLogger(__name__)


class ImprovedPDFExtractor:
    """Enhanced PDF text extractor with multiple fallback methods"""
    
    def __init__(self):
        self.extraction_methods = [
            self._extract_with_pypdf2_strict,
            self._extract_with_pypdf2_warnings_ignored,
            self._extract_with_pypdf2_page_by_page,
            self._extract_with_pypdf2_alternative_reader,
            self._extract_with_basic_ocr_fallback  # New OCR fallback
        ]
    
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """
        Extract text from PDF with multiple fallback methods
        
        Args:
            file_content: PDF file content as bytes
            
        Returns:
            Extracted text string
            
        Raises:
            ValueError: If no text could be extracted
        """
        errors = []
        
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """
        Extract text from PDF with multiple fallback methods
        
        Args:
            file_content: PDF file content as bytes
            
        Returns:
            Extracted text string
            
        Raises:
            ValueError: If no text could be extracted
        """
        errors = []
        
        # FORCE OCR FIRST for better results
        logger.info("🔍 Trying OCR first for better text extraction")
        try:
            ocr_text = self._extract_with_basic_ocr_fallback(file_content)
            if ocr_text and len(ocr_text.strip()) > 100 and not self._is_metadata_only(ocr_text):
                logger.info(f"✅ OCR successful: {len(ocr_text)} characters")
                return self._clean_extracted_text(ocr_text)
            else:
                logger.warning("OCR returned insufficient text, trying PyPDF2 methods...")
        except Exception as e:
            logger.warning(f"OCR failed: {e}, trying PyPDF2 methods...")
        
        for i, method in enumerate(self.extraction_methods[:-1], 1):  # Skip OCR method since we tried it first
            try:
                logger.info(f"Trying extraction method {i}/{len(self.extraction_methods)-1}")
                text = method(file_content)
                
                # Check if we got meaningful text (more than 100 characters and not just metadata)
                if text and len(text.strip()) > 100 and not self._is_metadata_only(text):
                    logger.info(f"✅ Successfully extracted text using method {i}: {len(text)} characters")
                    return self._clean_extracted_text(text)
                else:
                    if text:
                        logger.warning(f"❌ Method {i} returned insufficient/metadata text: {len(text.strip())} characters")
                    else:
                        logger.warning(f"❌ Method {i} returned empty text")
                    errors.append(f"Method {i}: Insufficient text ({len(text.strip()) if text else 0} chars)")
                    
            except Exception as e:
                error_msg = f"Method {i} failed: {str(e)}"
                logger.warning(error_msg)
                errors.append(error_msg)
        
        # If all methods failed, raise detailed error
        error_summary = "Không thể trích xuất text từ PDF. Chi tiết lỗi:\\n" + "\\n".join(errors)
        
        # Add additional diagnostic info
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
            
            diagnostic_info = f"""
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
            
            raise ValueError(error_summary + diagnostic_info)
            
        except Exception:
            raise ValueError(error_summary)
        
        # If all methods failed, raise detailed error
        error_summary = "Không thể trích xuất text từ PDF. Chi tiết lỗi:\n" + "\n".join(errors)
        
        # Add additional diagnostic info
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
            
            diagnostic_info = f"""
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
            
            raise ValueError(error_summary + diagnostic_info)
            
        except Exception:
            raise ValueError(error_summary)
    
    def _extract_with_pypdf2_strict(self, file_content: bytes) -> str:
        """Method 1: Standard PyPDF2 extraction with strict mode"""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=True)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            
            return text
            
        except Exception as e:
            logger.debug(f"Strict PyPDF2 extraction failed: {e}")
            raise
    
    def _extract_with_pypdf2_warnings_ignored(self, file_content: bytes) -> str:
        """Method 2: PyPDF2 extraction ignoring warnings"""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
            
            text = ""
            for page in pdf_reader.pages:
                try:
                    page_text = page.extract_text()
                    text += page_text
                except Exception as e:
                    logger.debug(f"Warning ignored for page: {e}")
                    continue
            
            return text
            
        except Exception as e:
            logger.debug(f"Warnings-ignored PyPDF2 extraction failed: {e}")
            raise
    
    def _extract_with_pypdf2_page_by_page(self, file_content: bytes) -> str:
        """Method 3: Page-by-page extraction with error handling"""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
            
            text = ""
            successful_pages = 0
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                        successful_pages += 1
                except Exception as e:
                    logger.debug(f"Failed to extract page {page_num}: {e}")
                    continue
            
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
            pdf_file = BytesIO(file_content)
            
            # Try with different parameters
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                try:
                    # Only use extract_text(), don't use get_contents() as it returns raw PDF data
                    page_text = page.extract_text()
                    if page_text and len(page_text.strip()) > 0:
                        text += page_text
                except Exception as e:
                    logger.debug(f"Alternative reader page extraction failed: {e}")
                    continue
            
            return text
            
        except Exception as e:
            logger.debug(f"Alternative reader extraction failed: {e}")
            raise
    
    def _extract_with_basic_ocr_fallback(self, file_content: bytes) -> str:
        """Method 5: OCR fallback for image-based PDFs"""
        try:
            # Try to detect if this is an image-based PDF
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
            
            # Check if PDF has images but no text
            has_images = False
            has_text = False
            
            for page_num, page in enumerate(pdf_reader.pages[:3]):  # Check first 3 pages
                try:
                    # Check for text
                    page_text = page.extract_text()
                    if page_text and len(page_text.strip()) > 10:
                        has_text = True
                        break
                    
                    # Check for images
                    if '/XObject' in page.get('/Resources', {}):
                        xobjects = page['/Resources']['/XObject']
                        for obj_name in xobjects:
                            obj = xobjects[obj_name]
                            if obj.get('/Subtype') == '/Image':
                                has_images = True
                                break
                                
                except Exception as e:
                    logger.debug(f"Error checking page {page_num}: {e}")
                    continue
            
            # Try OCR if we have images or very little meaningful text
            if has_images or not has_text:
                logger.info(f"Detected PDF needing OCR - has_images: {has_images}, has_text: {has_text}")
                
                # Try OCR extraction
                try:
                    from app.themovie.helpers.lightweight_ocr import LightweightOCR
                    
                    ocr_extractor = LightweightOCR()
                    ocr_result = ocr_extractor.extract_text_from_pdf(file_content)
                    
                    if ocr_result['success'] and ocr_result['text'].strip():
                        logger.info(f"✅ Lightweight OCR successful with {ocr_result['engine_used']}: {len(ocr_result['text'])} characters")
                        return ocr_result['text']
                    else:
                        logger.warning(f"Lightweight OCR failed: {ocr_result.get('error', 'Unknown error')}")
                        
                except ImportError:
                    logger.warning("Lightweight OCR not available")
                except Exception as e:
                    logger.warning(f"Lightweight OCR extraction failed: {str(e)}")
                
                # Fallback message if OCR fails
                return f"""[PDF chứa hình ảnh - cần OCR]

Tài liệu này có vẻ là PDF được tạo từ scan hoặc chứa chủ yếu hình ảnh.
OCR không khả dụng hoặc thất bại.

Thông tin PDF:
- Số trang: {len(pdf_reader.pages)}
- Kích thước: {len(file_content):,} bytes
- Chứa hình ảnh: {'Có' if has_images else 'Không'}
- Chứa text: {'Có' if has_text else 'Không'}

Gợi ý:
1. Cài đặt OCR: pip install easyocr pdf2image
2. Sử dụng công cụ OCR như Adobe Acrobat, Google Drive OCR
3. Chuyển đổi PDF sang định dạng khác
4. Sử dụng dịch vụ OCR online
"""
            else:
                # Not an image-based PDF, return empty to continue with error
                return ""
                
        except Exception as e:
            logger.warning(f"OCR fallback detection failed: {e}")
            return ""
    
    def _is_metadata_only(self, text: str) -> bool:
        """Check if extracted text is just PDF metadata/filters"""
        if not text:
            return True
        
        text_lower = text.lower().strip()
        
        # Common PDF metadata patterns
        metadata_patterns = [
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
        
        # Count how much of the text is metadata
        metadata_chars = 0
        for pattern in metadata_patterns:
            metadata_chars += text_lower.count(pattern) * len(pattern)
        
        # If more than 70% is metadata, consider it metadata-only
        metadata_ratio = metadata_chars / len(text)
        
        logger.debug(f"Metadata detection: {metadata_ratio:.2%} metadata content")
        
        return metadata_ratio > 0.7
    
    def _clean_extracted_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove null characters and other problematic characters
        text = text.replace('\x00', '').replace('\ufffd', '')
        
        # Normalize line breaks
        text = re.sub(r'\r\n|\r|\n', '\n', text)
        
        # Remove excessive line breaks
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()
