import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  Box,
  Form,
  FormField,
  Input,
  Select,
  Button,
  Alert,
  ProgressBar,
  StatusIndicator,
  FileUpload,
  ColumnLayout,
  Cards,
  Badge,
  Textarea,
  PieChart,
  BarChart,
  ExpandableSection
} from '@cloudscape-design/components';
import { creditAPI, CreditAssessmentRequest, CreditAssessmentResult } from '../../services/api';
import ReactMarkdown from 'react-markdown';

interface CreditAssessmentPageProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

function fixMarkdown(text) {
  if (!text) return '';
  // Thêm xuống dòng trước mỗi heading kiểu ##1., ##2., ...
  let fixed = text.replace(/(##[0-9]+\.)/g, '\n$1');
  // Thêm xuống dòng trước mỗi dấu gạch đầu dòng nếu chưa có
  fixed = fixed.replace(/([^\n])(- )/g, '$1\n- ');
  // Loại bỏ các chuỗi 'additional_kwargs={}' nếu có
  fixed = fixed.replace(/additional_kwargs=\{\}/g, '');
  return fixed;
}

const CreditAssessmentPage: React.FC<CreditAssessmentPageProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('application');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [consentCIC, setConsentCIC] = useState(false);

  const [creditForm, setCreditForm] = useState({
    applicantName: '',
    businessType: '',
    requestedAmount: '',
    currency: 'VND',
    loanPurpose: '',
    loanTerm: '',
    collateralType: '',
    assessmentType: 'comprehensive'
  });

  const businessTypeOptions = [
    { label: 'Manufacturing', value: 'manufacturing' },
    { label: 'Trading', value: 'trading' },
    { label: 'Services', value: 'services' },
    { label: 'Real Estate', value: 'real_estate' },
    { label: 'Agriculture', value: 'agriculture' },
    { label: 'Technology', value: 'technology' }
  ];

  const assessmentTypeOptions = [
    { label: 'Comprehensive Assessment', value: 'comprehensive' },
    // { label: 'Quick Assessment', value: 'quick' },
    // { label: 'Risk Analysis Only', value: 'risk_only' },
    // { label: 'Financial Analysis Only', value: 'financial_only' }
  ];

  const collateralOptions = [
    { label: 'Real Estate', value: 'real_estate' },
    { label: 'Equipment', value: 'equipment' },
    { label: 'Inventory', value: 'inventory' },
    { label: 'Securities', value: 'securities' },
    { label: 'Cash Deposit', value: 'cash_deposit' },
    { label: 'No Collateral', value: 'none' }
  ];

  const riskFactors = [
    { name: 'Financial Health', value: 85, status: 'good' },
    { name: 'Industry Risk', value: 70, status: 'moderate' },
    { name: 'Management Quality', value: 90, status: 'excellent' },
    { name: 'Market Position', value: 75, status: 'good' },
    { name: 'Collateral Value', value: 95, status: 'excellent' }
  ];

  const handleCreditAssessment = async () => {
    if (
      !creditForm.applicantName ||
      !creditForm.requestedAmount ||
      !creditForm.loanTerm ||
      documents.length === 0 ||
      !consentCIC
    ) {
      onShowSnackbar('Vui lòng điền đầy đủ thông tin bắt buộc: Tên khách hàng, Số tiền vay, Kỳ hạn vay, Tài liệu đính kèm và đồng ý cho phép tra cứu CIC.', 'warning');
      return;
    }

    setLoading(true);
    try {
      onShowSnackbar('Đang phân tích hồ sơ tín dụng...', 'info');
      // Map form fields to backend keys
      const formData: CreditAssessmentRequest = {
        applicant_name: creditForm.applicantName,
        business_type: creditForm.businessType,
        requested_amount: creditForm.requestedAmount,
        currency: creditForm.currency,
        loan_purpose: creditForm.loanPurpose,
        loan_term: creditForm.loanTerm,
        collateral_type: creditForm.collateralType,
        assessment_type: creditForm.assessmentType
      };
      const response = await creditAPI.assessCreditWithFile(formData, documents);
      if (response.status === 'success' && response.data) {
        setAssessmentResult(response.data);
        onShowSnackbar('Đánh giá tín dụng hoàn tất!', 'success');
      } else {
        setAssessmentResult(response.data); // fallback mock data
        onShowSnackbar('Không thể lấy kết quả thực, hiển thị dữ liệu mẫu.', 'warning');
      }
    } catch (error) {
      onShowSnackbar('Không thể đánh giá tín dụng. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pieChartData = assessmentResult ? [
    { title: 'Low Risk', value: 60, color: '#1f77b4' },
    { title: 'Medium Risk', value: 30, color: '#ff7f0e' },
    { title: 'High Risk', value: 10, color: '#d62728' }
  ] : [];

  const barChartData = assessmentResult ? riskFactors.map(factor => ({
    x: factor.name,
    y: factor.value
  })) : [];

  const getApprovalBgColor = () => {
    if (assessmentResult.approved === false) return '#fff1f0'; // đỏ nhạt
    if (assessmentResult.recommendation?.toLowerCase().includes('hoãn')) return '#fffbe6'; // vàng nhạt
    if (assessmentResult.approved === true) return '#e6ffed'; // xanh lá nhạt
    return '#e6f7ff'; // mặc định xanh dương nhạt
  };

  const getApprovalTextColor = () => {
    if (assessmentResult.approved === false) return '#d32f2f'; // đỏ đậm
    if (assessmentResult.recommendation?.toLowerCase().includes('hoãn')) return '#b26a00'; // cam đậm
    if (assessmentResult.approved === true) return '#388e3c'; // xanh lá đậm
    return '#1976d2'; // xanh dương đậm
  };

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h1"
          description="AI-powered credit risk assessment and loan recommendation"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => window.history.back()}>
                Back to Dashboard
              </Button>
            </SpaceBetween>
          }
        >
          💰 Credit Proposal Assessment
        </Header>

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'application',
              label: 'Credit Application',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Alert type="info">
                    Enter credit application details for automated risk assessment and recommendation.
                  </Alert>

                  <Form>
                    <SpaceBetween direction="vertical" size="l">
                      <ColumnLayout columns={2}>
                        <FormField label={<span>Applicant Name <span style={{color: 'red'}}>*</span></span>} description="Full name or company name">
                          <Input
                            value={creditForm.applicantName}
                            onChange={({ detail }) => setCreditForm({ ...creditForm, applicantName: detail.value })}
                            placeholder="Nguyen Van A / ABC Company Ltd"
                          />
                        </FormField>

                        <FormField label="Business Type">
                          <Select
                            selectedOption={businessTypeOptions.find(opt => opt.value === creditForm.businessType) || null}
                            onChange={({ detail }) => setCreditForm({ ...creditForm, businessType: detail.selectedOption.value })}
                            options={businessTypeOptions}
                            placeholder="Select business type"
                          />
                        </FormField>
                      </ColumnLayout>

                      <ColumnLayout columns={3}>
                        <FormField label={<span>Requested Amount <span style={{color: 'red'}}>*</span></span>} description="Loan amount requested">
                          <Input
                            value={creditForm.requestedAmount}
                            onChange={({ detail }) => setCreditForm({ ...creditForm, requestedAmount: detail.value })}
                            placeholder="5,000,000,000"
                            type="number"
                          />
                        </FormField>

                        <FormField label="Currency">
                          <Select
                            selectedOption={{ label: 'VND - Vietnamese Dong', value: 'VND' }}
                            onChange={({ detail }) => setCreditForm({ ...creditForm, currency: detail.selectedOption.value })}
                            options={[
                              { label: 'VND - Vietnamese Dong', value: 'VND' },
                              { label: 'USD - US Dollar', value: 'USD' }
                            ]}
                          />
                        </FormField>

                        <FormField label={<span>Loan Term <span style={{color: 'red'}}>*</span></span>} description="In months">
                          <Input
                            value={creditForm.loanTerm}
                            onChange={({ detail }) => setCreditForm({ ...creditForm, loanTerm: detail.value })}
                            placeholder="36"
                            type="number"
                          />
                        </FormField>
                      </ColumnLayout>

                      <ColumnLayout columns={2}>
                        <FormField label="Loan Purpose">
                          <Textarea
                            value={creditForm.loanPurpose}
                            onChange={({ detail }) => setCreditForm({ ...creditForm, loanPurpose: detail.value })}
                            placeholder="Working capital, equipment purchase, expansion..."
                            rows={3}
                          />
                        </FormField>

                        <FormField label="Collateral Type">
                          <Select
                            selectedOption={collateralOptions.find(opt => opt.value === creditForm.collateralType) || null}
                            onChange={({ detail }) => setCreditForm({ ...creditForm, collateralType: detail.selectedOption.value })}
                            options={collateralOptions}
                            placeholder="Select collateral type"
                          />
                        </FormField>
                      </ColumnLayout>

                      <FormField label="Assessment Type">
                        <Select
                          selectedOption={assessmentTypeOptions.find(opt => opt.value === creditForm.assessmentType) || null}
                          onChange={({ detail }) => setCreditForm({ ...creditForm, assessmentType: detail.selectedOption.value })}
                          options={assessmentTypeOptions}
                        />
                      </FormField>

                      <FormField
                        label={<span>Supporting Documents <span style={{color: 'red'}}>*</span></span>}
                        description="Upload financial statements, business registration, etc."
                      >
                        <FileUpload
                          onChange={({ detail }) => setDocuments(detail.value)}
                          value={documents}
                          i18nStrings={{
                            uploadButtonText: e => e ? "Choose files" : "Choose files",
                            dropzoneText: e => e ? "Drop files to upload" : "Drop files to upload",
                            removeFileAriaLabel: e => `Remove file ${e + 1}`,
                            limitShowFewer: "Show fewer files",
                            limitShowMore: "Show more files",
                            errorIconAriaLabel: "Error"
                          }}
                          showFileLastModified
                          showFileSize
                          multiple
                          accept=".pdf,.docx,.xlsx,.jpg,.png"
                          constraintText="PDF, DOCX, XLSX, JPG, PNG. Max 10MB per file"
                        />
                      </FormField>

                      <FormField>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            id="consent-cic"
                            checked={consentCIC}
                            onChange={e => setConsentCIC(e.target.checked)}
                            style={{ marginRight: 8, width: 18, height: 18 }}
                          />
                          <label htmlFor="consent-cic" style={{ fontSize: 15, color: '#222', cursor: 'pointer' }}>
                            I agree to allow the bank to check my CIC credit score information <span style={{ color: 'red' }}>*</span> (required)
                          </label>
                        </div>
                      </FormField>

                      <Box>
                        <Button
                          variant="primary"
                          onClick={handleCreditAssessment}
                          loading={loading}
                          disabled={
                            !creditForm.applicantName ||
                            !creditForm.requestedAmount ||
                            !creditForm.loanTerm ||
                            documents.length === 0 ||
                            !consentCIC
                          }
                        >
                          🔍 Start Credit Assessment
                        </Button>
                      </Box>
                    </SpaceBetween>
                  </Form>
                </SpaceBetween>
              )
            },
            {
              id: 'analysis',
              label: 'Risk Analysis',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  {loading && (
                    <Box>
                      <ProgressBar
                        status="in-progress"
                        value={60}
                        additionalInfo="AI agents analyzing credit risk..."
                        description="Financial analysis, risk modeling, and compliance checks in progress"
                      />
                    </Box>
                  )}

                  {/* MOCK DATA minh họa đúng hình mẫu nếu chưa có */}
                  {assessmentResult || false ? (
                    (() => {
                      // Mock values
                      const mock = {
                        creditScore: 0,
                        creditRank: 0,
                        scoringDate: 'Không có dữ liệu',
                      };
                      // Ưu tiên dữ liệu thực, fallback sang mock nếu thiếu
                      const result = {
                        creditScore: assessmentResult?.creditScore ?? mock.creditScore,
                        creditRank: assessmentResult?.creditRank ?? mock.creditRank,
                        scoringDate: assessmentResult?.scoringDate ?? mock.scoringDate,
                      };
                      // Dữ liệu bảng
                      const ranks = [10,9,8,7,6,5,4,3,2,1];
                      const ranges = ['403-429','430-454','455-479','480-544','545-571','572-587','588-605','606-621','622-644','645-706'];
                      const colors = ['#ff3300','#ff5500','#ff7700','#ffbb00','#ffff00','#bfff00','#66ff00','#33ff33','#00ff66','#00ff99'];
                      // Dòng nhãn
                      const labelRow = [
                        { label: 'Xấu', colSpan: 2 },
                        { label: 'Dưới trung bình', colSpan: 2 },
                        { label: 'Trung bình', colSpan: 2 },
                        { label: 'Tốt', colSpan: 2 },
                        { label: 'Rất tốt', colSpan: 2 },
                      ];
                      // Tìm vị trí điểm khách hàng
                      let arrowIdx = ranks.findIndex((_, i) => {
                        const [min, max] = ranges[i].split('-').map(Number);
                        return result.creditScore >= min && result.creditScore <= max;
                      });
                      if (arrowIdx === -1) arrowIdx = 0;
                      // Mapping nhận xét điển hình theo hạng
                      const rankComments = {
                        10: "Xấu: Khách hàng không đủ điều kiện vay vốn tại hầu hết ngân hàng.",
                        9: "Xấu: Rủi ro cao, bị từ chối vay vốn, cần cải thiện tín dụng.",
                        8: "Dưới trung bình: Khó vay vốn, chỉ có thể vay tại công ty tài chính, lãi suất cao.",
                        7: "Dưới trung bình: Có thể vay vốn với hạn mức thấp, yêu cầu bổ sung hồ sơ nhiều.",
                        6: "Trung bình: Một số ngân hàng vẫn từ chối, cần tăng điểm để cải thiện cơ hội vay.",
                        5: "Trung bình: Vay vốn khó tại ngân hàng lớn, có thể mở thẻ tín dụng hạn mức thấp.",
                        4: "Tốt: Có thể được duyệt vay vốn với điều kiện chứng minh tài chính rõ ràng.",
                        3: "Tốt: Dễ dàng vay vốn tín chấp hoặc thế chấp, mở thẻ tín dụng dễ.",
                        2: "Rất tốt: Khả năng vay vốn cao, lãi suất tốt, nhiều ưu đãi từ ngân hàng.",
                        1: "Rất tốt: Dễ duyệt vay vốn lớn, mở thẻ tín dụng cao cấp, được ưu đãi tín dụng."
                      };
                      return (
                        <Box>
                          <Box margin={{ bottom: 'l' }}>
                            <Header variant="h2">ĐÁNH GIÁ ĐIỂM TÍN DỤNG</Header>
                            <ColumnLayout columns={2}>
                              <div style={{
                                border: '1px solid #bfc9d9',
                                borderRadius: 8,
                                background: '#fff',
                                minHeight: 120,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Box padding="l">
                                  <Box fontSize="body-m" color="text-body-secondary">Điểm tín dụng</Box>
                                  <Box fontSize="display-l" fontWeight="bold" color="text-status-info" margin={{ bottom: 'xxs' }}>
                                    {result.creditScore}
                                  </Box>
                                  <Box fontSize="body-m" color="text-body-secondary">Hạng</Box>
                                  <Box fontSize="display-l" fontWeight="bold" color="text-status-warning" margin={{ bottom: 'xxs' }}>
                                    {result.creditRank}
                                  </Box>
                                  <Box fontSize="body-m" color="text-body-secondary">Ngày tra cứu</Box>
                                  <Box fontSize="body-m" fontWeight="bold">
                                    {result.scoringDate}
                                  </Box>
                                </Box>
                              </div>
                              <div style={{
                                border: '2px solid #e9ebed',
                                borderRadius: 8,
                                minHeight: 120,
                                background: '#f8f9fa',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', height: '100%' }}>
                                   <div style={{ fontSize: 20, color: '#1976d2', width: '100%' }}>
                                     <Box padding="l" fontWeight="bold">
                                       {result.creditRank ? rankComments[result.creditRank] : ''}
                                     </Box>
                                   </div>
                                </div>
                              </div>
                            </ColumnLayout>
                          </Box>
                          {/* Bảng phân loại điểm và hạng đúng mẫu */}
                          <Box margin={{ top: 'l' }}>
                            <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                <thead>
                                  <tr>
                                    <th style={{ border: 'none', width: 60 }}></th>
                                    {labelRow.map((item, idx) => (
                                      <th key={item.label} colSpan={item.colSpan} style={{ border: 'none', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{item.label}</th>
                                    ))}
                                  </tr>
                                  <tr>
                                    <th style={{ border: 'none', textAlign: 'center', fontWeight: 500 }}>Hạng</th>
                                    {ranks.map((rank, i) => (
                                      <td key={rank} style={{
                                        background: colors[i],
                                        color: '#222',
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        border: '1px solid #fff',
                                        minWidth: 60,
                                        height: 40,
                                        fontSize: 18,
                                      }}>{rank}</td>
                                    ))}
                                  </tr>
                                  <tr>
                                    <th style={{ border: 'none', textAlign: 'center', fontWeight: 500 }}>Điểm</th>
                                    {ranges.map((range, i) => (
                                      <td key={range} style={{
                                        background: colors[i],
                                        color: '#222',
                                        textAlign: 'center',
                                        fontWeight: 400,
                                        border: '1px solid #fff',
                                        minWidth: 60,
                                        height: 32,
                                        fontSize: 15,
                                      }}>{range}</td>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ border: 'none' }}></td>
                                    {ranks.map((_, i) => (
                                      <td key={i} style={{ height: 18, background: 'transparent', border: 'none', padding: 0, position: 'relative' }}>
                                        {i === arrowIdx && (
                                          <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)' }}>
                                            <span role="img" aria-label="arrow" style={{ fontSize: 22 }}>⬆️</span>
                                          </div>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                  <tr>
                                    <td style={{ border: 'none', padding: 0 }}></td>
                                    {ranks.map((_, i) => (
                                      <td key={i} style={{ border: 'none', padding: 0, background: 'transparent', height: 18, textAlign: 'center' }}>
                                        {i === arrowIdx && (
                                          <span style={{ fontSize: 14, color: '#666' }}>Điểm hạng của khách hàng</span>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </Box>
                        </Box>
                      );
                    })()
                  ) : (
                    <Box textAlign="center" padding="xxl">
                      <Box variant="strong" textAlign="center" color="inherit">
                        No assessment results available
                      </Box>
                      <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                        Complete a credit assessment to see risk analysis here.
                      </Box>
                    </Box>
                  )}
                </SpaceBetween>
              )
            },
            {
              id: 'results',
              label: 'Assessment Results',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  {assessmentResult ? (
                    <>
                      <Header variant="h2">Credit Assessment Results</Header>
                      
                      {/* Phần tóm tắt hồ sơ khách hàng */}
                      {assessmentResult.summary && (
                        <ExpandableSection headerText="📝 Tóm tắt hồ sơ khách hàng" defaultExpanded={true}>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#333', borderRadius: '8px', padding: '16px', background: '#f8f9fa' }}>
                            {assessmentResult.summary}
                          </div>
                        </ExpandableSection>
                      )}

                      {/* Phân tích lịch sử tín dụng */}
                      {assessmentResult.creditHistory && (
                        <ExpandableSection headerText="📊 Phân tích lịch sử tín dụng" defaultExpanded={true}>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#333', borderRadius: '8px', padding: '16px', background: '#f8f9fa' }}>{assessmentResult.creditHistory}</div>
                        </ExpandableSection>
                      )}

                      {/* Phân tích tài chính & khả năng trả nợ */}
                      {assessmentResult.financialAnalysis && (
                        <ExpandableSection headerText="💰 Phân tích tài chính & khả năng trả nợ" defaultExpanded={true}>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#333', borderRadius: '8px', padding: '16px', background: '#f8f9fa' }}>{assessmentResult.financialAnalysis}</div>
                        </ExpandableSection>
                      )}

                      {/* Phân tích rủi ro tổng thể */}
                      {assessmentResult.riskAnalysis && (
                        <ExpandableSection headerText="⚠️ Phân tích rủi ro tổng thể" defaultExpanded={true}>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#333', borderRadius: '8px', padding: '16px', background: '#f8f9fa' }}>{assessmentResult.riskAnalysis}</div>
                        </ExpandableSection>
                      )}

                      {/* Đề xuất phê duyệt tín dụng */}
                      {assessmentResult.recommendation && (
                        <ExpandableSection headerText={
                          `${assessmentResult.approved === false ? '❌' : '✅'} Đề xuất phê duyệt tín dụng`
                        } defaultExpanded={true}>
                          <div
                            style={{
                              border: '1px solid #e9ebed',
                              borderRadius: '8px',
                              backgroundColor: getApprovalBgColor(),
                              marginBottom: '16px',
                              padding: '16px'
                            }}
                          >
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '15px', color: getApprovalTextColor(), fontWeight: 500 }}>
                              {assessmentResult.recommendation}
                            </div>
                          </div>
                        </ExpandableSection>
                      )}

                      {/* Thông tin đề xuất số tiền vay, lãi suất, confidence */}
                      <ColumnLayout columns={3}>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Số tiền vay tối đa đề xuất</Box>
                          <Box fontSize="heading-l" color="text-status-success">{assessmentResult.maxLoanAmount?.toLocaleString()}</Box>
                        </SpaceBetween>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Lãi suất đề xuất</Box>
                          <Box fontSize="heading-l">{assessmentResult.interestRate}</Box>
                        </SpaceBetween>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Mức độ tin cậy</Box>
                          <Box fontSize="heading-l">{assessmentResult.confidence}</Box>
                        </SpaceBetween>
                      </ColumnLayout>

                      {/* Khuyến nghị & lưu ý cho ngân hàng */}
                      {assessmentResult.notes && (
                        <ExpandableSection headerText="💡 Khuyến nghị & lưu ý cho ngân hàng" defaultExpanded={true}>
                          <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#b26a00', background: '#fffbe6', borderRadius: '8px', padding: '16px' }}>
                            {assessmentResult.notes}
                          </div>
                        </ExpandableSection>
                      )}

                      {/* AI Report Section - styled giống TextSummaryPage */}
                      {assessmentResult.ai_report && (
                        <ExpandableSection headerText="🤖 AI Report - Nội dung phân tích chi tiết từ AI" defaultExpanded={true}>
                          <div style={{ background: '#f5f6fa', borderRadius: '8px', padding: '16px' }}>
                            <ReactMarkdown>{fixMarkdown(assessmentResult.ai_report)}</ReactMarkdown>
                          </div>
                        </ExpandableSection>
                      )}

                      <SpaceBetween direction="horizontal" size="s">
                        <Button variant="primary">Generate Loan Contract</Button>
                        <Button>Download Assessment Report</Button>
                        <Button>Send to Approval Committee</Button>
                      </SpaceBetween>
                    </>
                  ) : (
                    <Box textAlign="center" padding="xxl">
                      <Box variant="strong" textAlign="center" color="inherit">
                        No assessment results available
                      </Box>
                      <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                        Complete a credit assessment to see results here.
                      </Box>
                    </Box>
                  )}
                </SpaceBetween>
              )
            }
          ]}
        />
      </SpaceBetween>
    </Container>
  );
};

export default CreditAssessmentPage;
