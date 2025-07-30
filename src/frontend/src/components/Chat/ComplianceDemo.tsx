import React from 'react';
import ComplianceResult, { ComplianceResultData } from './ComplianceResult';

const ComplianceDemo: React.FC = () => {
  const sampleData: ComplianceResultData = {
    "compliance_status": "REQUIRES_REVIEW",
    "confidence_score": 0.75,
    "document_type": "bill_of_lading",
    "is_trade_document": true,
    "extracted_fields": {
      "dates": [
        "84/8/3811"
      ]
    },
    "ucp_regulations_applied": "Based on the search results provided, I cannot find specific information about UCP 600 Article 20 regarding Bill of Lading with the dates ['84/8/3811'] mentioned. While Article 20 concerning Bill of Lading is referenced in the search results, the detailed content of this article is not fully provided, and there is no mention of the specific dates you're asking about.\n\nThe search results only show that Article 20 exists in the UCP 600 document and is titled \"Bill of Lading,\" but the complete text of this article is not available in the provided information.",
    "violations": [
      {
        "type": "Date Format Issue",
        "description": "Định dạng ngày '84/8/3811' trong thông tin trích xuất không phải là định dạng ngày hợp lệ và không khớp với ngày thực tế trong tài liệu (Jun 16, 2021)",
        "severity": "HIGH" as const
      },
      {
        "type": "Data Extraction Error",
        "description": "Hệ thống trích xuất sai số điện thoại '84 8 3811 3811' thành ngày '84/8/3811'",
        "severity": "HIGH" as const
      }
    ],
    "recommendations": [
      {
        "description": "Kiểm tra lại quá trình trích xuất dữ liệu từ Bill of Lading, đặc biệt là phần ngày tháng",
        "priority": "HIGH"
      },
      {
        "description": "Xác nhận ngày phát hành vận đơn là Jun 16, 2021 như đã ghi trong tài liệu",
        "priority": "HIGH"
      },
      {
        "description": "Đảm bảo vận đơn có đầy đủ thông tin theo Điều 20 UCP 600 (tên người gửi hàng, người nhận hàng, tên tàu, cảng xếp hàng, cảng dỡ hàng, mô tả hàng hóa)",
        "priority": "MEDIUM"
      }
    ],
    "processing_time": 18.51,
    "timestamp": 1753847740.0658565,
    "knowledge_base_used": "XLI7N7GPIK",
    "document_analysis": {
      "classification_confidence": 0.33,
      "document_category": {
        "category": "Trade Document",
        "subcategory": "Transport Documentation",
        "business_purpose": "Receipt and contract for cargo transportation"
      },
      "applicable_regulations": [
        {
          "regulation": "UCP 600",
          "full_name": "Uniform Customs and Practice for Documentary Credits",
          "applicable_articles": [
            "Article 20"
          ],
          "mandatory": true,
          "scope": "International trade finance"
        }
      ],
      "required_fields": {
        "mandatory": [
          "bl_number",
          "date",
          "shipper",
          "consignee",
          "vessel",
          "port_loading",
          "port_discharge"
        ],
        "optional": [
          "notify_party",
          "freight_terms",
          "container_numbers"
        ],
        "ucp_specific": [
          "bl_number",
          "on_board_date",
          "clean_receipt"
        ]
      },
      "field_completeness": {
        "completeness_score": 0.14,
        "missing_mandatory": [
          "bl_number",
          "shipper",
          "consignee",
          "vessel",
          "port_loading",
          "port_discharge"
        ],
        "found_fields": [
          "dates"
        ],
        "total_mandatory": 7,
        "found_mandatory": 1
      }
    },
    "compliance_summary": {
      "overall_status": "REQUIRES_REVIEW",
      "critical_issues": 2,
      "warnings": 0,
      "info_notes": 0,
      "action_required": "Manual review required - potential critical issues"
    },
    "processing_details": {
      "text_length": 2362,
      "fields_extracted": 1,
      "kb_query_performed": true,
      "ai_validation_used": true,
      "processing_method": "ucp_validation"
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔍 Compliance Result Demo</h2>
      <ComplianceResult 
        data={sampleData} 
        message="Kiểm tra tuân thủ file bill-of-lading-.pdf hoàn tất" 
      />
    </div>
  );
};

export default ComplianceDemo;
