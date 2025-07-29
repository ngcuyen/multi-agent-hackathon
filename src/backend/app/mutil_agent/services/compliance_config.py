"""
Compliance Service Configuration - Flexible and Extensible
Separates configuration from business logic for better maintainability
"""

import re
from typing import Dict, List, Any

class ComplianceConfig:
    """Configuration class for compliance service patterns and rules"""
    
    # Regulation mapping for different document types - easily extensible
    REGULATION_MAPPING = {
        'letter_of_credit': ['UCP600'],
        'standby_letter_of_credit': ['UCP600', 'ISP98'],  # Future expansion
        'documentary_collection': ['URC522'],  # Future expansion
        'commercial_invoice': ['UCP600'],
        'bill_of_lading': ['UCP600'],
        'insurance_document': ['UCP600'],
        'packing_list': ['UCP600'],
        # Can be expanded with more document types and regulations
    }
    
    # UCP 600 Article references for common violations
    UCP_ARTICLE_REFERENCES = {
        'missing_information': 'UCP 600 Article 14(a) - Document Examination',
        'discrepancy': 'UCP 600 Article 16 - Discrepant Documents',
        'expiry_date': 'UCP 600 Article 6 - Availability, Expiry Date',
        'amount_discrepancy': 'UCP 600 Article 18 - Commercial Invoice',
        'transport_document': 'UCP 600 Article 19-25 - Transport Documents',
        'insurance_document': 'UCP 600 Article 28 - Insurance Document',
        'late_presentation': 'UCP 600 Article 14(c) - Presentation Period',
        'partial_shipment': 'UCP 600 Article 31 - Partial Drawings/Shipments',
    }
    
    def get_applicable_regulations(self, document_type: str) -> List[str]:
        """Get applicable regulations for a document type"""
        return self.REGULATION_MAPPING.get(document_type, ['UCP600'])  # Default to UCP600
    
    def get_regulation_reference(self, violation_type: str) -> str:
        """Get UCP article reference for violation type"""
        return self.UCP_ARTICLE_REFERENCES.get(violation_type, 'UCP 600 - General Compliance')
    
    # Document classification patterns - easily extensible
    DOCUMENT_PATTERNS = {
        "balance_sheet": {
            "keywords": [
                'bảng cân đối kế toán', 'balance sheet', 'statement of financial position',
                'tài sản', 'assets', 'nợ phải trả', 'liabilities', 'vốn chủ sở hữu', 'equity',
                'tổng tài sản', 'total assets', 'tổng nguồn vốn', 'total equity and liabilities'
            ],
            "patterns": [
                r'bảng\s*cân\s*đối\s*kế\s*toán',
                r'balance\s*sheet',
                r'tổng\s*tài\s*sản[:\s]*[\d,]+',
                r'total\s*assets[:\s]*[\d,]+',
                r'vốn\s*chủ\s*sở\s*hữu[:\s]*[\d,]+'
            ],
            "weight": 1.2
        },
        "income_statement": {
            "keywords": [
                'báo cáo kết quả kinh doanh', 'income statement', 'profit and loss',
                'doanh thu', 'revenue', 'chi phí', 'expenses', 'lợi nhuận', 'profit',
                'thu nhập', 'income', 'lãi lỗ', 'earnings'
            ],
            "patterns": [
                r'báo\s*cáo\s*kết\s*quả\s*kinh\s*doanh',
                r'income\s*statement',
                r'profit\s*and\s*loss',
                r'doanh\s*thu[:\s]*[\d,]+',
                r'lợi\s*nhuận[:\s]*[\d,]+'
            ],
            "weight": 1.2
        },
        "cash_flow_statement": {
            "keywords": [
                'báo cáo lưu chuyển tiền tệ', 'cash flow statement', 'statement of cash flows',
                'lưu chuyển tiền', 'cash flows', 'tiền và tương đương tiền', 'cash equivalents',
                'hoạt động kinh doanh', 'operating activities', 'hoạt động đầu tư', 'investing activities'
            ],
            "patterns": [
                r'báo\s*cáo\s*lưu\s*chuyển\s*tiền\s*tệ',
                r'cash\s*flow\s*statement',
                r'lưu\s*chuyển\s*tiền[:\s]*[\d,]+',
                r'operating\s*activities'
            ],
            "weight": 1.2
        },
        "equity_statement": {
            "keywords": [
                'báo cáo thay đổi vốn chủ sở hữu', 'statement of changes in equity',
                'thay đổi vốn', 'changes in equity', 'vốn góp', 'contributed capital',
                'lợi nhuận chưa phân phối', 'retained earnings'
            ],
            "patterns": [
                r'báo\s*cáo\s*thay\s*đổi\s*vốn',
                r'statement\s*of\s*changes\s*in\s*equity',
                r'thay\s*đổi\s*vốn\s*chủ\s*sở\s*hữu'
            ],
            "weight": 1.2
        },
        "notes_to_financial_statements": {
            "keywords": [
                'thuyết minh báo cáo tài chính', 'notes to financial statements',
                'thuyết minh', 'notes', 'giải trình', 'explanatory notes',
                'chính sách kế toán', 'accounting policies'
            ],
            "patterns": [
                r'thuyết\s*minh\s*báo\s*cáo\s*tài\s*chính',
                r'notes\s*to\s*financial\s*statements',
                r'chính\s*sách\s*kế\s*toán'
            ],
            "weight": 1.1
        },
        "audit_report": {
            "keywords": [
                'báo cáo kiểm toán', 'audit report', 'auditor report',
                'ý kiến kiểm toán', 'audit opinion', 'kiểm toán viên', 'auditor',
                'không có ý kiến ngoại trừ', 'unqualified opinion'
            ],
            "patterns": [
                r'báo\s*cáo\s*kiểm\s*toán',
                r'audit\s*report',
                r'ý\s*kiến\s*kiểm\s*toán',
                r'kiểm\s*toán\s*viên[:\s]*[A-Za-z\s]+'
            ],
            "weight": 1.3
        },
        "financial_report": {
            "keywords": [
                'báo cáo tài chính', 'financial report', 'financial statements',
                'báo cáo tài chính hợp nhất', 'consolidated financial statements',
                'báo cáo tài chính riêng', 'separate financial statements',
                'báo cáo tài chính tóm tắt', 'summary financial statements'
            ],
            "patterns": [
                r'báo\s*cáo\s*tài\s*chính',
                r'financial\s*report',
                r'financial\s*statements',
                r'báo\s*cáo\s*tài\s*chính\s*(hợp\s*nhất|riêng|tóm\s*tắt)'
            ],
            "weight": 1.0
        },
        "commercial_invoice": {
            "keywords": [
                'commercial invoice', 'hóa đơn thương mại', 'invoice no',
                'số hóa đơn', 'invoice number', 'tax invoice'
            ],
            "patterns": [
                r'commercial\s*invoice',
                r'invoice\s*no[:\.]?\s*[A-Z0-9\-/]+',
                r'hóa\s*đơn\s*thương\s*mại'
            ],
            "weight": 1.2
        },
        "letter_of_credit": {
            "keywords": [
                'letter of credit', 'tín dụng thư', 'l/c no', 'credit no',
                'documentary credit', 'irrevocable credit'
            ],
            "patterns": [
                r'letter\s*of\s*credit',
                r'l/c\s*no[:\.]?\s*[A-Z0-9\-/]+',
                r'tín\s*dụng\s*thư'
            ],
            "weight": 1.2
        },
        "bill_of_lading": {
            "keywords": [
                'bill of lading', 'vận đơn', 'b/l no', 'shipping document',
                'ocean bill of lading', 'master bill'
            ],
            "patterns": [
                r'bill\s*of\s*lading',
                r'b/l\s*no[:\.]?\s*[A-Z0-9\-/]+',
                r'vận\s*đơn'
            ],
            "weight": 1.2
        },
        "bank_guarantee": {
            "keywords": [
                'bank guarantee', 'bảo lãnh ngân hàng', 'guarantee no',
                'performance guarantee', 'payment guarantee'
            ],
            "patterns": [
                r'bank\s*guarantee',
                r'bảo\s*lãnh\s*ngân\s*hàng',
                r'guarantee\s*no[:\.]?\s*[A-Z0-9\-/]+'
            ],
            "weight": 1.2
        },
        "insurance_certificate": {
            "keywords": [
                'insurance certificate', 'chứng từ bảo hiểm', 'insurance policy',
                'marine insurance', 'cargo insurance'
            ],
            "patterns": [
                r'insurance\s*certificate',
                r'chứng\s*từ\s*bảo\s*hiểm',
                r'insurance\s*policy'
            ],
            "weight": 1.2
        },
        "contract": {
            "keywords": [
                'contract', 'hợp đồng', 'agreement', 'thỏa thuận',
                'purchase agreement', 'sales contract'
            ],
            "patterns": [
                r'contract\s*no[:\.]?\s*[A-Z0-9\-/]+',
                r'hợp\s*đồng\s*số[:\.]?\s*[A-Z0-9\-/]+',
                r'agreement\s*no'
            ],
            "weight": 1.0
        }
    }

    # Field extraction patterns - common across document types
    FIELD_PATTERNS = {
        "dates": [
            r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b',  # DD/MM/YYYY or DD-MM-YYYY
            r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b',  # YYYY/MM/DD or YYYY-MM-DD
            r'\b(\d{1,2})\s+(tháng|month)\s+(\d{1,2})\s+(năm|year)\s+(\d{4})\b',  # Vietnamese format
            r'\b(\d{1,2})\s+(\w+)\s+(\d{4})\b',  # DD Month YYYY
            r'ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})'  # Vietnamese full format
        ],
        "amounts": [
            r'(USD|VND|EUR|JPY|GBP)\s*([\d,]+\.?\d*)',  # Currency prefix
            r'([\d,]+\.?\d*)\s*(USD|VND|EUR|JPY|GBP)',  # Currency suffix
            r'\$\s*([\d,]+\.?\d*)',  # Dollar sign
            r'([\d,]+\.?\d*)\s*(triệu|million|tỷ|billion)\s*(VND|USD|EUR)?',  # Vietnamese amounts
            r'([\d,]+\.?\d*)\s*(đồng|dong)',  # Vietnamese dong
            r'tổng\s*[^:]*:\s*([\d,]+\.?\d*)\s*(triệu|tỷ)?\s*(VND|đồng)?'  # Total amounts
        ],
        "reference_numbers": [
            r'(invoice|inv|hóa\s*đơn)\s*no[:\.]?\s*([A-Z0-9\-/]+)',
            r'(l/c|letter\s*of\s*credit|tín\s*dụng\s*thư)\s*no[:\.]?\s*([A-Z0-9\-/]+)',
            r'(b/l|bill\s*of\s*lading|vận\s*đơn)\s*no[:\.]?\s*([A-Z0-9\-/]+)',
            r'(contract|hợp\s*đồng)\s*no[:\.]?\s*([A-Z0-9\-/]+)',
            r'(guarantee|bảo\s*lãnh)\s*no[:\.]?\s*([A-Z0-9\-/]+)',
            r'số[:\.]?\s*([A-Z0-9\-/]+)'  # Generic Vietnamese number
        ]
    }

    # Document-specific field extractors
    DOCUMENT_SPECIFIC_FIELDS = {
        "balance_sheet": {
            "entity_name": [
                r'(ngân\s*hàng\s*[^,\n]+)',
                r'(công\s*ty\s*[^,\n]+)',
                r'([A-Z][^,\n]*(?:bank|company|corp|ltd)[^,\n]*)'
            ],
            "report_date": [
                r'tại\s*ngày\s*([^,\n]+)',
                r'as\s*at\s*([^,\n]+)',
                r'ngày\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})'
            ],
            "total_assets": [
                r'tổng\s*tài\s*sản[:\s]*([\d,]+\.?\d*)',
                r'total\s*assets[:\s]*([\d,]+\.?\d*)'
            ]
        },
        "income_statement": {
            "entity_name": [
                r'(ngân\s*hàng\s*[^,\n]+)',
                r'(công\s*ty\s*[^,\n]+)'
            ],
            "period": [
                r'cho\s*kỳ\s*([^,\n]+)',
                r'for\s*the\s*period\s*([^,\n]+)',
                r'năm\s*kết\s*thúc\s*([^,\n]+)'
            ],
            "revenue": [
                r'doanh\s*thu[:\s]*([\d,]+\.?\d*)',
                r'revenue[:\s]*([\d,]+\.?\d*)'
            ]
        },
        "cash_flow_statement": {
            "entity_name": [
                r'(ngân\s*hàng\s*[^,\n]+)',
                r'(công\s*ty\s*[^,\n]+)'
            ],
            "period": [
                r'cho\s*kỳ\s*([^,\n]+)',
                r'for\s*the\s*period\s*([^,\n]+)'
            ],
            "operating_cash_flow": [
                r'lưu\s*chuyển\s*tiền\s*từ\s*hoạt\s*động\s*kinh\s*doanh[:\s]*([\d,]+\.?\d*)',
                r'cash\s*flows?\s*from\s*operating\s*activities[:\s]*([\d,]+\.?\d*)'
            ]
        },
        "audit_report": {
            "auditor_name": [
                r'kiểm\s*toán\s*viên[:\s]*([^,\n]+)',
                r'auditor[:\s]*([^,\n]+)',
                r'công\s*ty\s*kiểm\s*toán[:\s]*([^,\n]+)'
            ],
            "audit_opinion": [
                r'ý\s*kiến\s*kiểm\s*toán[:\s]*([^,\n]+)',
                r'audit\s*opinion[:\s]*([^,\n]+)'
            ],
            "report_date": [
                r'ngày\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
                r'dated?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})'
            ]
        },
        "financial_report": {
            "entity_name": [
                r'(ngân\s*hàng\s*[^,\n]+)',
                r'(bank\s*[^,\n]+)',
                r'(công\s*ty\s*[^,\n]+)',
                r'(company\s*[^,\n]+)'
            ],
            "report_period": [
                r'(kỳ\s*[^,\n]+)',
                r'(period\s*[^,\n]+)',
                r'(cho\s*kỳ\s*[^,\n]+)',
                r'(for\s*the\s*period\s*[^,\n]+)',
                r'(năm\s*\d{4})',
                r'(year\s*\d{4})'
            ]
        },
        "commercial_invoice": {
            "seller": [
                r'(from|seller|người\s*bán)[:\s]*([^,\n]+)',
                r'(exporter|xuất\s*khẩu)[:\s]*([^,\n]+)'
            ],
            "buyer": [
                r'(to|buyer|người\s*mua)[:\s]*([^,\n]+)',
                r'(importer|nhập\s*khẩu)[:\s]*([^,\n]+)'
            ]
        },
        "letter_of_credit": {
            "applicant": [
                r'(applicant|người\s*xin\s*mở)[:\s]*([^,\n]+)'
            ],
            "beneficiary": [
                r'(beneficiary|người\s*thụ\s*hưởng)[:\s]*([^,\n]+)'
            ]
        }
    }

    # UCP 600 applicable document types
    UCP_APPLICABLE_DOCUMENTS = {
        "commercial_invoice",
        "letter_of_credit", 
        "bill_of_lading",
        "bank_guarantee",
        "insurance_certificate"
    }

    # Financial document types (non-UCP)
    FINANCIAL_DOCUMENT_TYPES = {
        "balance_sheet",
        "income_statement", 
        "cash_flow_statement",
        "equity_statement",
        "notes_to_financial_statements",
        "audit_report",
        "financial_report"
    }

    # Document type definitions for API
    DOCUMENT_TYPE_DEFINITIONS = {
        "commercial_invoice": {
            "name": "Commercial Invoice",
            "description": "Hóa đơn thương mại trong tín dụng thư",
            "ucp_articles": ["Article 18"],
            "ucp_applicable": True
        },
        "letter_of_credit": {
            "name": "Letter of Credit", 
            "description": "Tín dụng thư",
            "ucp_articles": ["Article 1-39"],
            "ucp_applicable": True
        },
        "bill_of_lading": {
            "name": "Bill of Lading",
            "description": "Vận đơn",
            "ucp_articles": ["Article 20"],
            "ucp_applicable": True
        },
        "bank_guarantee": {
            "name": "Bank Guarantee",
            "description": "Bảo lãnh ngân hàng",
            "ucp_articles": ["Article 2"],
            "ucp_applicable": True
        },
        "insurance_certificate": {
            "name": "Insurance Certificate",
            "description": "Chứng từ bảo hiểm",
            "ucp_articles": ["Article 28"],
            "ucp_applicable": True
        },
        "balance_sheet": {
            "name": "Balance Sheet",
            "description": "Bảng cân đối kế toán - báo cáo tình hình tài chính",
            "ucp_articles": [],
            "ucp_applicable": False
        },
        "income_statement": {
            "name": "Income Statement", 
            "description": "Báo cáo kết quả kinh doanh - báo cáo lãi lỗ",
            "ucp_articles": [],
            "ucp_applicable": False
        },
        "cash_flow_statement": {
            "name": "Cash Flow Statement",
            "description": "Báo cáo lưu chuyển tiền tệ",
            "ucp_articles": [],
            "ucp_applicable": False
        },
        "equity_statement": {
            "name": "Statement of Changes in Equity",
            "description": "Báo cáo thay đổi vốn chủ sở hữu",
            "ucp_articles": [],
            "ucp_applicable": False
        },
        "notes_to_financial_statements": {
            "name": "Notes to Financial Statements",
            "description": "Thuyết minh báo cáo tài chính",
            "ucp_articles": [],
            "ucp_applicable": False
        },
        "audit_report": {
            "name": "Audit Report",
            "description": "Báo cáo kiểm toán độc lập",
            "ucp_articles": [],
            "ucp_applicable": False
        },
        "financial_report": {
            "name": "Financial Report",
            "description": "Báo cáo tài chính tổng hợp (không áp dụng UCP 600)",
            "ucp_articles": [],
            "ucp_applicable": False
        },
        "contract": {
            "name": "Contract/Agreement",
            "description": "Hợp đồng (có thể chứa điều khoản L/C)",
            "ucp_articles": [],
            "ucp_applicable": False
        },
        "general_document": {
            "name": "General Document",
            "description": "Tài liệu chung cần xác minh",
            "ucp_articles": [],
            "ucp_applicable": False
        }
    }

    @classmethod
    def is_ucp_applicable(cls, document_type: str) -> bool:
        """Check if document type is applicable for UCP 600"""
        return document_type in cls.UCP_APPLICABLE_DOCUMENTS

    @classmethod
    def is_financial_document(cls, document_type: str) -> bool:
        """Check if document type is a financial document"""
        return document_type in cls.FINANCIAL_DOCUMENT_TYPES

    @classmethod
    def get_document_weight(cls, document_type: str) -> float:
        """Get classification weight for document type"""
        return cls.DOCUMENT_PATTERNS.get(document_type, {}).get("weight", 1.0)

    @classmethod
    def add_document_pattern(cls, doc_type: str, keywords: List[str], patterns: List[str], weight: float = 1.0):
        """Add new document pattern dynamically"""
        cls.DOCUMENT_PATTERNS[doc_type] = {
            "keywords": keywords,
            "patterns": patterns,
            "weight": weight
        }

    @classmethod
    def add_field_pattern(cls, field_type: str, patterns: List[str]):
        """Add new field extraction pattern"""
        if field_type not in cls.FIELD_PATTERNS:
            cls.FIELD_PATTERNS[field_type] = []
        cls.FIELD_PATTERNS[field_type].extend(patterns)
