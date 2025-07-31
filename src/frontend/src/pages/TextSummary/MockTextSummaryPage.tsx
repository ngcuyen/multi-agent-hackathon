import React, { useState, useCallback } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Grid,
  Box,
  Button,
  FormField,
  Textarea,
  Select,
  FileUpload,
  Cards,
  Badge,
  StatusIndicator,
  ProgressBar,
  Alert,
  Modal,
  KeyValuePairs,
  ExpandableSection,
  Tabs,
  CodeEditor,
} from '@cloudscape-design/components';
import { mockApiService } from '../../services/mockApiService';

interface SummaryResult {
  id: string;
  originalText: string;
  summary: string;
  summaryType: string;
  language: string;
  processingTime: number;
  modelUsed: string;
  metadata: any;
  timestamp: Date;
}

const MockTextSummaryPage: React.FC<{ onShowSnackbar: (message: string, type: string) => void }> = ({ onShowSnackbar }) => {
  // State management
  const [inputText, setInputText] = useState('');
  const [selectedSummaryType, setSelectedSummaryType] = useState({ value: 'general', label: 'Tóm tắt chung' });
  const [selectedLanguage, setSelectedLanguage] = useState({ value: 'vietnamese', label: 'Tiếng Việt' });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<SummaryResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SummaryResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [summaryTypes, setSummaryTypes] = useState<any>(null);

  // Load summary types on mount
  React.useEffect(() => {
    const loadSummaryTypes = async () => {
      const response = await mockApiService.getSummaryTypes();
      if (response.status === 'success') {
        setSummaryTypes(response.data);
      }
    };
    loadSummaryTypes();
  }, []);

  // Summary type options
  const summaryTypeOptions = summaryTypes?.data?.summary_types ? 
    Object.entries(summaryTypes.data.summary_types).map(([key, value]: [string, any]) => ({
      value: key,
      label: value.name,
      description: value.description,
    })) : [
      { value: 'general', label: 'Tóm tắt chung', description: 'Tóm tắt tổng quan nội dung chính' },
      { value: 'bullet_points', label: 'Điểm chính', description: 'Liệt kê các điểm chính' },
      { value: 'key_insights', label: 'Thông tin quan trọng', description: 'Trích xuất insight quan trọng' },
      { value: 'executive_summary', label: 'Tóm tắt điều hành', description: 'Tóm tắt cho lãnh đạo' },
      { value: 'detailed', label: 'Tóm tắt chi tiết', description: 'Chi tiết nhưng súc tích' },
    ];

  const languageOptions = [
    { value: 'vietnamese', label: 'Tiếng Việt', description: 'Tóm tắt bằng tiếng Việt' },
    { value: 'english', label: 'English', description: 'Summarize in English' },
  ];

  // Handle text summarization
  const handleTextSummarization = useCallback(async () => {
    if (!inputText.trim()) {
      onShowSnackbar('Vui lòng nhập văn bản cần tóm tắt', 'error');
      return;
    }

    if (inputText.length < 50) {
      onShowSnackbar('Văn bản quá ngắn để tóm tắt (tối thiểu 50 ký tự)', 'warning');
      return;
    }

    setProcessing(true);
    try {
      const response = await mockApiService.summarizeText({
        text: inputText,
        summary_type: selectedSummaryType.value,
        language: selectedLanguage.value
      });

      if (response.status === 'success' && response.data) {
        const result: SummaryResult = {
          id: `text-${Date.now()}`,
          originalText: inputText,
          summary: response.data.data.summary,
          summaryType: response.data.data.summary_type,
          language: response.data.data.language,
          processingTime: response.data.data.processing_time,
          modelUsed: response.data.data.model_used,
          metadata: response.data.data,
          timestamp: new Date(),
        };

        setResults(prev => [result, ...prev]);
        onShowSnackbar('Tóm tắt văn bản thành công!', 'success');
        setInputText('');
      } else {
        throw new Error(response.error?.message || 'Tóm tắt thất bại');
      }
    } catch (error) {
      console.error('Text summarization error:', error);
      onShowSnackbar(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi tóm tắt văn bản',
        'error'
      );
    } finally {
      setProcessing(false);
    }
  }, [inputText, selectedSummaryType, selectedLanguage, onShowSnackbar]);

  // Handle document upload and summarization
  const handleDocumentSummarization = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      onShowSnackbar('Vui lòng chọn tài liệu để tóm tắt', 'error');
      return;
    }

    const file = uploadedFiles[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      onShowSnackbar('Kích thước file quá lớn (tối đa 10MB)', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await mockApiService.summarizeDocument(
        file,
        selectedSummaryType.value,
        selectedLanguage.value
      );

      if (response.status === 'success' && response.data) {
        const result: SummaryResult = {
          id: `doc-${Date.now()}`,
          originalText: `[Document: ${file.name}]`,
          summary: response.data.data.summary,
          summaryType: response.data.data.summary_type,
          language: response.data.data.language,
          processingTime: response.data.data.processing_time,
          modelUsed: response.data.data.model_used,
          metadata: {
            ...response.data.data,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          },
          timestamp: new Date(),
        };

        setResults(prev => [result, ...prev]);
        onShowSnackbar(`Tóm tắt tài liệu "${file.name}" thành công!`, 'success');
        setUploadedFiles([]);
      } else {
        throw new Error(response.error?.message || 'Tóm tắt tài liệu thất bại');
      }
    } catch (error) {
      console.error('Document summarization error:', error);
      onShowSnackbar(
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi tóm tắt tài liệu',
        'error'
      );
    } finally {
      setProcessing(false);
    }
  }, [uploadedFiles, selectedSummaryType, selectedLanguage, onShowSnackbar]);

  // Handle result selection
  const handleResultClick = (result: SummaryResult) => {
    setSelectedResult(result);
    setShowResultModal(true);
  };

  // Export result
  const exportResult = (result: SummaryResult, format: 'txt' | 'json') => {
    const timestamp = result.timestamp.toISOString().split('T')[0];
    const filename = `summary-${timestamp}-${result.id}.${format}`;
    
    let content: string;
    if (format === 'json') {
      content = JSON.stringify(result, null, 2);
    } else {
      content = `VPBank K-MULT Agent Studio - Text Summary
Generated: ${result.timestamp.toLocaleString()}
Type: ${result.summaryType}
Language: ${result.language}
Processing Time: ${result.processingTime}s
Model: ${result.modelUsed}

Original Text:
${result.originalText}

Summary:
${result.summary}`;
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        {/* Header */}
        <Header
          variant="h1"
          description="Advanced Vietnamese text and document summarization with mock data demonstration"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                iconName="external"
                onClick={() => onShowSnackbar('Documentation feature coming soon', 'info')}
              >
                Documentation
              </Button>
              <Button
                iconName="refresh"
                onClick={() => {
                  setInputText('');
                  setUploadedFiles([]);
                  setResults([]);
                  onShowSnackbar('Đã xóa tất cả dữ liệu', 'info');
                }}
              >
                Clear All
              </Button>
            </SpaceBetween>
          }
        >
          Vietnamese Text Summarization (Mock Demo)
        </Header>

        {/* Configuration Section */}
        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <FormField
            label="Summary Type"
            description="Choose the type of summary that best fits your needs"
          >
            <Select
              selectedOption={selectedSummaryType}
              onChange={({ detail }) => setSelectedSummaryType(detail.selectedOption)}
              options={summaryTypeOptions}
              placeholder="Select summary type"
            />
          </FormField>

          <FormField
            label="Language"
            description="Select the output language for the summary"
          >
            <Select
              selectedOption={selectedLanguage}
              onChange={({ detail }) => setSelectedLanguage(detail.selectedOption)}
              options={languageOptions}
              placeholder="Select language"
            />
          </FormField>
        </Grid>

        {/* Input Tabs */}
        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'text',
              label: 'Text Input',
              content: (
                <SpaceBetween direction="vertical" size="m">
                  <FormField
                    label="Vietnamese Text"
                    description="Enter Vietnamese text to summarize (minimum 50 characters)"
                    constraintText={`${inputText.length} characters`}
                  >
                    <Textarea
                      value={inputText}
                      onChange={({ detail }) => setInputText(detail.value)}
                      placeholder="Nhập văn bản tiếng Việt cần tóm tắt... Ví dụ: VPBank là một trong những ngân hàng thương mại cổ phần hàng đầu tại Việt Nam..."
                      rows={8}
                      disabled={processing}
                    />
                  </FormField>
                  
                  <Box textAlign="right">
                    <Button
                      variant="primary"
                      onClick={handleTextSummarization}
                      loading={processing}
                      disabled={!inputText.trim() || inputText.length < 50}
                      iconName="gen-ai"
                    >
                      {processing ? 'Processing...' : 'Summarize Text'}
                    </Button>
                  </Box>
                </SpaceBetween>
              )
            },
            {
              id: 'document',
              label: 'Document Upload',
              content: (
                <SpaceBetween direction="vertical" size="m">
                  <FormField
                    label="Document Upload"
                    description="Upload documents (.txt, .pdf, .docx, .doc) up to 10MB for mock processing"
                  >
                    <FileUpload
                      onChange={({ detail }) => setUploadedFiles(detail.value)}
                      value={uploadedFiles}
                      i18nStrings={{
                        uploadButtonText: e => e ? "Choose files" : "Choose file",
                        dropzoneText: e => e ? "Drop files to upload" : "Drop file to upload",
                        removeFileAriaLabel: e => `Remove file ${e + 1}`,
                        limitShowFewer: "Show fewer files",
                        limitShowMore: "Show more files",
                        errorIconAriaLabel: "Error"
                      }}
                      showFileLastModified
                      showFileSize
                      showFileThumbnail
                      constraintText="Supported formats: .txt, .pdf, .docx, .doc (max 10MB) - Mock processing"
                      accept=".txt,.pdf,.docx,.doc"
                      disabled={processing}
                    />
                  </FormField>

                  <Box textAlign="right">
                    <Button
                      variant="primary"
                      onClick={handleDocumentSummarization}
                      loading={processing}
                      disabled={uploadedFiles.length === 0}
                      iconName="upload"
                    >
                      {processing ? 'Processing Document...' : 'Summarize Document (Mock)'}
                    </Button>
                  </Box>
                </SpaceBetween>
              )
            }
          ]}
        />

        {/* Processing Status */}
        {processing && (
          <Alert
            statusIconAriaLabel="Info"
            type="info"
            header="Mock processing in progress"
          >
            <SpaceBetween direction="vertical" size="s">
              <Box>
                Your {activeTab === 'text' ? 'text' : 'document'} is being processed by our mock Vietnamese NLP engine. 
                This demonstrates the real-time processing capabilities with simulated Claude AI integration.
              </Box>
              <ProgressBar
                status="in-progress"
                value={50}
                label="Processing with mock data..."
              />
            </SpaceBetween>
          </Alert>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <Cards
            cardDefinition={{
              header: (item: SummaryResult) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Box fontSize="heading-m">
                    {item.originalText.startsWith('[Document:') 
                      ? item.metadata.fileName || 'Document Summary'
                      : 'Text Summary'
                    }
                  </Box>
                  <Badge color="blue">{item.summaryType}</Badge>
                  <Badge color="green">{item.language}</Badge>
                  <Badge color="grey">Mock</Badge>
                </SpaceBetween>
              ),
              sections: [
                {
                  id: "summary",
                  header: "Summary",
                  content: (item: SummaryResult) => (
                    <Box>
                      <div style={{ 
                        maxHeight: '150px', 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {item.summary}
                      </div>
                      {item.summary.length > 300 && (
                        <Button
                          variant="link"
                          onClick={() => handleResultClick(item)}
                        >
                          View full summary
                        </Button>
                      )}
                    </Box>
                  )
                },
                {
                  id: "metadata",
                  header: "Processing Details",
                  content: (item: SummaryResult) => (
                    <KeyValuePairs
                      columns={3}
                      items={[
                        {
                          label: "Processing Time",
                          value: `${item.processingTime.toFixed(2)}s`
                        },
                        {
                          label: "Model Used",
                          value: item.modelUsed
                        },
                        {
                          label: "Compression Ratio",
                          value: item.metadata.compression_ratio ? 
                            `${item.metadata.compression_ratio.toFixed(2)}x` : 'N/A'
                        }
                      ]}
                    />
                  )
                },
                {
                  id: "actions",
                  header: "Actions",
                  content: (item: SummaryResult) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        size="small"
                        onClick={() => handleResultClick(item)}
                        iconName="view-full"
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        onClick={() => exportResult(item, 'txt')}
                        iconName="download"
                      >
                        Export TXT
                      </Button>
                      <Button
                        size="small"
                        onClick={() => exportResult(item, 'json')}
                        iconName="download"
                      >
                        Export JSON
                      </Button>
                    </SpaceBetween>
                  )
                }
              ]
            }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 600, cards: 2 }
            ]}
            items={results}
            header={
              <Header
                counter={`(${results.length})`}
                description="Mock summarization results with simulated processing"
                actions={
                  <Button
                    onClick={() => {
                      setResults([]);
                      onShowSnackbar('Đã xóa tất cả kết quả', 'info');
                    }}
                    iconName="remove"
                  >
                    Clear Results
                  </Button>
                }
              >
                Summary Results
              </Header>
            }
          />
        )}

        {/* Result Detail Modal */}
        <Modal
          visible={showResultModal}
          onDismiss={() => setShowResultModal(false)}
          header="Summary Details (Mock Data)"
          size="large"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => setShowResultModal(false)}
                >
                  Close
                </Button>
                {selectedResult && (
                  <>
                    <Button
                      onClick={() => exportResult(selectedResult, 'txt')}
                      iconName="download"
                    >
                      Export TXT
                    </Button>
                    <Button
                      onClick={() => exportResult(selectedResult, 'json')}
                      iconName="download"
                    >
                      Export JSON
                    </Button>
                  </>
                )}
              </SpaceBetween>
            </Box>
          }
        >
          {selectedResult && (
            <SpaceBetween direction="vertical" size="m">
              <Alert
                statusIconAriaLabel="Info"
                type="info"
                header="Mock Data Demonstration"
              >
                This is a demonstration using mock data to show the complete functionality of the Vietnamese text summarization system.
              </Alert>

              <KeyValuePairs
                columns={2}
                items={[
                  { label: "Type", value: selectedResult.summaryType },
                  { label: "Language", value: selectedResult.language },
                  { label: "Processing Time", value: `${selectedResult.processingTime.toFixed(2)}s` },
                  { label: "Model Used", value: selectedResult.modelUsed },
                  { label: "Generated", value: selectedResult.timestamp.toLocaleString() },
                  { 
                    label: "Compression Ratio", 
                    value: selectedResult.metadata.compression_ratio ? 
                      `${selectedResult.metadata.compression_ratio.toFixed(2)}x` : 'N/A'
                  }
                ]}
              />

              <ExpandableSection headerText="Original Text" defaultExpanded={false}>
                <Box>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedResult.originalText}
                  </div>
                </Box>
              </ExpandableSection>

              <ExpandableSection headerText="Summary" defaultExpanded={true}>
                <Box>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
                    {selectedResult.summary}
                  </div>
                </Box>
              </ExpandableSection>

              {selectedResult.metadata.document_analysis && (
                <ExpandableSection headerText="Document Analysis" defaultExpanded={false}>
                  <KeyValuePairs
                    columns={1}
                    items={[
                      {
                        label: "Document Category",
                        value: selectedResult.metadata.document_analysis.document_category
                      },
                      {
                        label: "Recommendations",
                        value: selectedResult.metadata.document_analysis.recommendations?.note || 'N/A'
                      }
                    ]}
                  />
                </ExpandableSection>
              )}
            </SpaceBetween>
          )}
        </Modal>

        {/* System Information */}
        {summaryTypes && (
          <ExpandableSection headerText="System Information (Mock Configuration)" defaultExpanded={false}>
            <KeyValuePairs
              columns={2}
              items={[
                {
                  label: "Available Summary Types",
                  value: Object.keys(summaryTypes.data.summary_types).length
                },
                {
                  label: "Supported Languages",
                  value: summaryTypes.data.supported_languages?.map((lang: any) => lang.name).join(', ') || 'Vietnamese, English'
                },
                {
                  label: "Supported File Types",
                  value: summaryTypes.data.supported_file_types?.map((type: any) => type.extension).join(', ') || '.txt, .pdf, .docx, .doc'
                },
                {
                  label: "Max File Size",
                  value: summaryTypes.data.limits?.max_file_size || '10MB'
                },
                {
                  label: "Processing Mode",
                  value: "Mock Data Demonstration"
                },
                {
                  label: "API Requests",
                  value: mockApiService.getRequestCount()
                }
              ]}
            />
          </ExpandableSection>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default MockTextSummaryPage;
