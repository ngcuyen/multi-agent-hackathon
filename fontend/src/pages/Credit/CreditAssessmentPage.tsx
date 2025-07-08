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
  BarChart
} from '@cloudscape-design/components';

interface CreditAssessmentPageProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

const CreditAssessmentPage: React.FC<CreditAssessmentPageProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('application');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

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
    { label: 'Quick Assessment', value: 'quick' },
    { label: 'Risk Analysis Only', value: 'risk_only' },
    { label: 'Financial Analysis Only', value: 'financial_only' }
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
    if (!creditForm.applicantName || !creditForm.requestedAmount) {
      onShowSnackbar('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
      return;
    }

    setLoading(true);
    try {
      onShowSnackbar('Đang phân tích hồ sơ tín dụng...', 'info');
      
      // Mock assessment result
      setTimeout(() => {
        setAssessmentResult({
          applicantName: creditForm.applicantName,
          creditScore: 742,
          riskRating: 'B+',
          recommendation: 'APPROVED',
          confidence: 87.5,
          maxLoanAmount: parseFloat(creditForm.requestedAmount) * 0.85,
          interestRate: 8.5,
          riskFactors: riskFactors,
          financialMetrics: {
            debtToEquity: 0.65,
            currentRatio: 1.8,
            returnOnAssets: 12.5,
            cashFlow: 'Positive'
          },
          complianceChecks: {
            kyc: 'Passed',
            aml: 'Passed',
            creditBureau: 'Passed',
            blacklist: 'Clear'
          }
        });
        setLoading(false);
        onShowSnackbar('Đánh giá tín dụng hoàn tất!', 'success');
      }, 8000);
    } catch (error) {
      console.error('Credit assessment error:', error);
      onShowSnackbar('Không thể đánh giá tín dụng. Vui lòng thử lại.', 'error');
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
                        <FormField label="Applicant Name" description="Full name or company name">
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
                        <FormField label="Requested Amount" description="Loan amount requested">
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

                        <FormField label="Loan Term" description="In months">
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
                        label="Supporting Documents"
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

                      <Box>
                        <Button
                          variant="primary"
                          onClick={handleCreditAssessment}
                          loading={loading}
                          disabled={!creditForm.applicantName || !creditForm.requestedAmount}
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

                  {assessmentResult && (
                    <>
                      <Header variant="h2">Risk Analysis Dashboard</Header>
                      
                      <ColumnLayout columns={2}>
                        <Box>
                          <Header variant="h3">Risk Distribution</Header>
                          <PieChart
                            data={pieChartData}
                            detailPopoverContent={(datum, sum) => [
                              { key: "Percentage", value: `${((datum.value / sum) * 100).toFixed(1)}%` },
                              { key: "Value", value: datum.value }
                            ]}
                            segmentDescription={(datum, sum) => 
                              `${datum.title}: ${datum.value} (${((datum.value / sum) * 100).toFixed(1)}%)`
                            }
                            i18nStrings={{
                              filterLabel: "Filter displayed data",
                              filterPlaceholder: "Filter data",
                              filterSelectedAriaLabel: "selected",
                              detailPopoverDismissAriaLabel: "Dismiss",
                              legendAriaLabel: "Legend",
                              chartAriaRoleDescription: "pie chart",
                              segmentAriaRoleDescription: "segment"
                            }}
                            ariaDescription="Risk distribution pie chart"
                            errorText="Error loading data."
                            loadingText="Loading chart"
                            recoveryText="Retry"
                            empty={
                              <Box textAlign="center" color="inherit">
                                <b>No data available</b>
                                <Box variant="p" color="inherit">
                                  There is no data available
                                </Box>
                              </Box>
                            }
                          />
                        </Box>

                        <Box>
                          <Header variant="h3">Risk Factors Score</Header>
                          <BarChart
                            series={[
                              {
                                title: "Risk Score",
                                type: "bar",
                                data: barChartData
                              }
                            ]}
                            xDomain={riskFactors.map(f => f.name)}
                            yDomain={[0, 100]}
                            i18nStrings={{
                              filterLabel: "Filter displayed data",
                              filterPlaceholder: "Filter data",
                              filterSelectedAriaLabel: "selected",
                              legendAriaLabel: "Legend",
                              chartAriaRoleDescription: "bar chart",
                              xTickFormatter: e => e,
                              yTickFormatter: e => `${e}%`
                            }}
                            ariaLabel="Risk factors bar chart"
                            errorText="Error loading data."
                            loadingText="Loading chart"
                            recoveryText="Retry"
                            empty={
                              <Box textAlign="center" color="inherit">
                                <b>No data available</b>
                                <Box variant="p" color="inherit">
                                  There is no data available
                                </Box>
                              </Box>
                            }
                            height={300}
                          />
                        </Box>
                      </ColumnLayout>
                    </>
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
                      
                      <Alert 
                        type={assessmentResult.recommendation === 'APPROVED' ? 'success' : 'warning'}
                        header={`Credit Application ${assessmentResult.recommendation}`}
                      >
                        Application for {assessmentResult.applicantName} has been {assessmentResult.recommendation.toLowerCase()} 
                        with {assessmentResult.confidence}% confidence.
                      </Alert>

                      <ColumnLayout columns={4}>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Credit Score</Box>
                          <Box fontSize="heading-xl" color="text-status-success">{assessmentResult.creditScore}</Box>
                        </SpaceBetween>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Risk Rating</Box>
                          <Box fontSize="heading-xl">{assessmentResult.riskRating}</Box>
                        </SpaceBetween>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Max Loan Amount</Box>
                          <Box fontSize="heading-xl">{assessmentResult.maxLoanAmount.toLocaleString()} VND</Box>
                        </SpaceBetween>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Interest Rate</Box>
                          <Box fontSize="heading-xl">{assessmentResult.interestRate}%</Box>
                        </SpaceBetween>
                      </ColumnLayout>

                      <Box>
                        <Header variant="h3">Financial Metrics</Header>
                        <ColumnLayout columns={4}>
                          {Object.entries(assessmentResult.financialMetrics).map(([key, value]) => (
                            <SpaceBetween key={key} direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Box>
                              <Box fontSize="heading-s">{String(value)}</Box>
                            </SpaceBetween>
                          ))}
                        </ColumnLayout>
                      </Box>

                      <Box>
                        <Header variant="h3">Compliance Checks</Header>
                        <ColumnLayout columns={4}>
                          {Object.entries(assessmentResult.complianceChecks).map(([key, value]) => (
                            <SpaceBetween key={key} direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">{key.toUpperCase()}</Box>
                              <StatusIndicator type={String(value) === 'Passed' || String(value) === 'Clear' ? 'success' : 'error'}>
                                {String(value)}
                              </StatusIndicator>
                            </SpaceBetween>
                          ))}
                        </ColumnLayout>
                      </Box>

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
