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
        
        for i, method in enumerate(self.extraction_methods, 1):
            try:
                logger.info(f"Trying extraction method {i}/{len(self.extraction_methods)}")
                text = method(file_content)
                
                if text and len(text.strip()) > 0:
                    logger.info(f"✅ Successfully extracted text using method {i}: {len(text)} characters")
                    return self._clean_extracted_text(text)
                else:
                    error_msg = f"Method {i} returned empty text"
                    logger.warning(error_msg)
                    errors.append(error_msg)
                    
            except Exception as e:
                error_msg = f"Method {i} failed: {str(e)}"
                logger.warning(error_msg)
                errors.append(error_msg)
        
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
- Metadata: {pdf_reader.metadata}

Khả năng nguyên nhân:
1. PDF được tạo từ scan/hình ảnh (cần OCR)
2. PDF sử dụng font đặc biệt hoặc encoding không hỗ trợ
3. PDF có cấu trúc phức tạp (form, table đặc biệt)
4. PDF bị hỏng hoặc có bảo vệ đặc biệt

Gợi ý giải pháp:
- Thử chuyển đổi PDF sang định dạng khác (Word, Text)
- Sử dụng công cụ OCR nếu là PDF scan
- Kiểm tra PDF có mở được bình thường không
"""
            error_summary += diagnostic_info
            
        except Exception as diag_error:
            error_summary += f"\nKhông thể chẩn đoán PDF: {str(diag_error)}"
        
        logger.error(error_summary)
        raise ValueError(error_summary)
    
    def _extract_with_pypdf2_strict(self, file_content: bytes) -> str:
        """Method 1: Standard PyPDF2 extraction with strict mode"""
        pdf_file = BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file, strict=True)
        
        text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            text += page_text + "\n"
            logger.debug(f"Page {page_num + 1}: {len(page_text)} characters")
        
        return text
    
    def _extract_with_pypdf2_warnings_ignored(self, file_content: bytes) -> str:
        """Method 2: PyPDF2 extraction with warnings ignored"""
        pdf_file = BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
        
        text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            try:
                page_text = page.extract_text()
                text += page_text + "\n"
                logger.debug(f"Page {page_num + 1}: {len(page_text)} characters")
            except Exception as e:
                logger.warning(f"Failed to extract page {page_num + 1}: {e}")
                continue
        
        return text
    
    def _extract_with_pypdf2_page_by_page(self, file_content: bytes) -> str:
        """Method 3: Extract page by page with individual error handling"""
        pdf_file = BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        successful_pages = 0
        
        for page_num, page in enumerate(pdf_reader.pages):
            try:
                # Try different extraction methods for each page
                page_text = ""
                
                # Try standard extraction
                try:
                    page_text = page.extract_text()
                except:
                    # Try alternative extraction methods
                    try:
                        # Method: Extract text with different parameters
                        page_text = page.extract_text(extraction_mode="layout")
                    except:
                        try:
                            # Method: Extract text with visitor pattern
                            def visitor_body(text, cm, tm, fontDict, fontSize):
                                return text
                            
                            page_text = page.extract_text(visitor_text=visitor_body)
                        except:
                            logger.warning(f"All extraction methods failed for page {page_num + 1}")
                            continue
                
                if page_text and len(page_text.strip()) > 0:
                    text += page_text + "\n"
                    successful_pages += 1
                    logger.debug(f"Page {page_num + 1}: {len(page_text)} characters")
                
            except Exception as e:
                logger.warning(f"Error extracting page {page_num + 1}: {e}")
                continue
        
        logger.info(f"Successfully extracted {successful_pages}/{len(pdf_reader.pages)} pages")
        return text
    
    def _extract_with_pypdf2_alternative_reader(self, file_content: bytes) -> str:
        """Method 4: Alternative PyPDF2 reader configuration"""
        pdf_file = BytesIO(file_content)
        
        # Try with different reader configurations
        try:
            # Configuration 1: Disable strict mode and warnings
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
            
            text = ""
            for page in pdf_reader.pages:
                try:
                    # Try to extract text with different approaches
                    page_text = page.extract_text()
                    
                    # If empty, try extracting from content stream directly
                    if not page_text.strip():
                        try:
                            # Alternative: try to get text from page object
                            if '/Contents' in page:
                                content = page['/Contents']
                                if hasattr(content, 'get_data'):
                                    raw_content = content.get_data()
                                    # Basic text extraction from content stream
                                    page_text = self._extract_text_from_content_stream(raw_content)
                        except:
                            pass
                    
                    text += page_text + "\n"
                    
                except Exception as e:
                    logger.warning(f"Error in alternative extraction: {e}")
                    continue
            
            return text
            
        except Exception as e:
            logger.error(f"Alternative reader failed: {e}")
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
            
            if has_images and not has_text:
                logger.info("Detected image-based PDF - attempting OCR")
                
                # Try OCR extraction
                try:
                    from app.themovie.helpers.ocr_extractor import OCRExtractor
                    
                    ocr_extractor = OCRExtractor()
                    ocr_result = ocr_extractor.extract_text_from_pdf(file_content)
                    
                    if ocr_result['success'] and ocr_result['text'].strip():
                        logger.info(f"✅ OCR successful with {ocr_result['engine_used']}: {len(ocr_result['text'])} characters")
                        return ocr_result['text']
                    else:
                        logger.warning(f"OCR failed: {ocr_result.get('error', 'Unknown error')}")
                        
                except ImportError:
                    logger.warning("OCR extractor not available")
                except Exception as e:
                    logger.warning(f"OCR extraction failed: {str(e)}")
                
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
    
    def _extract_text_from_content_stream(self, content_data: bytes) -> str:
        """
        Basic text extraction from PDF content stream
        This is a simple fallback method
        """
        try:
            # Convert bytes to string and look for text patterns
            content_str = content_data.decode('latin-1', errors='ignore')
            
            # Look for text between BT and ET operators
            text_pattern = r'BT\s+(.*?)\s+ET'
            matches = re.findall(text_pattern, content_str, re.DOTALL)
            
            extracted_text = ""
            for match in matches:
                # Extract text from Tj and TJ operators
                text_ops = re.findall(r'\((.*?)\)\s*Tj', match)
                text_ops.extend(re.findall(r'\[(.*?)\]\s*TJ', match))
                
                for text_op in text_ops:
                    # Clean up the text
                    clean_text = text_op.replace('\\(', '(').replace('\\)', ')')
                    extracted_text += clean_text + " "
            
            return extracted_text.strip()
            
        except Exception as e:
            logger.warning(f"Content stream extraction failed: {e}")
            return ""
    
    def _clean_extracted_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove control characters but keep Vietnamese characters
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        # Remove excessive newlines
        text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
        
        return text.strip()
    
    def get_pdf_info(self, file_content: bytes) -> Dict[str, Any]:
        """
        Get PDF metadata and basic information
        
        Args:
            file_content: PDF file content as bytes
            
        Returns:
            Dictionary with PDF information
        """
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
            
            metadata = pdf_reader.metadata or {}
            
            info = {
                'num_pages': len(pdf_reader.pages),
                'file_size_bytes': len(file_content),
                'metadata': {
                    'title': metadata.get('/Title', 'N/A'),
                    'author': metadata.get('/Author', 'N/A'),
                    'subject': metadata.get('/Subject', 'N/A'),
                    'creator': metadata.get('/Creator', 'N/A'),
                    'producer': metadata.get('/Producer', 'N/A'),
                    'creation_date': str(metadata.get('/CreationDate', 'N/A')),
                    'modification_date': str(metadata.get('/ModDate', 'N/A'))
                },
                'is_encrypted': pdf_reader.is_encrypted,
                'extraction_possible': True
            }
            
            # Test if text extraction is possible
            try:
                if len(pdf_reader.pages) > 0:
                    test_text = pdf_reader.pages[0].extract_text()
                    info['has_extractable_text'] = len(test_text.strip()) > 0
                else:
                    info['has_extractable_text'] = False
            except:
                info['has_extractable_text'] = False
                info['extraction_possible'] = False
            
            return info
            
        except Exception as e:
            return {
                'error': str(e),
                'extraction_possible': False,
                'has_extractable_text': False
            }


# Test function
def test_pdf_extraction(file_path: str):
    """Test the improved PDF extractor"""
    extractor = ImprovedPDFExtractor()
    
    try:
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        print(f"Testing PDF extraction for: {file_path}")
        print(f"File size: {len(file_content)} bytes")
        
        # Get PDF info
        info = extractor.get_pdf_info(file_content)
        print(f"PDF Info: {info}")
        
        # Extract text
        text = extractor.extract_text_from_pdf(file_content)
        print(f"Extracted text length: {len(text)} characters")
        print(f"First 200 characters: {text[:200]}...")
        
        return text
        
    except Exception as e:
        print(f"Error: {e}")
        return None


if __name__ == "__main__":
    # Example usage
    import sys
    if len(sys.argv) > 1:
        test_pdf_extraction(sys.argv[1])
    else:
        print("Usage: python improved_pdf_extractor.py <pdf_file_path>")
