"""
VPBank K-MULT Agent Studio - Strands Agent Examples
Multi-Agent Hackathon 2025 - Group 181

Example usage of Strands Agent tools for banking automation
"""

import asyncio
import json
import logging
from typing import Dict, Any

# Import Strands Agent tools
from app.mutil_agent.agents.strands_tools import (
    compliance_validation_agent,
    risk_assessment_agent,
    document_intelligence_agent,
    vpbank_supervisor_agent
)

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def example_compliance_validation():
    """
    Example: Compliance validation for Letter of Credit document
    """
    print("\n" + "="*80)
    print("🔍 EXAMPLE 1: COMPLIANCE VALIDATION AGENT")
    print("="*80)
    
    # Sample LC document text
    lc_document = """
    LETTER OF CREDIT NO: LC-2025-001234
    DATE: 29/01/2025
    
    APPLICANT: ABC TRADING COMPANY LIMITED
    ADDRESS: 123 NGUYEN HUE STREET, DISTRICT 1, HO CHI MINH CITY, VIETNAM
    
    BENEFICIARY: XYZ EXPORT CORPORATION
    ADDRESS: 456 MAIN STREET, NEW YORK, USA
    
    AMOUNT: USD 500,000.00 (FIVE HUNDRED THOUSAND US DOLLARS)
    
    EXPIRY DATE: 28/02/2025
    EXPIRY PLACE: HO CHI MINH CITY, VIETNAM
    
    AVAILABLE WITH: VIETCOMBANK - HO CHI MINH CITY BRANCH
    BY: NEGOTIATION
    
    DOCUMENTS REQUIRED:
    1. COMMERCIAL INVOICE IN TRIPLICATE
    2. PACKING LIST IN DUPLICATE
    3. FULL SET OF CLEAN ON BOARD OCEAN BILLS OF LADING
    4. CERTIFICATE OF ORIGIN
    5. INSURANCE POLICY OR CERTIFICATE
    
    DESCRIPTION OF GOODS: ELECTRONIC COMPONENTS
    
    SHIPMENT FROM: HO CHI MINH PORT, VIETNAM
    SHIPMENT TO: NEW YORK PORT, USA
    
    LATEST SHIPMENT DATE: 15/02/2025
    
    SPECIAL CONDITIONS:
    - PARTIAL SHIPMENTS: NOT ALLOWED
    - TRANSSHIPMENT: ALLOWED
    - DOCUMENTS MUST BE PRESENTED WITHIN 21 DAYS AFTER SHIPMENT DATE
    """
    
    try:
        # Call compliance validation agent
        result_json = compliance_validation_agent(lc_document, "letter_of_credit")
        result = json.loads(result_json)
        
        print(f"✅ Compliance Status: {result.get('compliance_validation', {}).get('compliance_status', 'Unknown')}")
        print(f"📊 Confidence Score: {result.get('processing_info', {}).get('confidence_score', 'Unknown')}")
        print(f"🔍 Agent Analysis: {result.get('agent_analysis', 'No analysis available')[:200]}...")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


async def example_risk_assessment():
    """
    Example: Risk assessment for loan application
    """
    print("\n" + "="*80)
    print("📊 EXAMPLE 2: RISK ASSESSMENT AGENT")
    print("="*80)
    
    # Sample loan application data
    financial_docs = """
    FINANCIAL STATEMENT - ABC TRADING COMPANY LIMITED
    
    REVENUE (2024): 15,000,000,000 VND
    GROSS PROFIT: 3,000,000,000 VND
    NET PROFIT: 1,200,000,000 VND
    
    ASSETS:
    - CURRENT ASSETS: 8,000,000,000 VND
    - FIXED ASSETS: 12,000,000,000 VND
    - TOTAL ASSETS: 20,000,000,000 VND
    
    LIABILITIES:
    - CURRENT LIABILITIES: 4,000,000,000 VND
    - LONG-TERM DEBT: 6,000,000,000 VND
    - TOTAL LIABILITIES: 10,000,000,000 VND
    
    EQUITY: 10,000,000,000 VND
    
    CASH FLOW (2024): 2,500,000,000 VND
    DEBT-TO-EQUITY RATIO: 1.0
    CURRENT RATIO: 2.0
    """
    
    try:
        # Call risk assessment agent
        result_json = risk_assessment_agent(
            applicant_name="ABC Trading Company Limited",
            business_type="import_export",
            requested_amount=5000000000,  # 5 billion VND
            currency="VND",
            loan_term=24,
            loan_purpose="working_capital",
            assessment_type="comprehensive",
            collateral_type="real_estate",
            financial_documents=financial_docs
        )
        result = json.loads(result_json)
        
        print(f"✅ Risk Score: {result.get('risk_assessment', {}).get('risk_score', 'Unknown')}")
        print(f"📈 Risk Category: {result.get('risk_assessment', {}).get('risk_category', 'Unknown')}")
        print(f"💰 Requested Amount: {result.get('processing_info', {}).get('requested_amount', 'Unknown'):,.0f} {result.get('processing_info', {}).get('currency', '')}")
        print(f"🔍 Agent Analysis: {result.get('agent_analysis', 'No analysis available')[:200]}...")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


async def example_document_intelligence():
    """
    Example: Document intelligence for Vietnamese banking document
    """
    print("\n" + "="*80)
    print("📄 EXAMPLE 3: DOCUMENT INTELLIGENCE AGENT")
    print("="*80)
    
    # Sample Vietnamese banking document
    vietnamese_doc = """
    NGÂN HÀNG TMCP NGOẠI THƯƠNG VIỆT NAM
    CHI NHÁNH TP. HỒ CHÍ MINH
    
    GIẤY XÁC NHẬN TÀI KHOẢN
    
    Kính gửi: CÔNG TY TNHH THƯƠNG MẠI ABC
    Địa chỉ: 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
    
    Ngân hàng chúng tôi xin xác nhận:
    
    Số tài khoản: 0011001234567
    Tên tài khoản: CÔNG TY TNHH THƯƠNG MẠI ABC
    Loại tài khoản: Tài khoản thanh toán
    Đơn vị tiền tệ: VND
    
    Số dư tài khoản tại ngày 29/01/2025: 2,500,000,000 VND
    (Bằng chữ: Hai tỷ năm trăm triệu đồng)
    
    Tài khoản được mở từ ngày: 15/03/2020
    Tình trạng tài khoản: Hoạt động bình thường
    
    Giấy xác nhận này có giá trị trong 30 ngày kể từ ngày cấp.
    
    TP. Hồ Chí Minh, ngày 29 tháng 01 năm 2025
    
    GIÁM ĐỐC CHI NHÁNH
    (Ký tên và đóng dấu)
    
    NGUYỄN VĂN A
    """
    
    try:
        # Call document intelligence agent
        result_json = document_intelligence_agent(vietnamese_doc, "account_confirmation")
        result = json.loads(result_json)
        
        print(f"✅ Document Type: {result.get('processing_info', {}).get('document_type', 'Unknown')}")
        print(f"📊 Content Length: {result.get('processing_info', {}).get('content_length', 'Unknown')} characters")
        print(f"🎯 Confidence Score: {result.get('processing_info', {}).get('confidence_score', 'Unknown')}")
        print(f"🔍 Agent Analysis: {result.get('agent_analysis', 'No analysis available')[:200]}...")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


async def example_supervisor_orchestration():
    """
    Example: Supervisor agent orchestrating multiple agents
    """
    print("\n" + "="*80)
    print("🎯 EXAMPLE 4: SUPERVISOR AGENT ORCHESTRATION")
    print("="*80)
    
    # Complex banking request requiring multiple agents
    complex_request = """
    Tôi cần xử lý một gói tài liệu cho khoản vay 5 tỷ VND của Công ty ABC Trading.
    
    Tài liệu bao gồm:
    1. Đơn xin vay với thông tin: Công ty ABC Trading, ngành xuất nhập khẩu, vay 5 tỷ VND trong 24 tháng
    2. Báo cáo tài chính cho thấy doanh thu 15 tỷ, lợi nhuận 1.2 tỷ
    3. Thư tín dụng LC-2025-001234 trị giá 500,000 USD cần kiểm tra tuân thủ UCP 600
    
    Yêu cầu:
    - Đánh giá rủi ro tín dụng
    - Kiểm tra tuân thủ quy định
    - Phân tích tài liệu
    - Đưa ra khuyến nghị tổng thể
    """
    
    context = {
        "customer_type": "corporate",
        "loan_amount": 5000000000,
        "currency": "VND",
        "business_sector": "import_export",
        "processing_priority": "high"
    }
    
    try:
        # Call supervisor agent
        result_json = vpbank_supervisor_agent(complex_request, context)
        result = json.loads(result_json)
        
        print(f"✅ Processing Status: {result.get('status', 'Unknown')}")
        print(f"📋 Request Length: {result.get('processing_info', {}).get('request_length', 'Unknown')} characters")
        print(f"🤖 Available Agents: {', '.join(result.get('processing_info', {}).get('agents_available', []))}")
        print(f"🎯 Supervisor Response: {result.get('supervisor_response', 'No response available')[:300]}...")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


async def run_all_examples():
    """
    Run all Strands Agent examples
    """
    print("\n" + "🏦" + "="*78 + "🏦")
    print("  VPBank K-MULT Agent Studio - Strands Agent Examples")
    print("  Multi-Agent Hackathon 2025 - Group 181")
    print("🏦" + "="*78 + "🏦")
    
    # Run examples
    examples = [
        ("Compliance Validation", example_compliance_validation),
        ("Risk Assessment", example_risk_assessment),
        ("Document Intelligence", example_document_intelligence),
        ("Supervisor Orchestration", example_supervisor_orchestration)
    ]
    
    results = {}
    
    for name, example_func in examples:
        try:
            print(f"\n🚀 Running {name} example...")
            result = await example_func()
            results[name] = result
            print(f"✅ {name} completed successfully")
        except Exception as e:
            print(f"❌ {name} failed: {str(e)}")
            results[name] = None
    
    # Summary
    print("\n" + "="*80)
    print("📊 EXAMPLES SUMMARY")
    print("="*80)
    
    successful = sum(1 for result in results.values() if result is not None)
    total = len(results)
    
    print(f"✅ Successful: {successful}/{total}")
    print(f"❌ Failed: {total - successful}/{total}")
    
    for name, result in results.items():
        status = "✅ SUCCESS" if result is not None else "❌ FAILED"
        print(f"  {name}: {status}")
    
    print("\n🎉 All examples completed!")
    return results


if __name__ == "__main__":
    # Run examples
    asyncio.run(run_all_examples())
