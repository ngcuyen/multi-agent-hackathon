#!/usr/bin/env python3
"""
Script to analyze if a PDF is scanned or text-based
"""

import sys
import os
sys.path.append('/Users/uyen.lepham/ai-api-risk-assessment')

import PyPDF2
from io import BytesIO

def analyze_pdf_type(pdf_path):
    """Analyze if PDF is scanned or text-based"""
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        return
    
    print(f"🔍 Analyzing PDF: {os.path.basename(pdf_path)}")
    print("=" * 80)
    
    try:
        with open(pdf_path, 'rb') as f:
            pdf_content = f.read()
        
        print(f"📊 File size: {len(pdf_content):,} bytes")
        
        # Try PyPDF2 extraction
        pdf_file = BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
        
        print(f"📄 Total pages: {len(pdf_reader.pages)}")
        
        # Extract text from first few pages
        total_text = ""
        pages_with_text = 0
        
        for page_num in range(min(5, len(pdf_reader.pages))):
            try:
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                
                if page_text and len(page_text.strip()) > 10:
                    total_text += page_text
                    pages_with_text += 1
                    print(f"📝 Page {page_num + 1}: {len(page_text)} characters")
                else:
                    print(f"📝 Page {page_num + 1}: No text or very little text")
                    
            except Exception as e:
                print(f"❌ Page {page_num + 1}: Error - {str(e)}")
        
        print("\n" + "=" * 80)
        
        # Analysis
        if len(total_text.strip()) > 100:
            print("✅ **PDF TYPE: TEXT-BASED PDF**")
            print(f"📊 Extracted text: {len(total_text):,} characters")
            print(f"📊 Pages with text: {pages_with_text}/{min(5, len(pdf_reader.pages))}")
            print("💡 PyPDF2 can extract text successfully")
            print("💡 OCR is NOT needed")
            
            # Show sample text
            print(f"\n📄 Sample text (first 300 chars):")
            print("-" * 50)
            print(total_text[:300])
            if len(total_text) > 300:
                print("...")
            print("-" * 50)
            
        else:
            print("📷 **PDF TYPE: SCANNED PDF**")
            print(f"📊 Extracted text: {len(total_text):,} characters (very little)")
            print(f"📊 Pages with text: {pages_with_text}/{min(5, len(pdf_reader.pages))}")
            print("💡 PyPDF2 cannot extract meaningful text")
            print("💡 OCR is REQUIRED")
        
        # Check for images
        print(f"\n🖼️  **IMAGE ANALYSIS:**")
        images_found = 0
        
        for page_num in range(min(3, len(pdf_reader.pages))):
            try:
                page = pdf_reader.pages[page_num]
                if '/XObject' in page.get('/Resources', {}):
                    xobjects = page['/Resources']['/XObject']
                    for obj_name in xobjects:
                        obj = xobjects[obj_name]
                        if obj.get('/Subtype') == '/Image':
                            images_found += 1
            except:
                pass
        
        if images_found > 0:
            print(f"🖼️  Found {images_found} images in first 3 pages")
            print("💡 PDF contains images (could be scanned)")
        else:
            print("🖼️  No images found in first 3 pages")
            print("💡 PDF likely text-based")
            
    except Exception as e:
        print(f"❌ Error analyzing PDF: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        pdf_path = "/Users/uyen.lepham/Downloads/Pack Demo QDNB 1/3501.ESD_Quy dinh di cong tac tai VIB/2025(2)/PDFtext_3501.ESD - Quy dinh di cong tac tai VIB.pdf"
    
    analyze_pdf_type(pdf_path)
