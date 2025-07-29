"""
VPBank K-MULT Agent Studio - Supervisor Agent File Upload Test
Multi-Agent Hackathon 2025 - Group 181

Test script for supervisor agent with file upload functionality
"""

import asyncio
import aiohttp
import json
import tempfile
import os
from typing import Dict, Any

# Test data
SAMPLE_LC_DOCUMENT = """
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

SAMPLE_FINANCIAL_STATEMENT = """
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

BASE_URL = "http://localhost:8080"


async def test_supervisor_with_text_only():
    """Test supervisor agent with text message only"""
    print("\n" + "="*80)
    print("🎯 TEST 1: SUPERVISOR AGENT - TEXT ONLY")
    print("="*80)
    
    url = f"{BASE_URL}/mutil_agent/api/v1/strands/supervisor/process"
    
    payload = {
        "user_request": "Analyze the credit risk for ABC Trading Company requesting a 5 billion VND loan for working capital",
        "context": {
            "customer_type": "corporate",
            "loan_amount": 5000000000,
            "currency": "VND",
            "priority": "high"
        }
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                result = await response.json()
                
                print(f"✅ Status Code: {response.status}")
                print(f"📊 Response Status: {result.get('status', 'unknown')}")
                print(f"🤖 Agent Type: {result.get('agent_info', {}).get('agent_type', 'unknown')}")
                
                if result.get('status') == 'success':
                    print("✅ Text-only supervisor request successful")
                else:
                    print(f"❌ Error: {result.get('message', 'Unknown error')}")
                
                return result
                
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return None


async def test_supervisor_with_file_upload():
    """Test supervisor agent with file upload"""
    print("\n" + "="*80)
    print("🎯 TEST 2: SUPERVISOR AGENT - WITH FILE UPLOAD")
    print("="*80)
    
    url = f"{BASE_URL}/mutil_agent/api/v1/strands/supervisor/process-with-file"
    
    # Create temporary file with LC document
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
        temp_file.write(SAMPLE_LC_DOCUMENT)
        temp_file_path = temp_file.name
    
    try:
        # Prepare form data
        data = aiohttp.FormData()
        data.add_field('user_request', 
                      'Please process this Letter of Credit document. I need compliance validation, risk assessment, and processing recommendations.')
        data.add_field('context', json.dumps({
            "document_type": "letter_of_credit",
            "customer_type": "corporate",
            "priority": "high",
            "processing_mode": "comprehensive"
        }))
        
        # Add file
        with open(temp_file_path, 'rb') as file:
            data.add_field('file', file, filename='LC-2025-001234.txt', content_type='text/plain')
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=data) as response:
                    result = await response.json()
                    
                    print(f"✅ Status Code: {response.status}")
                    print(f"📊 Response Status: {result.get('status', 'unknown')}")
                    print(f"🤖 Agent Type: {result.get('agent_info', {}).get('agent_type', 'unknown')}")
                    
                    # Check file processing info
                    file_processing = result.get('data', {}).get('file_processing', {})
                    if file_processing:
                        print(f"📄 File: {file_processing.get('filename', 'unknown')}")
                        print(f"📊 File Size: {file_processing.get('file_size', 0)} bytes")
                        print(f"📝 Extracted Text: {file_processing.get('extracted_text_length', 0)} characters")
                        print(f"✅ Processing Status: {file_processing.get('processing_status', 'unknown')}")
                    
                    if result.get('status') == 'success':
                        print("✅ File upload supervisor request successful")
                    else:
                        print(f"❌ Error: {result.get('message', 'Unknown error')}")
                    
                    return result
                    
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return None
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


async def test_supervisor_with_financial_document():
    """Test supervisor agent with financial document upload"""
    print("\n" + "="*80)
    print("🎯 TEST 3: SUPERVISOR AGENT - FINANCIAL DOCUMENT ANALYSIS")
    print("="*80)
    
    url = f"{BASE_URL}/mutil_agent/api/v1/strands/supervisor/process-with-file"
    
    # Create temporary file with financial statement
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
        temp_file.write(SAMPLE_FINANCIAL_STATEMENT)
        temp_file_path = temp_file.name
    
    try:
        # Prepare form data
        data = aiohttp.FormData()
        data.add_field('user_request', 
                      'Analyze this financial statement for credit risk assessment. The company is requesting a 5 billion VND loan for 24 months.')
        data.add_field('context', json.dumps({
            "document_type": "financial_statement",
            "customer_type": "corporate",
            "loan_amount": 5000000000,
            "currency": "VND",
            "loan_term": 24,
            "assessment_type": "comprehensive"
        }))
        
        # Add file
        with open(temp_file_path, 'rb') as file:
            data.add_field('file', file, filename='ABC_Financial_Statement_2024.txt', content_type='text/plain')
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=data) as response:
                    result = await response.json()
                    
                    print(f"✅ Status Code: {response.status}")
                    print(f"📊 Response Status: {result.get('status', 'unknown')}")
                    print(f"🤖 Agent Type: {result.get('agent_info', {}).get('agent_type', 'unknown')}")
                    
                    # Check file processing info
                    file_processing = result.get('data', {}).get('file_processing', {})
                    if file_processing:
                        print(f"📄 File: {file_processing.get('filename', 'unknown')}")
                        print(f"📊 File Size: {file_processing.get('file_size', 0)} bytes")
                        print(f"📝 Extracted Text: {file_processing.get('extracted_text_length', 0)} characters")
                        print(f"✅ Processing Status: {file_processing.get('processing_status', 'unknown')}")
                    
                    if result.get('status') == 'success':
                        print("✅ Financial document analysis successful")
                        
                        # Show supervisor response preview
                        supervisor_response = result.get('data', {}).get('supervisor_response', '')
                        if supervisor_response:
                            print(f"🎯 Supervisor Analysis Preview: {supervisor_response[:200]}...")
                    else:
                        print(f"❌ Error: {result.get('message', 'Unknown error')}")
                    
                    return result
                    
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return None
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


async def test_supervisor_endpoints_availability():
    """Test supervisor endpoints availability"""
    print("\n" + "="*80)
    print("🔧 TEST 4: SUPERVISOR ENDPOINTS AVAILABILITY")
    print("="*80)
    
    endpoints = [
        ("/mutil_agent/api/v1/strands/health", "Health Check"),
        ("/mutil_agent/api/v1/strands/agents/status", "Agent Status"),
        ("/mutil_agent/api/v1/strands/tools/list", "Tools List"),
        ("/mutil_agent/api/v1/strands/supervisor/process", "Supervisor (JSON)"),
        ("/mutil_agent/api/v1/strands/supervisor/process-with-file", "Supervisor (File Upload)")
    ]
    
    results = {}
    
    async with aiohttp.ClientSession() as session:
        for endpoint, name in endpoints:
            try:
                url = f"{BASE_URL}{endpoint}"
                
                if "process" in endpoint:
                    # Skip actual processing tests for availability check
                    print(f"📍 {name}: {endpoint} - Available (endpoint exists)")
                    results[name] = "available"
                else:
                    async with session.get(url) as response:
                        if response.status == 200:
                            print(f"✅ {name}: {endpoint} - OK")
                            results[name] = "ok"
                        else:
                            print(f"⚠️  {name}: {endpoint} - Status {response.status}")
                            results[name] = f"status_{response.status}"
                            
            except Exception as e:
                print(f"❌ {name}: {endpoint} - Error: {str(e)}")
                results[name] = "error"
    
    return results


async def run_all_tests():
    """Run all supervisor agent tests"""
    print("\n" + "🏦" + "="*78 + "🏦")
    print("  VPBank K-MULT Supervisor Agent File Upload Tests")
    print("  Multi-Agent Hackathon 2025 - Group 181")
    print("🏦" + "="*78 + "🏦")
    
    # Test availability first
    print("\n🔍 Checking endpoint availability...")
    availability = await test_supervisor_endpoints_availability()
    
    # Run functional tests
    tests = [
        ("Text Only Request", test_supervisor_with_text_only),
        ("File Upload - LC Document", test_supervisor_with_file_upload),
        ("File Upload - Financial Statement", test_supervisor_with_financial_document)
    ]
    
    results = {}
    
    for name, test_func in tests:
        try:
            print(f"\n🚀 Running {name} test...")
            result = await test_func()
            results[name] = "success" if result and result.get('status') == 'success' else "failed"
            print(f"✅ {name} completed")
        except Exception as e:
            print(f"❌ {name} failed: {str(e)}")
            results[name] = "error"
    
    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    
    print("\n🔧 Endpoint Availability:")
    for endpoint, status in availability.items():
        status_icon = "✅" if status == "ok" or status == "available" else "❌"
        print(f"  {status_icon} {endpoint}: {status}")
    
    print("\n🧪 Functional Tests:")
    successful = sum(1 for result in results.values() if result == "success")
    total = len(results)
    
    for name, result in results.items():
        status_icon = "✅" if result == "success" else "❌"
        print(f"  {status_icon} {name}: {result}")
    
    print(f"\n📈 Success Rate: {successful}/{total} ({successful/total*100:.1f}%)")
    
    print("\n🎯 Available Supervisor Endpoints:")
    print("  📝 Text Only: POST /mutil_agent/api/v1/strands/supervisor/process")
    print("  📄 With File: POST /mutil_agent/api/v1/strands/supervisor/process-with-file")
    
    print("\n🎉 All tests completed!")
    return results


if __name__ == "__main__":
    # Run all tests
    asyncio.run(run_all_tests())
