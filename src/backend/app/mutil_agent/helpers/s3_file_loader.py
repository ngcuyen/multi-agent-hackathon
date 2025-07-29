"""
S3 File Loader Helper
Simplified functions to load PDF and CSV files from AWS S3 bucket using IAM roles
"""

import io
import logging
from typing import Optional, Dict, Any, List
import boto3
import pandas as pd
from botocore.exceptions import ClientError, NoCredentialsError
import PyPDF2
from io import BytesIO

logger = logging.getLogger(__name__)


class S3FileLoader:
    """Simplified helper class to load files from S3 bucket using IAM roles or default credentials"""
    
    def __init__(self, region_name: str = 'us-east-1'):
        """
        Initialize S3 client using default credentials (IAM role, environment variables, or AWS CLI config)
        
        Args:
            region_name: AWS region name
        """
        try:
            self.s3_client = boto3.client('s3', region_name=region_name)
            self.region_name = region_name
        except NoCredentialsError:
            logger.error("AWS credentials not found. Please configure IAM role or AWS credentials.")
            raise
        except Exception as e:
            logger.error(f"Error initializing S3 client: {str(e)}")
            raise

    def _download_file_from_s3(self, bucket_name: str, file_key: str) -> bytes:
        """
        Download file content from S3
        
        Args:
            bucket_name: S3 bucket name
            file_key: S3 object key (file path)
            
        Returns:
            File content as bytes
        """
        try:
            response = self.s3_client.get_object(Bucket=bucket_name, Key=file_key)
            return response['Body'].read()
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                raise FileNotFoundError(f"File not found: {file_key}")
            elif error_code == 'NoSuchBucket':
                raise FileNotFoundError(f"Bucket not found: {bucket_name}")
            else:
                logger.error(f"Error downloading file from S3: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error downloading file: {str(e)}")
            raise

    def load_csv_file(self, 
                      bucket_name: str, 
                      file_key: str,
                      **pandas_kwargs) -> pd.DataFrame:
        """
        Load CSV file from S3 bucket
        
        Args:
            bucket_name: S3 bucket name
            file_key: S3 object key (CSV file path)
            **pandas_kwargs: Additional arguments for pandas.read_csv()
            
        Returns:
            pandas DataFrame containing CSV data
        """
        try:
            logger.info(f"Loading CSV file: s3://{bucket_name}/{file_key}")
            
            # Download file content
            file_content = self._download_file_from_s3(bucket_name, file_key)
            
            # Create StringIO object from bytes
            csv_buffer = io.StringIO(file_content.decode('utf-8'))
            
            # Load CSV into DataFrame
            df = pd.read_csv(csv_buffer, **pandas_kwargs)
            
            logger.info(f"Successfully loaded CSV with shape: {df.shape}")
            return df
            
        except UnicodeDecodeError:
            logger.error("Error decoding CSV file. File might not be UTF-8 encoded.")
            raise
        except pd.errors.EmptyDataError:
            logger.error("CSV file is empty")
            raise
        except Exception as e:
            logger.error(f"Error loading CSV file: {str(e)}")
            raise

    def load_pdf_file(self, 
                      bucket_name: str, 
                      file_key: str,
                      extract_text: bool = True) -> Dict[str, Any]:
        """
        Load PDF file from S3 bucket
        
        Args:
            bucket_name: S3 bucket name
            file_key: S3 object key (PDF file path)
            extract_text: Whether to extract text content from PDF
            
        Returns:
            Dictionary containing PDF metadata and content
        """
        try:
            logger.info(f"Loading PDF file: s3://{bucket_name}/{file_key}")
            
            # Download file content
            file_content = self._download_file_from_s3(bucket_name, file_key)
            
            # Create BytesIO object
            pdf_buffer = BytesIO(file_content)
            
            # Read PDF
            pdf_reader = PyPDF2.PdfReader(pdf_buffer)
            
            result = {
                'file_key': file_key,
                'bucket_name': bucket_name,
                'num_pages': len(pdf_reader.pages),
                'metadata': pdf_reader.metadata,
                'file_size_bytes': len(file_content)
            }
            
            if extract_text:
                # Extract text from all pages
                text_content = []
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        text_content.append({
                            'page_number': page_num + 1,
                            'text': page_text
                        })
                    except Exception as e:
                        logger.warning(f"Error extracting text from page {page_num + 1}: {str(e)}")
                        text_content.append({
                            'page_number': page_num + 1,
                            'text': '',
                            'error': str(e)
                        })
                
                result['text_content'] = text_content
                result['full_text'] = '\n'.join([page['text'] for page in text_content])
            
            logger.info(f"Successfully loaded PDF with {result['num_pages']} pages")
            return result
            
        except Exception as e:
            logger.error(f"Error loading PDF file: {str(e)}")
            raise

    def load_json_file(self, bucket_name: str, file_key: str) -> Dict[str, Any]:
        """
        Load JSON file from S3 bucket
        
        Args:
            bucket_name: S3 bucket name
            file_key: S3 object key (JSON file path)
            
        Returns:
            Dictionary containing JSON data
        """
        try:
            import json
            logger.info(f"Loading JSON file: s3://{bucket_name}/{file_key}")
            
            # Download file content
            file_content = self._download_file_from_s3(bucket_name, file_key)
            
            # Parse JSON
            json_data = json.loads(file_content.decode('utf-8'))
            
            logger.info(f"Successfully loaded JSON file")
            return json_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON file: {str(e)}")
            raise
        except UnicodeDecodeError:
            logger.error("Error decoding JSON file. File might not be UTF-8 encoded.")
            raise
        except Exception as e:
            logger.error(f"Error loading JSON file: {str(e)}")
            raise

    def load_text_file(self, bucket_name: str, file_key: str, encoding: str = 'utf-8') -> str:
        """
        Load text file from S3 bucket
        
        Args:
            bucket_name: S3 bucket name
            file_key: S3 object key (text file path)
            encoding: Text encoding (default: utf-8)
            
        Returns:
            String containing file content
        """
        try:
            logger.info(f"Loading text file: s3://{bucket_name}/{file_key}")
            
            # Download file content
            file_content = self._download_file_from_s3(bucket_name, file_key)
            
            # Decode text
            text_content = file_content.decode(encoding)
            
            logger.info(f"Successfully loaded text file ({len(text_content)} characters)")
            return text_content
            
        except UnicodeDecodeError:
            logger.error(f"Error decoding text file with encoding: {encoding}")
            raise
        except Exception as e:
            logger.error(f"Error loading text file: {str(e)}")
            raise

    def list_files(self, 
                   bucket_name: str, 
                   prefix: str = '',
                   file_extensions: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        List files in S3 bucket with optional filtering
        
        Args:
            bucket_name: S3 bucket name
            prefix: Prefix to filter files (folder path)
            file_extensions: List of file extensions to filter (e.g., ['.pdf', '.csv'])
            
        Returns:
            List of file information dictionaries
        """
        try:
            logger.info(f"Listing files in bucket: {bucket_name}, prefix: {prefix}")
            
            response = self.s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=prefix
            )
            
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    file_key = obj['Key']
                    
                    # Filter by file extensions if specified
                    if file_extensions:
                        if not any(file_key.lower().endswith(ext.lower()) for ext in file_extensions):
                            continue
                    
                    files.append({
                        'key': file_key,
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'],
                        'etag': obj['ETag']
                    })
            
            logger.info(f"Found {len(files)} files")
            return files
            
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            raise

    def file_exists(self, bucket_name: str, file_key: str) -> bool:
        """
        Check if file exists in S3 bucket
        
        Args:
            bucket_name: S3 bucket name
            file_key: S3 object key (file path)
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(Bucket=bucket_name, Key=file_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            else:
                logger.error(f"Error checking file existence: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error checking file existence: {str(e)}")
            raise


# Convenience functions for direct usage
def load_csv_from_s3(bucket_name: str, 
                     file_key: str,
                     region_name: str = 'us-east-1',
                     **pandas_kwargs) -> pd.DataFrame:
    """
    Convenience function to load CSV file from S3
    
    Args:
        bucket_name: S3 bucket name
        file_key: S3 object key (CSV file path)
        region_name: AWS region name
        **pandas_kwargs: Additional arguments for pandas.read_csv()
        
    Returns:
        pandas DataFrame containing CSV data
    """
    loader = S3FileLoader(region_name)
    return loader.load_csv_file(bucket_name, file_key, **pandas_kwargs)


def load_pdf_from_s3(bucket_name: str, 
                     file_key: str,
                     region_name: str = 'us-east-1',
                     extract_text: bool = True) -> Dict[str, Any]:
    """
    Convenience function to load PDF file from S3
    
    Args:
        bucket_name: S3 bucket name
        file_key: S3 object key (PDF file path)
        region_name: AWS region name
        extract_text: Whether to extract text content from PDF
        
    Returns:
        Dictionary containing PDF metadata and content
    """
    loader = S3FileLoader(region_name)
    return loader.load_pdf_file(bucket_name, file_key, extract_text)


def load_json_from_s3(bucket_name: str, 
                      file_key: str,
                      region_name: str = 'us-east-1') -> Dict[str, Any]:
    """
    Convenience function to load JSON file from S3
    
    Args:
        bucket_name: S3 bucket name
        file_key: S3 object key (JSON file path)
        region_name: AWS region name
        
    Returns:
        Dictionary containing JSON data
    """
    loader = S3FileLoader(region_name)
    return loader.load_json_file(bucket_name, file_key)


def load_text_from_s3(bucket_name: str, 
                      file_key: str,
                      region_name: str = 'us-east-1',
                      encoding: str = 'utf-8') -> str:
    """
    Convenience function to load text file from S3
    
    Args:
        bucket_name: S3 bucket name
        file_key: S3 object key (text file path)
        region_name: AWS region name
        encoding: Text encoding (default: utf-8)
        
    Returns:
        String containing file content
    """
    loader = S3FileLoader(region_name)
    return loader.load_text_file(bucket_name, file_key, encoding)
