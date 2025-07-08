# Compliance Agent - AI Document Validation

## Overview

Compliance Agent là hệ thống AI tự động kiểm tra tuân thủ tài liệu cho ngành ngân hàng và tài chính. Hệ thống sử dụng OCR và AI để phân tích tài liệu theo các quy định UCP 600 và chuẩn mực kế toán VAS/IFRS.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PDF Input     │───▶│   OCR Process   │───▶│  Classification │
│                 │    │  (Tesseract)    │    │   (AI Pattern)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Enhanced Report │◀───│ AI Validation   │◀───│ Field Extraction│
│   (JSON)        │    │ (AWS Bedrock)   │    │  (Multi-pattern)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Configuration Layer** (`compliance_config.py`)
   - Document patterns và field extraction rules
   - Regulation mapping cho từng loại tài liệu

2. **Service Layer** (`compliance_service.py`)
   - Document classification với confidence scoring
   - AI validation sử dụng AWS Bedrock Claude 3.7
   - Enhanced report generation

3. **API Layer** (`compliance_routes.py`)
   - RESTful endpoints cho document validation
   - File upload và text processing

## Supported Documents

### Trade Documents (UCP 600)
- Commercial Invoice (Article 18)
- Letter of Credit (Articles 1-39)
- Bill of Lading (Article 20)
- Bank Guarantee (Article 2)
- Insurance Certificate (Article 28)

### Financial Documents (VAS/IFRS)
- Balance Sheet (VAS 01)
- Income Statement (VAS 01)
- Cash Flow Statement (VAS 02)
- Audit Report (Vietnamese Standards)
- Notes to Financial Statements

## API Endpoints

### POST /validate
Validate document compliance
```bash
curl -X POST "http://localhost:8080/riskassessment/api/v1/compliance/validate" \
  -H "Content-Type: application/json" \
  -d '{"text": "COMMERCIAL INVOICE\nInvoice No: INV-2024-001"}'
```

### POST /query
Query UCP 600 regulations
```bash
curl -X POST "http://localhost:8080/riskassessment/api/v1/compliance/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "UCP 600 Article 18 requirements"}'
```

### POST /document
Upload file for validation
```bash
curl -X POST "http://localhost:8080/riskassessment/api/v1/compliance/document" \
  -F "file=@document.pdf"
```

### GET /health
Service health check

### GET /types
Get supported document types

## Response Format

```json
{
  "status": "SUCCESS",
  "data": {
    "compliance_status": "COMPLIANT",
    "confidence_score": 0.95,
    "document_type": "commercial_invoice",
    "is_trade_document": true,
    "document_analysis": {
      "classification_confidence": 0.88,
      "document_category": {
        "category": "Trade Document",
        "business_purpose": "Invoice for international trade"
      },
      "applicable_regulations": [{
        "regulation": "UCP 600",
        "applicable_articles": ["Article 18"]
      }],
      "field_completeness": {
        "completeness_score": 0.83,
        "missing_mandatory": ["seller", "buyer"]
      }
    },
    "compliance_summary": {
      "critical_issues": 0,
      "warnings": 1,
      "action_required": "No action required"
    },
    "violations": [],
    "recommendations": [{
      "description": "Verify goods description matches L/C",
      "priority": "MEDIUM"
    }],
    "processing_time": 15.74
  }
}
```

## Performance

- **Trade Documents**: 15-25 seconds (với UCP validation)
- **Financial Documents**: 0.01-0.1 seconds (pattern-based)
- **Classification Accuracy**: 85-95%
- **Field Extraction**: 70-90% completeness

## Setup & Testing

### Start Service
```bash
docker-compose up --build
```

### Run Tests
```bash
python3 test_compliance_api.py
python3 test_enhanced_report.py
python3 test_financial_subtypes.py
```

## Configuration

### Environment Variables
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
KNOWLEDGEBASE_ID=XLI7N7GPIK
CONVERSATION_CHAT_MODEL_NAME=claude-37-sonnet
```

### Adding New Document Types
```python
# In compliance_config.py
ComplianceConfig.add_document_pattern(
    doc_type="new_type",
    keywords=["keyword1", "keyword2"],
    patterns=[r"pattern1", r"pattern2"],
    weight=1.0
)
```

## Key Features

- **14 Document Types** supported
- **Multi-language** (English + Vietnamese)
- **OCR Integration** với Tesseract
- **AI Validation** với AWS Bedrock
- **Real-time Processing** với streaming responses
- **Comprehensive Reports** với actionable recommendations
- **Flexible Configuration** dễ dàng mở rộng
- **Production Ready** với Docker containerization

## Files Structure

```
app/riskassessment/
├── services/
│   ├── compliance_service.py      # Main service logic
│   └── compliance_config.py       # Configuration patterns
├── routes/v1/
│   └── compliance_routes.py       # API endpoints
└── tests/
    ├── test_compliance_api.py     # API tests
    ├── test_enhanced_report.py    # Report tests
    └── test_financial_subtypes.py # Document type tests
```

---

**Compliance Agent** - AI-Powered Document Validation for Financial Services
