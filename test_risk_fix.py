#!/usr/bin/env python3
"""
Test script để kiểm tra risk assessment với file upload
"""

import asyncio
import json
from typing import Dict, Any

# Mock file data
mock_file_data = {
    'filename': 'test_financial_report.pdf',
    'content_type': 'application/pdf',
    'raw_bytes': '''
    BAO CAO TAI CHINH CONG TY ABC
    
    Tong doanh thu: 5,000,000,000 VND
    Loi nhuan rong: 500,000,000 VND
    Tong tai san: 10,000,000,000 VND
    No phai tra: 3,000,000,000 VND
    
    Khach hang: Cong ty ABC
    Nganh nghe: San xuat
    So tien vay: 2,000,000,000 VND
    Muc dich: Mo rong san xuat
    '''.encode('utf-8')
}

async def test_risk_assessment_with_file():
    """Test risk assessment với file upload"""
    
    # Import risk service
    from src.backend.app.mutil_agent.services.risk_service import assess_risk
    from src.backend.app.mutil_agent.models.risk import RiskAssessmentRequest
    
    # Create request với file content
    request = RiskAssessmentRequest(
        applicant_name="Công ty ABC",
        business_type="sản xuất",
        requested_amount=2000000000,
        currency="VND",
        loan_term=24,
        loan_purpose="Mở rộng sản xuất",
        assessment_type="comprehensive",
        collateral_type="Tài sản đảm bảo",
        financial_documents=mock_file_data['raw_bytes'].decode('utf-8')
    )
    
    # Call risk assessment
    result = await assess_risk(request)
    
    print("=== KẾT QUẢ PHÂN TÍCH RỦI RO ===")
    print(f"Status: {result.get('status', 'N/A')}")
    print(f"Credit Score: {result.get('creditScore', 'N/A')}")
    print(f"Credit Rank: {result.get('creditRank', 'N/A')}")
    print(f"Approved: {result.get('approved', 'N/A')}")
    print(f"Max Loan Amount: {result.get('maxLoanAmount', 'N/A')}")
    print(f"Interest Rate: {result.get('interestRate', 'N/A')}")
    print(f"Confidence: {result.get('confidence', 'N/A')}")
    
    print("\n=== BÁO CÁO AI ===")
    print(result.get('ai_report', 'Không có báo cáo'))
    
    return result

if __name__ == "__main__":
    asyncio.run(test_risk_assessment_with_file()) 