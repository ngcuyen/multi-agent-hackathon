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
  Textarea
} from '@cloudscape-design/components';

interface LCProcessingPageProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

const LCProcessingPage: React.FC<LCProcessingPageProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [lcDocuments, setLcDocuments] = useState<File[]>([]);
  const [processingResult, setProcessingResult] = useState<any>(null);

  const [lcForm, setLcForm] = useState({
    lcNumber: '',
    applicant: '',
    beneficiary: '',
    amount: '',
    currency: 'USD',
    expiryDate: '',
    processingType: 'full_validation'
  });

  const processingSteps = [
    { id: 1, name: 'Document Upload', status: 'completed', agent: 'Document Intelligence' },
    { id: 2, name: 'OCR Processing', status: 'in-progress', agent: 'Document Intelligence' },
    { id: 3, name: 'UCP 600 Validation', status: 'pending', agent: 'Compliance Validation' },
    { id: 4, name: 'Risk Assessment', status: 'pending', agent: 'Risk Assessment' },
    { id: 5, name: 'Decision Synthesis', status: 'pending', agent: 'Decision Synthesis' }
  ];

  const currencyOptions = [
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'VND - Vietnamese Dong', value: 'VND' },
    { label: 'JPY - Japanese Yen', value: 'JPY' },
    { label: 'GBP - British Pound', value: 'GBP' }
  ];

  const processingTypeOptions = [
    { label: 'Full Validation (UCP 600 + ISBP 821)', value: 'full_validation' },
    { label: 'Quick Check (Basic Validation)', value: 'quick_check' },
    { label: 'Compliance Only (UCP 600)', value: 'compliance_only' },
    { label: 'Risk Assessment Only', value: 'risk_only' }
  ];

  const handleLCProcessing = async () => {
    if (lcDocuments.length === 0) {
      onShowSnackbar('Vui lòng upload tài liệu LC', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Simulate LC processing
      onShowSnackbar('Đang xử lý Letter of Credit...', 'info');
      
      // Mock processing result
      setTimeout(() => {
        setProcessingResult({
          lcNumber: lcForm.lcNumber || 'LC-2025-001',
          status: 'approved',
          confidence: 94.5,
          riskScore: 'Low',
          complianceStatus: 'Compliant',
          recommendations: [
            'Document set is complete and compliant with UCP 600',
            'Risk assessment indicates low probability of default',
            'Recommend approval with standard terms'
          ],
          validationResults: {
            ucp600: { status: 'passed', score: 98 },
            isbp821: { status: 'passed', score: 96 },
            sbv: { status: 'passed', score: 99 }
          }
        });
        setLoading(false);
        onShowSnackbar('Xử lý LC thành công!', 'success');
      }, 5000);
    } catch (error) {
      console.error('LC processing error:', error);
      onShowSnackbar('Không thể xử lý LC. Vui lòng thử lại.', 'error');
      setLoading(false);
    }
  };

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h1"
          description="Automated Letter of Credit processing with UCP 600 validation"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => window.history.back()}>
                Back to Dashboard
              </Button>
            </SpaceBetween>
          }
        >
          📄 Letter of Credit Processing
        </Header>

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'upload',
              label: 'Document Upload',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Alert type="info">
                    Upload LC documents for automated processing. Supported formats: PDF, DOCX, JPG, PNG
                  </Alert>

                  <Form>
                    <SpaceBetween direction="vertical" size="l">
                      <ColumnLayout columns={2}>
                        <FormField label="LC Number" description="Enter the Letter of Credit number">
                          <Input
                            value={lcForm.lcNumber}
                            onChange={({ detail }) => setLcForm({ ...lcForm, lcNumber: detail.value })}
                            placeholder="LC-2025-001"
                          />
                        </FormField>

                        <FormField label="Processing Type">
                          <Select
                            selectedOption={processingTypeOptions.find(opt => opt.value === lcForm.processingType) || null}
                            onChange={({ detail }) => setLcForm({ ...lcForm, processingType: detail.selectedOption.value })}
                            options={processingTypeOptions}
                          />
                        </FormField>
                      </ColumnLayout>

                      <ColumnLayout columns={2}>
                        <FormField label="Applicant" description="LC applicant name">
                          <Input
                            value={lcForm.applicant}
                            onChange={({ detail }) => setLcForm({ ...lcForm, applicant: detail.value })}
                            placeholder="Company Name"
                          />
                        </FormField>

                        <FormField label="Beneficiary" description="LC beneficiary name">
                          <Input
                            value={lcForm.beneficiary}
                            onChange={({ detail }) => setLcForm({ ...lcForm, beneficiary: detail.value })}
                            placeholder="Beneficiary Name"
                          />
                        </FormField>
                      </ColumnLayout>

                      <ColumnLayout columns={3}>
                        <FormField label="Amount">
                          <Input
                            value={lcForm.amount}
                            onChange={({ detail }) => setLcForm({ ...lcForm, amount: detail.value })}
                            placeholder="1,000,000"
                            type="number"
                          />
                        </FormField>

                        <FormField label="Currency">
                          <Select
                            selectedOption={currencyOptions.find(opt => opt.value === lcForm.currency) || null}
                            onChange={({ detail }) => setLcForm({ ...lcForm, currency: detail.selectedOption.value })}
                            options={currencyOptions}
                          />
                        </FormField>

                        <FormField label="Expiry Date">
                          <Input
                            value={lcForm.expiryDate}
                            onChange={({ detail }) => setLcForm({ ...lcForm, expiryDate: detail.value })}
                            placeholder="YYYY-MM-DD"
                          />
                        </FormField>
                      </ColumnLayout>

                      <FormField
                        label="LC Documents"
                        description="Upload all LC-related documents"
                      >
                        <FileUpload
                          onChange={({ detail }) => setLcDocuments(detail.value)}
                          value={lcDocuments}
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
                          showFileThumbnail
                          multiple
                          accept=".pdf,.docx,.jpg,.jpeg,.png"
                          constraintText="PDF, DOCX, JPG, PNG. Max 10MB per file"
                        />
                      </FormField>

                      <Box>
                        <Button
                          variant="primary"
                          onClick={handleLCProcessing}
                          loading={loading}
                          disabled={lcDocuments.length === 0}
                        >
                          🚀 Process Letter of Credit
                        </Button>
                      </Box>
                    </SpaceBetween>
                  </Form>
                </SpaceBetween>
              )
            },
            {
              id: 'processing',
              label: 'Processing Status',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Header variant="h2">Processing Pipeline</Header>
                  
                  {loading && (
                    <Box>
                      <ProgressBar
                        status="in-progress"
                        value={40}
                        additionalInfo="Processing LC documents with AI agents..."
                        description="This may take 5-15 minutes depending on document complexity"
                      />
                    </Box>
                  )}

                  <Cards
                    cardDefinition={{
                      header: item => (
                        <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                          <Box fontSize="heading-s">Step {item.id}: {item.name}</Box>
                          <StatusIndicator 
                            type={item.status === 'completed' ? 'success' : item.status === 'in-progress' ? 'in-progress' : 'pending'}
                          >
                            {item.status === 'completed' ? 'Completed' : item.status === 'in-progress' ? 'Processing' : 'Pending'}
                          </StatusIndicator>
                        </SpaceBetween>
                      ),
                      sections: [
                        {
                          id: "agent",
                          content: item => (
                            <SpaceBetween direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">Assigned Agent</Box>
                              <Badge color="blue">{item.agent}</Badge>
                            </SpaceBetween>
                          )
                        }
                      ]
                    }}
                    cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
                    items={processingSteps}
                  />
                </SpaceBetween>
              )
            },
            {
              id: 'results',
              label: 'Results',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  {processingResult ? (
                    <>
                      <Header variant="h2">Processing Results</Header>
                      
                      <Alert 
                        type={processingResult.status === 'approved' ? 'success' : 'warning'}
                        header={`LC ${processingResult.status.toUpperCase()}`}
                      >
                        Letter of Credit {processingResult.lcNumber} has been {processingResult.status} with {processingResult.confidence}% confidence.
                      </Alert>

                      <ColumnLayout columns={3}>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Risk Score</Box>
                          <Box fontSize="heading-l" color="text-status-success">{processingResult.riskScore}</Box>
                        </SpaceBetween>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Compliance Status</Box>
                          <Box fontSize="heading-l" color="text-status-success">{processingResult.complianceStatus}</Box>
                        </SpaceBetween>
                        <SpaceBetween direction="vertical" size="s">
                          <Box fontSize="body-s" color="text-body-secondary">Confidence Score</Box>
                          <Box fontSize="heading-l">{processingResult.confidence}%</Box>
                        </SpaceBetween>
                      </ColumnLayout>

                      <Box>
                        <Header variant="h3">Validation Results</Header>
                        <ColumnLayout columns={3}>
                          {Object.entries(processingResult.validationResults).map(([key, result]: [string, any]) => (
                            <SpaceBetween key={key} direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">{key.toUpperCase()}</Box>
                              <StatusIndicator type={result.status === 'passed' ? 'success' : 'error'}>
                                {result.status === 'passed' ? 'Passed' : 'Failed'}
                              </StatusIndicator>
                              <Box fontSize="body-s">Score: {result.score}%</Box>
                            </SpaceBetween>
                          ))}
                        </ColumnLayout>
                      </Box>

                      <Box>
                        <Header variant="h3">Recommendations</Header>
                        <SpaceBetween direction="vertical" size="s">
                          {processingResult.recommendations.map((rec: string, index: number) => (
                            <Box key={index} padding="s" >
                              • {rec}
                            </Box>
                          ))}
                        </SpaceBetween>
                      </Box>

                      <SpaceBetween direction="horizontal" size="s">
                        <Button variant="primary">Download Report</Button>
                        <Button>Export to PDF</Button>
                        <Button>Send to Approval</Button>
                      </SpaceBetween>
                    </>
                  ) : (
                    <Box textAlign="center" padding="xxl">
                      <Box variant="strong" textAlign="center" color="inherit">
                        No results available
                      </Box>
                      <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                        Process an LC document to see results here.
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

export default LCProcessingPage;
