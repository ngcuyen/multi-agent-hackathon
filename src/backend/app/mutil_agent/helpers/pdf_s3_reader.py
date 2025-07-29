"""
PDF S3 Reader - Sử dụng PyPDF2 để đọc nội dung PDF từ S3
"""

import logging
from typing import Dict, Any, List, Optional
from io import BytesIO
import PyPDF2
import boto3
from botocore.exceptions import ClientError

from app.mutil_agent.helpers.s3_config import get_s3_config

logger = logging.getLogger(__name__)


class PDFS3Reader:
    """Class chuyên dụng để đọc PDF từ S3 bằng PyPDF2"""
    
    def __init__(self, region_name: Optional[str] = None):
        """
        Khởi tạo PDF S3 Reader
        
        Args:
            region_name: AWS region (mặc định lấy từ config)
        """
        self.s3_config = get_s3_config()
        self.region_name = region_name or self.s3_config.region_name
        self.s3_client = boto3.client('s3', region_name=self.region_name)
    
    def download_pdf_from_s3(self, bucket_name: str, file_key: str) -> bytes:
        """
        Tải file PDF từ S3
        
        Args:
            bucket_name: Tên S3 bucket
            file_key: Đường dẫn file trong S3
            
        Returns:
            Nội dung file dưới dạng bytes
        """
        try:
            logger.info(f"Đang tải PDF từ S3: s3://{bucket_name}/{file_key}")
            
            response = self.s3_client.get_object(Bucket=bucket_name, Key=file_key)
            pdf_content = response['Body'].read()
            
            logger.info(f"Đã tải thành công PDF ({len(pdf_content)} bytes)")
            return pdf_content
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                raise FileNotFoundError(f"Không tìm thấy file: {file_key}")
            elif error_code == 'NoSuchBucket':
                raise FileNotFoundError(f"Không tìm thấy bucket: {bucket_name}")
            else:
                logger.error(f"Lỗi khi tải file từ S3: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Lỗi không xác định: {str(e)}")
            raise
    
    def extract_text_from_pdf_bytes(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Trích xuất text từ PDF bytes bằng PyPDF2
        
        Args:
            pdf_bytes: Nội dung PDF dưới dạng bytes
            
        Returns:
            Dictionary chứa thông tin và nội dung PDF
        """
        try:
            # Tạo BytesIO object từ bytes
            pdf_buffer = BytesIO(pdf_bytes)
            
            # Đọc PDF bằng PyPDF2
            pdf_reader = PyPDF2.PdfReader(pdf_buffer)
            
            # Thông tin cơ bản
            num_pages = len(pdf_reader.pages)
            metadata = pdf_reader.metadata or {}
            
            logger.info(f"PDF có {num_pages} trang")
            
            # Trích xuất text từ từng trang
            pages_content = []
            full_text = ""
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    
                    page_info = {
                        'page_number': page_num + 1,
                        'text': page_text,
                        'char_count': len(page_text),
                        'word_count': len(page_text.split()) if page_text else 0
                    }
                    
                    pages_content.append(page_info)
                    full_text += page_text + "\n"
                    
                    logger.debug(f"Đã trích xuất trang {page_num + 1}: {len(page_text)} ký tự")
                    
                except Exception as e:
                    logger.warning(f"Lỗi khi trích xuất trang {page_num + 1}: {str(e)}")
                    pages_content.append({
                        'page_number': page_num + 1,
                        'text': '',
                        'char_count': 0,
                        'word_count': 0,
                        'error': str(e)
                    })
            
            # Tổng hợp kết quả
            result = {
                'success': True,
                'num_pages': num_pages,
                'metadata': {
                    'title': metadata.get('/Title', 'N/A'),
                    'author': metadata.get('/Author', 'N/A'),
                    'subject': metadata.get('/Subject', 'N/A'),
                    'creator': metadata.get('/Creator', 'N/A'),
                    'producer': metadata.get('/Producer', 'N/A'),
                    'creation_date': str(metadata.get('/CreationDate', 'N/A')),
                    'modification_date': str(metadata.get('/ModDate', 'N/A'))
                },
                'pages_content': pages_content,
                'full_text': full_text.strip(),
                'statistics': {
                    'total_characters': len(full_text),
                    'total_words': len(full_text.split()),
                    'total_lines': full_text.count('\n'),
                    'pages_with_content': len([p for p in pages_content if p.get('char_count', 0) > 0]),
                    'pages_with_errors': len([p for p in pages_content if 'error' in p])
                }
            }
            
            logger.info(f"Trích xuất thành công: {result['statistics']['total_words']} từ, {result['statistics']['total_characters']} ký tự")
            return result
            
        except Exception as e:
            logger.error(f"Lỗi khi trích xuất text từ PDF: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'num_pages': 0,
                'metadata': {},
                'pages_content': [],
                'full_text': '',
                'statistics': {}
            }
    
    def read_pdf_from_s3(self, bucket_name: str, file_key: str) -> Dict[str, Any]:
        """
        Đọc và trích xuất nội dung PDF từ S3
        
        Args:
            bucket_name: Tên S3 bucket
            file_key: Đường dẫn file trong S3
            
        Returns:
            Dictionary chứa thông tin và nội dung PDF
        """
        try:
            # Tải PDF từ S3
            pdf_bytes = self.download_pdf_from_s3(bucket_name, file_key)
            
            # Trích xuất text
            result = self.extract_text_from_pdf_bytes(pdf_bytes)
            
            # Thêm thông tin S3
            result['s3_info'] = {
                'bucket_name': bucket_name,
                'file_key': file_key,
                'file_size_bytes': len(pdf_bytes)
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Lỗi khi đọc PDF từ S3: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                's3_info': {
                    'bucket_name': bucket_name,
                    'file_key': file_key,
                    'file_size_bytes': 0
                }
            }
    
    def get_pdf_info_only(self, bucket_name: str, file_key: str) -> Dict[str, Any]:
        """
        Chỉ lấy thông tin metadata của PDF mà không trích xuất text
        
        Args:
            bucket_name: Tên S3 bucket
            file_key: Đường dẫn file trong S3
            
        Returns:
            Dictionary chứa metadata PDF
        """
        try:
            pdf_bytes = self.download_pdf_from_s3(bucket_name, file_key)
            pdf_buffer = BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_buffer)
            
            metadata = pdf_reader.metadata or {}
            
            return {
                'success': True,
                'bucket_name': bucket_name,
                'file_key': file_key,
                'file_size_bytes': len(pdf_bytes),
                'num_pages': len(pdf_reader.pages),
                'metadata': {
                    'title': metadata.get('/Title', 'N/A'),
                    'author': metadata.get('/Author', 'N/A'),
                    'subject': metadata.get('/Subject', 'N/A'),
                    'creator': metadata.get('/Creator', 'N/A'),
                    'producer': metadata.get('/Producer', 'N/A'),
                    'creation_date': str(metadata.get('/CreationDate', 'N/A')),
                    'modification_date': str(metadata.get('/ModDate', 'N/A'))
                }
            }
            
        except Exception as e:
            logger.error(f"Lỗi khi lấy thông tin PDF: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_specific_pages(self, bucket_name: str, file_key: str, page_numbers: List[int]) -> Dict[str, Any]:
        """
        Trích xuất text từ các trang cụ thể
        
        Args:
            bucket_name: Tên S3 bucket
            file_key: Đường dẫn file trong S3
            page_numbers: Danh sách số trang cần trích xuất (bắt đầu từ 1)
            
        Returns:
            Dictionary chứa nội dung các trang được chỉ định
        """
        try:
            pdf_bytes = self.download_pdf_from_s3(bucket_name, file_key)
            pdf_buffer = BytesIO(pdf_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_buffer)
            
            total_pages = len(pdf_reader.pages)
            
            # Kiểm tra số trang hợp lệ
            valid_pages = [p for p in page_numbers if 1 <= p <= total_pages]
            invalid_pages = [p for p in page_numbers if p not in valid_pages]
            
            if invalid_pages:
                logger.warning(f"Các trang không hợp lệ: {invalid_pages} (PDF có {total_pages} trang)")
            
            # Trích xuất text từ các trang được chỉ định
            extracted_pages = []
            combined_text = ""
            
            for page_num in valid_pages:
                try:
                    page = pdf_reader.pages[page_num - 1]  # PyPDF2 đánh số từ 0
                    page_text = page.extract_text()
                    
                    page_info = {
                        'page_number': page_num,
                        'text': page_text,
                        'char_count': len(page_text),
                        'word_count': len(page_text.split()) if page_text else 0
                    }
                    
                    extracted_pages.append(page_info)
                    combined_text += f"--- Trang {page_num} ---\n{page_text}\n\n"
                    
                except Exception as e:
                    logger.error(f"Lỗi khi trích xuất trang {page_num}: {str(e)}")
                    extracted_pages.append({
                        'page_number': page_num,
                        'text': '',
                        'char_count': 0,
                        'word_count': 0,
                        'error': str(e)
                    })
            
            return {
                'success': True,
                'bucket_name': bucket_name,
                'file_key': file_key,
                'total_pages': total_pages,
                'requested_pages': page_numbers,
                'valid_pages': valid_pages,
                'invalid_pages': invalid_pages,
                'extracted_pages': extracted_pages,
                'combined_text': combined_text.strip(),
                'statistics': {
                    'pages_extracted': len(valid_pages),
                    'total_characters': len(combined_text),
                    'total_words': len(combined_text.split())
                }
            }
            
        except Exception as e:
            logger.error(f"Lỗi khi trích xuất các trang cụ thể: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Convenience functions
def read_pdf_from_s3(bucket_name: str, file_key: str) -> Dict[str, Any]:
    """
    Hàm tiện ích để đọc PDF từ S3
    
    Args:
        bucket_name: Tên S3 bucket
        file_key: Đường dẫn file trong S3
        
    Returns:
        Dictionary chứa nội dung PDF
    """
    reader = PDFS3Reader()
    return reader.read_pdf_from_s3(bucket_name, file_key)


def get_pdf_text_only(bucket_name: str, file_key: str) -> str:
    """
    Chỉ lấy text từ PDF, bỏ qua metadata
    
    Args:
        bucket_name: Tên S3 bucket
        file_key: Đường dẫn file trong S3
        
    Returns:
        Text content của PDF
    """
    reader = PDFS3Reader()
    result = reader.read_pdf_from_s3(bucket_name, file_key)
    
    if result.get('success'):
        return result.get('full_text', '')
    else:
        return f"Lỗi: {result.get('error', 'Không thể đọc PDF')}"


def get_pdf_info(bucket_name: str, file_key: str) -> Dict[str, Any]:
    """
    Chỉ lấy thông tin metadata của PDF
    
    Args:
        bucket_name: Tên S3 bucket
        file_key: Đường dẫn file trong S3
        
    Returns:
        Metadata của PDF
    """
    reader = PDFS3Reader()
    return reader.get_pdf_info_only(bucket_name, file_key)
