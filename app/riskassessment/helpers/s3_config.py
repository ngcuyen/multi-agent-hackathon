"""
S3 Configuration Helper
Simplified configuration for S3 operations using IAM roles or default credentials
"""

from typing import Optional
from dataclasses import dataclass
from app.riskassessment.config import (
    AWS_REGION,
    S3_BUCKET_NAME
)


@dataclass
class S3Config:
    """Simplified S3 Configuration class - uses IAM roles or default credentials"""
    region_name: str = AWS_REGION or 'ap-southeast-1'
    bucket_name: Optional[str] = None
    
    @classmethod
    def from_env(cls) -> 'S3Config':
        """
        Create S3Config from environment variables
        
        Expected environment variables:
        - AWS_REGION (defaults to us-east-1)
        - S3_BUCKET_NAME
        
        Returns:
            S3Config instance
        """
        return cls(
            region_name=AWS_REGION,
            bucket_name=S3_BUCKET_NAME
        )


def get_s3_config() -> S3Config:
    """
    Get S3 configuration from environment variables
    
    Returns:
        S3Config instance
    """
    return S3Config.from_env()
