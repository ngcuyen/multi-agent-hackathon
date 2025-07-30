import React, { useState } from 'react';
import { 
  SpaceBetween, 
  Badge, 
  Button, 
  ExpandableSection, 
  ProgressBar,
  Container,
  Header,
  StatusIndicator,
  Alert,
  KeyValuePairs,
  TextContent
} from '@cloudscape-design/components';

interface ComplianceViolation {
  type: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ComplianceRecommendation {
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ComplianceResultData {
  compliance_status: string;
  confidence_score: number;
  document_type: string;
  is_trade_document: boolean;
  extracted_fields: {
    dates?: string[];
    [key: string]: any;
  };
  ucp_regulations_applied?: string;
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  processing_time: number;
  timestamp?: number;
  knowledge_base_used?: string;
  document_analysis: {
    classification_confidence?: number;
    document_category?: {
      category: string;
      subcategory: string;
      business_purpose: string;
    };
    applicable_regulations?: Array<{
      regulation: string;
      full_name: string;
      applicable_articles: string[];
      mandatory: boolean;
      scope: string;
    }>;
    required_fields?: {
      mandatory: string[];
      optional: string[];
      ucp_specific: string[];
    };
    field_completeness?: {
      completeness_score: number;
      missing_mandatory: string[];
      found_fields: string[];
      total_mandatory: number;
      found_mandatory: number;
    };
  };
  compliance_summary: {
    overall_status: string;
    critical_issues: number;
    warnings: number;
    info_notes: number;
    action_required?: string;
  };
  processing_details?: {
    text_length: number;
    fields_extracted: number;
    kb_query_performed: boolean;
    ai_validation_used: boolean;
    processing_method: string;
  };
}

interface ComplianceResultProps {
  data: ComplianceResultData;
  message: string;
}

const ComplianceResult: React.FC<ComplianceResultProps> = ({ data, message }) => {
  const [expanded, setExpanded] = useState(false);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLIANT': return '#28a745';
      case 'REQUIRES_REVIEW': return '#ffc107';
      case 'NON_COMPLIANT': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLIANT': return 'Tuân thủ';
      case 'REQUIRES_REVIEW': return 'Cần xem xét';
      case 'NON_COMPLIANT': return 'Không tuân thủ';
      default: return status;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH': return '#dc3545';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
      default: return severity;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  const getDocumentTypeText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bill_of_lading': return 'Vận đơn (Bill of Lading)';
      case 'letter_of_credit': return 'Thư tín dụng (Letter of Credit)';
      case 'invoice': return 'Hóa đơn thương mại';
      case 'packing_list': return 'Danh sách đóng gói';
      default: return type;
    }
  };

  // Create summary tiles
  const summaryTiles = [
    {
      label: 'Trạng thái tuân thủ',
      value: getStatusText(data.compliance_status),
      color: getStatusColor(data.compliance_status)
    },
    {
      label: 'Độ tin cậy',
      value: `${Math.round(data.confidence_score * 100)}%`,
      color: data.confidence_score >= 0.8 ? '#28a745' : data.confidence_score >= 0.6 ? '#ffc107' : '#dc3545'
    },
    {
      label: 'Vấn đề phát hiện',
      value: `${data.compliance_summary.critical_issues + data.compliance_summary.warnings}`,
      color: data.compliance_summary.critical_issues > 0 ? '#dc3545' : data.compliance_summary.warnings > 0 ? '#ffc107' : '#28a745'
    }
  ];

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={`Thời gian xử lý: ${data.processing_time.toFixed(2)}s`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button 
                variant="normal" 
                onClick={() => setExpanded(!expanded)}
                iconName={expanded ? "angle-up" : "angle-down"}
              >
                {expanded ? 'Thu gọn' : 'Xem chi tiết'}
              </Button>
              <Badge color="blue">
                📄 {getDocumentTypeText(data.document_type)}
              </Badge>
            </SpaceBetween>
          }
        />
      }
    >
        {/* Summary Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {summaryTiles.map((tile, index) => (
            <div key={index} style={{ 
              backgroundColor: '#f8f9fa', 
              textAlign: 'center', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #e1e4e8',
              borderLeft: `4px solid ${tile.color}`
            }}>
              <SpaceBetween direction="vertical" size="xs">
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0073bb' }}>
                  {tile.value}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>
                  {tile.label}
                </div>
              </SpaceBetween>
            </div>
          ))}
        </div>

        {/* Action Required Alert */}
        {data.compliance_summary.action_required && (
          <Alert 
            type={data.compliance_summary.critical_issues > 0 ? "error" : "warning"} 
            header="Hành động cần thiết"
          >
            {data.compliance_summary.action_required}
          </Alert>
        )}

        {/* Violations Section */}
        {data.violations.length > 0 && (
          <Container 
            header={<Header variant="h3">⚠️ Vấn đề phát hiện ({data.violations.length})</Header>}
          >
            <SpaceBetween direction="vertical" size="s">
              {data.violations.map((violation, index) => (
                <div key={index} style={{ 
                  padding: '16px', 
                  backgroundColor: '#fff3cd', 
                  borderRadius: '8px', 
                  border: '1px solid #ffeaa7',
                  borderLeft: `4px solid ${getSeverityColor(violation.severity)}`
                }}>
                  <SpaceBetween direction="vertical" size="xs">
                    <SpaceBetween direction="horizontal" size="s">
                      <Badge color={violation.severity === 'HIGH' ? 'red' : violation.severity === 'MEDIUM' ? 'blue' : 'green'}>
                        {getSeverityText(violation.severity)}
                      </Badge>
                      <strong>{violation.type}</strong>
                    </SpaceBetween>
                    <TextContent>
                      <p style={{ margin: 0, fontSize: '14px' }}>{violation.description}</p>
                    </TextContent>
                  </SpaceBetween>
                </div>
              ))}
            </SpaceBetween>
          </Container>
        )}

        {/* Recommendations Section */}
        {data.recommendations.length > 0 && (
          <Container 
            header={<Header variant="h3">💡 Khuyến nghị ({data.recommendations.length})</Header>}
          >
            <SpaceBetween direction="vertical" size="s">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} style={{ 
                  padding: '16px', 
                  backgroundColor: '#d1ecf1', 
                  borderRadius: '8px', 
                  border: '1px solid #bee5eb',
                  borderLeft: '4px solid #17a2b8'
                }}>
                  <SpaceBetween direction="horizontal" size="s">
                    <span style={{ fontSize: '18px' }}>{getPriorityIcon(recommendation.priority)}</span>
                    <div>
                      <Badge color={recommendation.priority === 'HIGH' ? 'red' : recommendation.priority === 'MEDIUM' ? 'blue' : 'green'}>
                        Ưu tiên {getSeverityText(recommendation.priority)}
                      </Badge>
                      <TextContent>
                        <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{recommendation.description}</p>
                      </TextContent>
                    </div>
                  </SpaceBetween>
                </div>
              ))}
            </SpaceBetween>
          </Container>
        )}

        {/* Processing Message */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#d4edda', 
          borderRadius: '8px', 
          border: '1px solid #c3e6cb',
          borderLeft: '4px solid #28a745',
          marginBottom: '20px'
        }}>
          <TextContent>
            <p style={{ margin: 0, fontSize: '14px' }}>
              <StatusIndicator type="success" /> {message}
            </p>
          </TextContent>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <SpaceBetween direction="vertical" size="s">
            {/* Document Information */}
            <Container header={<Header variant="h3">📋 Thông tin tài liệu</Header>}>
              <KeyValuePairs
                columns={2}
                items={[
                  { label: 'Loại tài liệu', value: getDocumentTypeText(data.document_type) },
                  { label: 'Tài liệu thương mại', value: data.is_trade_document ? 'Có' : 'Không' },
                  { label: 'Độ tin cậy phân loại', value: `${Math.round((data.document_analysis.classification_confidence || 0) * 100)}%` },
                  { label: 'Knowledge Base', value: data.knowledge_base_used || 'N/A' }
                ]}
              />
            </Container>

            {/* Field Completeness */}
            {data.document_analysis.field_completeness && (
              <Container header={<Header variant="h3">📊 Độ hoàn thiện thông tin</Header>}>
                <SpaceBetween direction="vertical" size="s">
                  <ProgressBar
                    value={Math.round(data.document_analysis.field_completeness.completeness_score * 100)}
                    label="Độ hoàn thiện"
                    description={`${data.document_analysis.field_completeness.found_mandatory}/${data.document_analysis.field_completeness.total_mandatory} trường bắt buộc`}
                  />
                  <KeyValuePairs
                    columns={2}
                    items={[
                      { 
                        label: 'Trường đã tìm thấy', 
                        value: data.document_analysis.field_completeness.found_fields.join(', ') || 'Không có'
                      },
                      { 
                        label: 'Trường còn thiếu', 
                        value: data.document_analysis.field_completeness.missing_mandatory.slice(0, 3).join(', ') + 
                               (data.document_analysis.field_completeness.missing_mandatory.length > 3 ? '...' : '')
                      }
                    ]}
                  />
                </SpaceBetween>
              </Container>
            )}

            {/* Applicable Regulations */}
            {data.document_analysis.applicable_regulations && (
              <Container header={<Header variant="h3">📜 Quy định áp dụng</Header>}>
                <SpaceBetween direction="vertical" size="s">
                  {data.document_analysis.applicable_regulations.map((regulation, index) => (
                    <div key={index} style={{ 
                      padding: '16px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '8px', 
                      border: '1px solid #e1e4e8'
                    }}>
                      <SpaceBetween direction="vertical" size="xs">
                        <Header variant="h3">
                          {regulation.regulation} - {regulation.full_name}
                        </Header>
                        <TextContent>
                          <p><strong>Điều khoản áp dụng:</strong> {regulation.applicable_articles.join(', ')}</p>
                          <p><strong>Phạm vi:</strong> {regulation.scope}</p>
                          <p><strong>Bắt buộc:</strong> {regulation.mandatory ? 'Có' : 'Không'}</p>
                        </TextContent>
                      </SpaceBetween>
                    </div>
                  ))}
                </SpaceBetween>
              </Container>
            )}

            {/* UCP Regulations Analysis */}
            {data.ucp_regulations_applied && (
              <ExpandableSection headerText="📜 Phân tích quy định UCP">
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px', 
                  border: '1px solid #e1e4e8'
                }}>
                  <TextContent>
                    <p style={{ margin: 0, lineHeight: '1.6', fontSize: '13px' }}>
                      {data.ucp_regulations_applied}
                    </p>
                  </TextContent>
                </div>
              </ExpandableSection>
            )}

            {/* Required Fields Analysis */}
            {data.document_analysis.required_fields && (
              <ExpandableSection headerText="📝 Phân tích trường bắt buộc">
                <SpaceBetween direction="vertical" size="s">
                  <Container header={<Header variant="h3">Trường bắt buộc</Header>}>
                    <TextContent>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {data.document_analysis.required_fields.mandatory.map((field, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>{field}</li>
                        ))}
                      </ul>
                    </TextContent>
                  </Container>
                </SpaceBetween>
              </ExpandableSection>
            )}

            {/* Processing Details */}
            {data.processing_details && (
              <ExpandableSection headerText="🔧 Chi tiết xử lý">
                <KeyValuePairs
                  columns={2}
                  items={[
                    { label: 'Độ dài văn bản', value: `${data.processing_details.text_length} ký tự` },
                    { label: 'Trường đã trích xuất', value: data.processing_details.fields_extracted.toString() },
                    { label: 'Truy vấn Knowledge Base', value: data.processing_details.kb_query_performed ? 'Có' : 'Không' },
                    { label: 'Xác thực AI', value: data.processing_details.ai_validation_used ? 'Có' : 'Không' },
                    { label: 'Phương pháp xử lý', value: data.processing_details.processing_method }
                  ]}
                />
              </ExpandableSection>
            )}

            {/* Raw Data (for debugging) */}
            <ExpandableSection headerText="🔧 Dữ liệu thô (Debug)">
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px', 
                border: '1px solid #e1e4e8'
              }}>
                <TextContent>
                  <pre style={{ 
                    fontSize: '11px', 
                    margin: 0, 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </TextContent>
              </div>
            </ExpandableSection>
          </SpaceBetween>
        )}
      </Container>
    );
};

export default ComplianceResult;
