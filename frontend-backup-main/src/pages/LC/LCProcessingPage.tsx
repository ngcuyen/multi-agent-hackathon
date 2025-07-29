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
  Badge
} from '@cloudscape-design/components';
import { complianceAPI, ComplianceValidationResponse } from '../../services/api';

interface LCProcessingPageProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

// Helper function to map backend response to frontend format
const mapComplianceResponse = (backendData: ComplianceValidationResponse, lcNumber: string) => {
  console.log('=== MAPPING DEBUG ===');
  console.log('Raw backend data:', JSON.stringify(backendData, null, 2));
  console.log('Document type from BE:', backendData.document_type);
  console.log('Is trade document from BE:', backendData.is_trade_document);
  console.log('Compliance status from BE:', backendData.compliance_status);
  
  // Format document type for display
  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get appropriate status based on document type and compliance
  const getDocumentStatus = () => {
    if (backendData.is_trade_document) {
      return backendData.compliance_status === 'COMPLIANT' ? 'approved' : 'rejected';
    } else {
      return 'identified'; // For non-trade documents
    }
  };

  // Get risk score based on confidence
  const getRiskScore = () => {
    const confidence = backendData.confidence_score || 0;
    if (confidence >= 0.7) return 'Low';
    if (confidence >= 0.3) return 'Medium';
    return 'High';
  };

  // Format confidence score for display - show actual value from BE
  const formatConfidence = (score: number) => {
    if (score === 0) return 0;
    // Convert to percentage and round to 1 decimal place
    const percentage = score * 100;
    if (percentage < 0.1) {
      return Math.round(percentage * 100) / 100; // Show more precision for very small values
    }
    return Math.round(percentage * 10) / 10;
  };
  
  const mappedResult = {
    lcNumber: lcNumber,
    status: getDocumentStatus(),
    confidence: formatConfidence(backendData.confidence_score || 0),
    riskScore: getRiskScore(),
    complianceStatus: backendData.compliance_status || 'UNKNOWN',
    documentType: backendData.document_type || 'unknown',
    formattedDocumentType: formatDocumentType(backendData.document_type || 'unknown'),
    isTradeDocument: backendData.is_trade_document || false,
    recommendations: backendData.recommendations || [],
    validationResults: {
      ucp600: { 
        status: backendData.compliance_status === 'COMPLIANT' ? 'passed' : 'failed', 
        score: formatConfidence(backendData.confidence_score || 0),
        applicable: backendData.is_trade_document || false
      },
      isbp821: { 
        status: backendData.compliance_status === 'COMPLIANT' ? 'passed' : 'failed', 
        score: formatConfidence(backendData.confidence_score || 0),
        applicable: backendData.is_trade_document || false
      },
      sbv: { 
        status: backendData.compliance_status === 'COMPLIANT' ? 'passed' : 'failed', 
        score: formatConfidence(backendData.confidence_score || 0),
        applicable: backendData.is_trade_document || false
      }
    },
    violations: backendData.violations || [],
    extractedFields: backendData.extracted_fields || {},
    documentAnalysis: backendData.document_analysis || {},
    complianceSummary: backendData.compliance_summary || {},
    processingDetails: backendData.processing_details || {},
    ucpRegulations: backendData.ucp_regulations_applied || '',
    processingTime: backendData.processing_time || 0,
    timestamp: backendData.timestamp || Date.now()
  };
  
  console.log('=== MAPPED RESULT ===');
  console.log('Mapped documentType:', mappedResult.documentType);
  console.log('Mapped formattedDocumentType:', mappedResult.formattedDocumentType);
  console.log('Mapped isTradeDocument:', mappedResult.isTradeDocument);
  
  return mappedResult;
};

const LCProcessingPage: React.FC<LCProcessingPageProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [lcDocuments, setLcDocuments] = useState<File[]>([]);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [processingSteps, setProcessingSteps] = useState([
    { id: 1, name: 'Document Upload', status: 'pending', agent: 'Document Intelligence' },
    { id: 2, name: 'OCR Processing', status: 'pending', agent: 'Document Intelligence' },
    { id: 3, name: 'UCP 600 Validation', status: 'pending', agent: 'Compliance Validation' },
    { id: 4, name: 'Risk Assessment', status: 'pending', agent: 'Risk Assessment' },
    { id: 5, name: 'Decision Synthesis', status: 'pending', agent: 'Decision Synthesis' }
  ]);

  const [lcForm, setLcForm] = useState({
    lcNumber: '',
    applicant: '',
    beneficiary: '',
    amount: '',
    currency: 'USD',
    expiryDate: '',
    processingType: 'full_validation'
  });

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

  const updateProcessingStep = (stepId: number, status: 'completed' | 'in-progress' | 'pending' | 'error') => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const handleLCProcessing = async () => {
    // Check if we have either file or meaningful form data
    const hasFile = lcDocuments.length > 0;
    const hasFormData = lcForm.lcNumber || lcForm.applicant || lcForm.beneficiary || lcForm.amount;
    
    if (!hasFile && !hasFormData) {
      onShowSnackbar('Vui lòng upload tài liệu HOẶC nhập thông tin LC', 'warning');
      return;
    }

    setLoading(true);
    setActiveTab('processing');
    
    // Reset all processing steps to pending state
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    
    try {
      // Check what we have to process
      const hasFile = lcDocuments.length > 0;
      const hasFormData = lcForm.lcNumber || lcForm.applicant || lcForm.beneficiary || lcForm.amount;
      
      // Step 1: Document Upload
      updateProcessingStep(1, 'completed');
      onShowSnackbar('Đang xử lý Letter of Credit...', 'info');
      
      // Step 2: OCR Processing
      updateProcessingStep(2, 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: UCP 600 Validation - Call appropriate API
      updateProcessingStep(2, 'completed');
      updateProcessingStep(3, 'in-progress');
      
      // Prepare metadata from form inputs
      const lcMetadata = {
        lc_number: lcForm.lcNumber,
        applicant: lcForm.applicant,
        beneficiary: lcForm.beneficiary,
        amount: lcForm.amount,
        currency: lcForm.currency,
        expiry_date: lcForm.expiryDate,
        processing_type: lcForm.processingType
      };
      
      console.log('Processing with metadata:', lcMetadata);
      
      let complianceResponse;
      
      if (hasFile) {
        // File + Metadata processing
        console.log('Processing with file and metadata');
        const mainDocument = lcDocuments[0];
        complianceResponse = await complianceAPI.validateDocumentFile(
          mainDocument,
          undefined, // Let BE classify document type automatically
          lcMetadata // Send form metadata for enhanced validation
        );
      } else {
        // Metadata-only processing
        console.log('Processing with metadata only');
        
        // Create text content from metadata for validation
        const textContent = `
Letter of Credit Information:
LC Number: ${lcMetadata.lc_number || 'Not provided'}
Applicant: ${lcMetadata.applicant || 'Not provided'}
Beneficiary: ${lcMetadata.beneficiary || 'Not provided'}
Amount: ${lcMetadata.amount || 'Not provided'} ${lcMetadata.currency || 'USD'}
Expiry Date: ${lcMetadata.expiry_date || 'Not provided'}
Processing Type: ${lcMetadata.processing_type || 'full_validation'}

This is a Letter of Credit validation request based on form input data.
        `.trim();
        
        complianceResponse = await complianceAPI.validateCompliance({
          text: textContent,
          document_type: 'letter_of_credit',
          ...lcMetadata
        });
      }

      if (complianceResponse.status === 'error') {
        throw new Error(complianceResponse.message || 'Compliance validation failed');
      }

      updateProcessingStep(3, 'completed');
      
      // Only proceed to next steps if compliance is successful
      const isCompliant = complianceResponse.data?.compliance_status === 'compliant';
      
      if (isCompliant) {
        // Step 4: Risk Assessment - Only run after compliance is successful
        updateProcessingStep(4, 'in-progress');
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateProcessingStep(4, 'completed');
        
        // Step 5: Decision Synthesis - Only run after risk assessment is successful
        updateProcessingStep(5, 'in-progress');
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateProcessingStep(5, 'completed');
      } else {
        // If not compliant, mark remaining steps as skipped or leave as pending
        console.log('Document not compliant, skipping risk assessment and decision synthesis');
      }

      // Map backend response to frontend format
      const mappedResult = mapComplianceResponse(
        complianceResponse.data!,
        lcForm.lcNumber || 'LC-2025-001'
      );

      setProcessingResult(mappedResult);
      setActiveTab('results');
      onShowSnackbar('Xử lý LC thành công!', 'success');
      
    } catch (error) {
      console.error('LC processing error:', error);
      
      // Update failed step
      const currentStep = processingSteps.find(step => step.status === 'in-progress');
      if (currentStep) {
        updateProcessingStep(currentStep.id, 'error');
      }
      
      onShowSnackbar(
        error instanceof Error ? error.message : 'Không thể xử lý LC. Vui lòng thử lại.',
        'error'
      );
    } finally {
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
                          disabled={lcDocuments.length === 0 && !lcForm.lcNumber && !lcForm.applicant && !lcForm.beneficiary && !lcForm.amount}
                        >
                          {(() => {
                            const hasFile = lcDocuments.length > 0;
                            const hasFormData = lcForm.lcNumber || lcForm.applicant || lcForm.beneficiary || lcForm.amount;
                            
                            if (hasFile && hasFormData) {
                              return '🚀 Process LC Document & Data';
                            } else if (hasFile) {
                              return '🚀 Process LC Document';
                            } else if (hasFormData) {
                              return '🚀 Validate LC Information';
                            } else {
                              return '🚀 Process Letter of Credit';
                            }
                          })()}
                        </Button>
                        <Box fontSize="body-s" color="text-body-secondary" padding={{ top: "xs" }}>
                          {(() => {
                            const hasFile = lcDocuments.length > 0;
                            const hasFormData = lcForm.lcNumber || lcForm.applicant || lcForm.beneficiary || lcForm.amount;
                            
                            if (hasFile && hasFormData) {
                              return 'Enhanced validation with both document and form data';
                            } else if (hasFile) {
                              return 'Document-based validation with OCR processing';
                            } else if (hasFormData) {
                              return 'Form data validation (upload document for enhanced results)';
                            } else {
                              return 'Please upload a document or fill in LC information';
                            }
                          })()}
                        </Box>
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
                        value={processingSteps.filter(s => s.status === 'completed').length * 20}
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
                            type={
                              item.status === 'completed' ? 'success' : 
                              item.status === 'in-progress' ? 'in-progress' : 
                              item.status === 'error' ? 'error' : 'pending'
                            }
                          >
                            {item.status === 'completed' ? 'Completed' : 
                             item.status === 'in-progress' ? 'Processing' : 
                             item.status === 'error' ? 'Error' : 'Pending'}
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
                      
                      {/* Dynamic result header based on actual document type from BE */}
                      <Alert 
                        type={
                          processingResult.status === 'approved' ? 'success' : 
                          processingResult.status === 'rejected' ? 'error' : 'info'
                        }
                        header={
                          processingResult.isTradeDocument 
                            ? `${processingResult.formattedDocumentType} ${processingResult.status.toUpperCase()}`
                            : `${processingResult.formattedDocumentType} IDENTIFIED`
                        }
                      >
                        {processingResult.isTradeDocument ? (
                          `${processingResult.formattedDocumentType} has been ${processingResult.status} with ${processingResult.confidence}% confidence.`
                        ) : (
                          `Document identified as ${processingResult.formattedDocumentType}. This document type is not directly subject to UCP 600 evaluation but may be part of LC documentation.`
                        )}
                      </Alert>

                      {/* Document Type Information */}
                      <Box>
                        <ColumnLayout columns={processingResult.isTradeDocument ? 4 : 2}>
                          <SpaceBetween direction="vertical" size="s">
                            <Box fontSize="body-s" color="text-body-secondary">Document Type</Box>
                            <Box fontSize="heading-m">{processingResult.formattedDocumentType}</Box>
                          </SpaceBetween>
                          
                          <SpaceBetween direction="vertical" size="s">
                            <Box fontSize="body-s" color="text-body-secondary">UCP 600 Applicable</Box>
                            <Box fontSize="heading-m" color={processingResult.isTradeDocument ? 'text-status-success' : 'text-status-info'}>
                              {processingResult.isTradeDocument ? 'Yes' : 'No'}
                            </Box>
                          </SpaceBetween>

                          {processingResult.isTradeDocument && (
                            <>
                              <SpaceBetween direction="vertical" size="s">
                                <Box fontSize="body-s" color="text-body-secondary">Risk Score</Box>
                                <Box fontSize="heading-l" color={
                                  processingResult.riskScore === 'Low' ? 'text-status-success' : 
                                  processingResult.riskScore === 'Medium' ? 'text-status-warning' : 'text-status-error'
                                }>
                                  {processingResult.riskScore}
                                </Box>
                              </SpaceBetween>
                              
                              <SpaceBetween direction="vertical" size="s">
                                <Box fontSize="body-s" color="text-body-secondary">Confidence Score</Box>
                                <Box fontSize="heading-l">{processingResult.confidence}%</Box>
                              </SpaceBetween>
                            </>
                          )}
                        </ColumnLayout>
                      </Box>

                      {/* Compliance Status for trade documents */}
                      {processingResult.isTradeDocument && (
                        <Box>
                          <SpaceBetween direction="vertical" size="s">
                            <Box fontSize="body-s" color="text-body-secondary">Compliance Status</Box>
                            <Box fontSize="heading-l" color={
                              processingResult.complianceStatus === 'COMPLIANT' ? 'text-status-success' : 'text-status-error'
                            }>
                              {processingResult.complianceStatus === 'COMPLIANT' ? 'Compliant' : 'Non-Compliant'}
                            </Box>
                          </SpaceBetween>
                        </Box>
                      )}

                      {/* Validation Results - simplified and realistic */}
                      {processingResult.isTradeDocument && (
                        <Box>
                          <Header variant="h3">Compliance Validation</Header>
                          <SpaceBetween direction="vertical" size="s">
                            {/* UCP 600 - actual validation */}
                            <Box>
                              <SpaceBetween direction="horizontal" size="s" alignItems="center">
                                <Box fontSize="body-m" fontWeight="bold">UCP 600</Box>
                                <StatusIndicator type={processingResult.complianceStatus === 'COMPLIANT' ? 'success' : 'error'}>
                                  {processingResult.complianceStatus === 'COMPLIANT' ? 'Compliant' : 'Non-Compliant'}
                                </StatusIndicator>
                                <Box fontSize="body-s">
                                  Score: {processingResult.confidence}%
                                </Box>
                              </SpaceBetween>
                            </Box>
                            
                            {/* Future standards notification */}
                            <Alert type="info" header="Additional Standards">
                              ISBP 821 and SBV regulations validation will be available in future updates. 
                              Currently, only UCP 600 compliance is fully implemented.
                            </Alert>
                          </SpaceBetween>
                        </Box>
                      )}

                      {/* Non-trade document information with specific guidance */}
                      {!processingResult.isTradeDocument && (
                        <Alert 
                          type="warning" 
                          header={`${processingResult.formattedDocumentType} Classification`}
                        >
                          <SpaceBetween direction="vertical" size="s">
                            <Box>
                              This document has been classified as <strong>{processingResult.formattedDocumentType}</strong>, 
                              which is not directly subject to UCP 600 evaluation.
                            </Box>
                            
                            {processingResult.documentType === 'commercial_invoice' && (
                              <Box>
                                <strong>Note:</strong> Commercial Invoices are typically part of LC documentation 
                                and should be evaluated under UCP 600 Article 18 when presented as part of an LC transaction. 
                                To perform UCP 600 validation, please upload the actual Letter of Credit document.
                              </Box>
                            )}
                            
                            {processingResult.documentType === 'bill_of_lading' && (
                              <Box>
                                <strong>Note:</strong> Bills of Lading are typically part of LC documentation 
                                and are evaluated under UCP 600 Article 20 when presented as part of an LC transaction.
                              </Box>
                            )}
                            
                            {!['commercial_invoice', 'bill_of_lading'].includes(processingResult.documentType) && (
                              <Box>
                                This document type requires different compliance standards. 
                                For UCP 600 validation, please upload a Letter of Credit document.
                              </Box>
                            )}
                          </SpaceBetween>
                        </Alert>
                      )}

                      {/* Extracted Fields */}
                      {Object.keys(processingResult.extractedFields).length > 0 && (
                        <Box>
                          <Header variant="h3">Extracted Information</Header>
                          <ColumnLayout columns={2}>
                            {Object.entries(processingResult.extractedFields).map(([key, value]: [string, any]) => (
                              <SpaceBetween key={key} direction="vertical" size="xs">
                                <Box fontSize="body-s" color="text-body-secondary">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Box>
                                <Box fontSize="body-m">
                                  {Array.isArray(value) ? value.join(', ') : String(value)}
                                </Box>
                              </SpaceBetween>
                            ))}
                          </ColumnLayout>
                        </Box>
                      )}

                      {/* Violations */}
                      {processingResult.violations && processingResult.violations.length > 0 && (
                        <Box>
                          <Header variant="h3">Violations Found</Header>
                          <SpaceBetween direction="vertical" size="s">
                            {processingResult.violations.map((violation: any, index: number) => (
                              <Alert 
                                key={index} 
                                type={
                                  violation.severity === 'HIGH' || violation.severity === 'CRITICAL' ? 'error' :
                                  violation.severity === 'MEDIUM' ? 'warning' : 'info'
                                }
                                header={violation.type || 'Violation'}
                              >
                                <SpaceBetween direction="vertical" size="xs">
                                  <Box>{violation.description}</Box>
                                  {violation.regulation_reference && (
                                    <Box fontSize="body-s" color="text-body-secondary">
                                      Reference: {violation.regulation_reference}
                                    </Box>
                                  )}
                                  {violation.severity && (
                                    <Badge color={
                                      violation.severity === 'HIGH' || violation.severity === 'CRITICAL' ? 'red' :
                                      violation.severity === 'MEDIUM' ? 'severity-medium' : 'blue'
                                    }>
                                      {violation.severity}
                                    </Badge>
                                  )}
                                </SpaceBetween>
                              </Alert>
                            ))}
                          </SpaceBetween>
                        </Box>
                      )}

                      <Box>
                        <Header variant="h3" description="AI-powered recommendations to improve compliance">
                          📋 Recommendations
                        </Header>
                        <SpaceBetween direction="vertical" size="s">
                          {processingResult.recommendations.length > 0 ? (
                            processingResult.recommendations.map((rec: any, index: number) => {
                              const recommendation = typeof rec === 'string' ? { description: rec, priority: 'MEDIUM' } : rec;
                              const priorityColor = 
                                recommendation.priority === 'HIGH' ? 'red' :
                                recommendation.priority === 'MEDIUM' ? 'blue' : 'grey';
                              const priorityIcon = 
                                recommendation.priority === 'HIGH' ? '🔴' :
                                recommendation.priority === 'MEDIUM' ? '🔵' : '⚪';
                              
                              return (
                                <Container key={index} header={
                                  <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                                    <Box fontSize="body-s">{priorityIcon}</Box>
                                    <Badge color={priorityColor}>
                                      {recommendation.priority || 'MEDIUM'} Priority
                                    </Badge>
                                  </SpaceBetween>
                                }>
                                  <Box padding="s">
                                    {recommendation.description || JSON.stringify(rec)}
                                  </Box>
                                </Container>
                              );
                            })
                          ) : (
                            <Alert type="success" header="✅ No Issues Found">
                              Document appears to be compliant with all requirements.
                            </Alert>
                          )}
                        </SpaceBetween>
                      </Box>

                      {/* Processing Details */}
                      {processingResult.processingTime > 0 && (
                        <Box>
                          <Header variant="h3">Processing Details</Header>
                          <ColumnLayout columns={3}>
                            <SpaceBetween direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">Processing Time</Box>
                              <Box fontSize="body-m">{processingResult.processingTime.toFixed(2)} seconds</Box>
                            </SpaceBetween>
                            <SpaceBetween direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">Document Type</Box>
                              <Box fontSize="body-m">{processingResult.formattedDocumentType}</Box>
                            </SpaceBetween>
                            <SpaceBetween direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">Processed At</Box>
                              <Box fontSize="body-m">{new Date(processingResult.timestamp).toLocaleString()}</Box>
                            </SpaceBetween>
                          </ColumnLayout>
                        </Box>
                      )}

                      {processingResult.fileInfo && (
                        <Box>
                          <Header variant="h3">Document Information</Header>
                          <ColumnLayout columns={2}>
                            <SpaceBetween direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">File Name</Box>
                              <Box>{processingResult.fileInfo.filename}</Box>
                            </SpaceBetween>
                            <SpaceBetween direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">File Size</Box>
                              <Box>{Math.round(processingResult.fileInfo.file_size / 1024)} KB</Box>
                            </SpaceBetween>
                            <SpaceBetween direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">File Type</Box>
                              <Box>{processingResult.fileInfo.file_type}</Box>
                            </SpaceBetween>
                            <SpaceBetween direction="vertical" size="xs">
                              <Box fontSize="body-s" color="text-body-secondary">Extracted Text Length</Box>
                              <Box>{processingResult.fileInfo.extracted_text_length} characters</Box>
                            </SpaceBetween>
                          </ColumnLayout>
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <SpaceBetween direction="horizontal" size="s">
                        <Button variant="primary">Download Report</Button>
                        <Button>Export to PDF</Button>
                        {processingResult.isTradeDocument && processingResult.status === 'approved' && (
                          <Button>Send to Approval</Button>
                        )}
                        <Button onClick={() => {
                          setProcessingResult(null);
                          setActiveTab('upload');
                        }}>
                          Process Another Document
                        </Button>
                      </SpaceBetween>
                    </>
                  ) : (
                    <Box textAlign="center" padding="xxl">
                      <Box variant="strong" textAlign="center" color="inherit">
                        No results available
                      </Box>
                      <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                        Process a document to see results here.
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