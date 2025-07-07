import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Header,
  FormField,
  Select,
  Input,
  Button,
  SpaceBetween,
  Grid,
  Box,
  Alert,
  Spinner,
  Icon,
  ExpandableSection,
  KeyValuePairs,
  ProgressBar
} from '@cloudscape-design/components';

import { 
  summarizeDocument, 
  getSummaryTypes,
  formatFileSize, 
  validateFileUpload,
  handleApiError,
  formatDuration
} from '../services/api';
import { useLoading } from '../hooks/useLoading';

const DocumentUpload = ({ onNotification }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [summaryType, setSummaryType] = useState({ value: 'general' });
  const [maxLength, setMaxLength] = useState('300');
  const [language, setLanguage] = useState({ value: 'vietnamese' });
  const [summaryResult, setSummaryResult] = useState(null);
  const [availableSummaryTypes, setAvailableSummaryTypes] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState('');
  const { isLoading, startLoading, stopLoading } = useLoading();
  const fileInputRef = useRef(null);

  // Default options (fallback)
  const defaultSummaryTypeOptions = [
    { label: 'Tóm tắt chung', value: 'general' },
    { label: 'Điểm chính', value: 'bullet_points' },
    { label: 'Thông tin quan trọng', value: 'key_insights' },
    { label: 'Tóm tắt điều hành', value: 'executive_summary' },
    { label: 'Tóm tắt chi tiết', value: 'detailed' }
  ];

  const defaultLanguageOptions = [
    { label: 'Tiếng Việt', value: 'vietnamese' },
    { label: 'English', value: 'english' }
  ];

  // Load summary types and languages on component mount
  useEffect(() => {
    const loadSummaryTypes = async () => {
      try {
        const response = await getSummaryTypes();
        
        if (response.status === 'success' && response.data) {
          const summaryTypeOptions = Object.entries(response.data.summary_types || {}).map(([key, value]) => ({
            label: value.name,
            value: key,
            description: value.description
          }));
          
          const languageOptions = (response.data.supported_languages || []).map(lang => ({
            label: lang.name,
            value: lang.code,
            description: lang.description
          }));
          
          setAvailableSummaryTypes(summaryTypeOptions.length > 0 ? summaryTypeOptions : defaultSummaryTypeOptions);
          setAvailableLanguages(languageOptions.length > 0 ? languageOptions : defaultLanguageOptions);
        } else {
          setAvailableSummaryTypes(defaultSummaryTypeOptions);
          setAvailableLanguages(defaultLanguageOptions);
        }
      } catch (error) {
        console.error('Failed to load summary types:', error);
        setAvailableSummaryTypes(defaultSummaryTypeOptions);
        setAvailableLanguages(defaultLanguageOptions);
      }
    };

    loadSummaryTypes();
  }, []);

  // Handle file selection with validation
  const handleFileSelect = (file) => {
    const validation = validateFileUpload(file, 10 * 1024 * 1024); // 10MB limit
    
    if (!validation.isValid) {
      setFileError(validation.error);
      onNotification({
        type: 'error',
        content: validation.error,
        dismissible: true
      });
      return;
    }

    setSelectedFile(file);
    setFileError('');
    setSummaryResult(null);
    setUploadProgress(0);
    
    onNotification({
      type: 'success',
      content: `File "${file.name}" đã được chọn thành công! (${formatFileSize(file.size)})`,
      dismissible: true
    });
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle file upload button click
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSummaryResult(null);
    setFileError('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear all data
  const handleClearAll = () => {
    handleRemoveFile();
  };

  // Handle document summarization with progress tracking
  const handleSummarizeDocument = async () => {
    if (!selectedFile) {
      onNotification({
        type: 'warning',
        content: 'Vui lòng chọn file để tóm tắt!',
        dismissible: true
      });
      return;
    }

    if (!summaryType.value) {
      onNotification({
        type: 'warning',
        content: 'Vui lòng chọn loại tóm tắt!',
        dismissible: true
      });
      return;
    }

    try {
      startLoading('Đang xử lý tài liệu...');
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('summary_type', summaryType.value);
      formData.append('max_length', maxLength);
      formData.append('language', language.value);

      console.log('📄 Uploading document:', {
        filename: selectedFile.name,
        size: formatFileSize(selectedFile.size),
        type: summaryType.value,
        language: language.value
      });

      setUploadProgress(30);

      const response = await summarizeDocument(formData);

      setUploadProgress(90);

      if (response.status === 'success') {
        setSummaryResult(response.data);
        setUploadProgress(100);
        
        onNotification({
          type: 'success',
          content: `Tóm tắt tài liệu thành công! Thời gian xử lý: ${formatDuration(response.data.processing_time || 0)}`,
          dismissible: true
        });
      } else {
        throw new Error(response.message || 'Document summarization failed');
      }
    } catch (error) {
      console.error('❌ Document summarization error:', error);
      setUploadProgress(0);
      
      const errorMessage = handleApiError(error);
      onNotification({
        type: 'error',
        content: `Lỗi tóm tắt tài liệu: ${errorMessage}`,
        dismissible: true
      });
    } finally {
      stopLoading();
      setTimeout(() => setUploadProgress(0), 2000); // Reset progress after 2 seconds
    }
  };

  // Format summary output with better HTML rendering
  const formatSummaryOutput = (summary) => {
    if (!summary) return '';
    
    let formatted = summary;
    
    // Handle headers
    formatted = formatted.replace(/^# (.*$)/gm, '<h2 style="color: #0073bb; margin: 20px 0 12px 0; font-size: 1.5em;">$1</h2>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h3 style="color: #0073bb; margin: 16px 0 8px 0; font-size: 1.3em;">$1</h3>');
    formatted = formatted.replace(/^### (.*$)/gm, '<h4 style="color: #0073bb; margin: 12px 0 6px 0; font-size: 1.1em;">$1</h4>');
    
    // Handle bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
    
    // Handle bullet points
    formatted = formatted.replace(/^• (.*$)/gm, '<li style="margin: 6px 0; list-style-type: disc; margin-left: 20px;">$1</li>');
    formatted = formatted.replace(/^\* (.*$)/gm, '<li style="margin: 6px 0; list-style-type: disc; margin-left: 20px;">$1</li>');
    
    // Handle numbered lists
    formatted = formatted.replace(/^(\d+)\. (.*$)/gm, '<li style="margin: 6px 0; list-style-type: decimal; margin-left: 20px;">$2</li>');
    
    // Handle line breaks
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  // Get file type icon
  const getFileTypeIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'docx':
      case 'doc':
        return 'file-word';
      case 'txt':
        return 'file-text';
      default:
        return 'file';
    }
  };

  return (
    <SpaceBetween direction="vertical" size="l">
      <Header
        variant="h1"
        description="Upload và tóm tắt tài liệu với AI Claude 3.7 Sonnet. Hỗ trợ TXT, PDF, DOCX, DOC (tối đa 10MB)"
        actions={
          <Button
            variant="normal"
            onClick={handleClearAll}
            disabled={!selectedFile && !summaryResult}
            iconName="refresh"
          >
            Xóa tất cả
          </Button>
        }
      >
        Upload tài liệu
      </Header>

      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Grid
            gridDefinition={[
              { colspan: { default: 12, xs: 6 } },
              { colspan: { default: 12, xs: 6 } }
            ]}
          >
            {/* Upload Section */}
            <SpaceBetween direction="vertical" size="m">
              <FormField 
                label="Chọn tài liệu"
                description="Kéo thả hoặc click để chọn file. Hỗ trợ: TXT, PDF, DOCX, DOC"
                errorText={fileError}
              >
                <div
                  className={`file-drop-zone ${isDragOver ? 'dragover' : ''} ${fileError ? 'error' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleSelectFileClick}
                >
                  <Box textAlign="center">
                    <Icon name="upload" size="large" />
                    <h3>Kéo thả tài liệu vào đây</h3>
                    <p>hoặc click để chọn file</p>
                    <Button variant="primary" disabled={isLoading}>
                      Chọn tài liệu
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.docx,.doc"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                    />
                    <p style={{ marginTop: '16px', color: '#5f6b7a', fontSize: '14px' }}>
                      Hỗ trợ: TXT, PDF, DOCX, DOC (tối đa 10MB)
                    </p>
                  </Box>
                </div>
              </FormField>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Box>
                  <ProgressBar
                    value={uploadProgress}
                    label="Tiến trình xử lý"
                    description={
                      uploadProgress < 30 ? "Đang upload file..." :
                      uploadProgress < 90 ? "Đang phân tích nội dung..." :
                      "Đang tạo tóm tắt..."
                    }
                  />
                </Box>
              )}

              {/* File Info */}
              {selectedFile && (
                <Alert
                  type="success"
                  dismissible
                  onDismiss={handleRemoveFile}
                  header="File đã được chọn"
                >
                  <Box display="flex" alignItems="center">
                    <Icon name={getFileTypeIcon(selectedFile.name)} />
                    <Box marginLeft="s">
                      <strong>{selectedFile.name}</strong><br />
                      <Box variant="small" color="text-body-secondary">
                        Kích thước: {formatFileSize(selectedFile.size)} • 
                        Loại: {selectedFile.name.split('.').pop().toUpperCase()}
                      </Box>
                    </Box>
                  </Box>
                </Alert>
              )}

              {/* Upload Options */}
              <Grid
                gridDefinition={[
                  { colspan: 6 },
                  { colspan: 3 },
                  { colspan: 3 }
                ]}
              >
                <FormField 
                  label="Loại tóm tắt"
                  description="Chọn kiểu tóm tắt phù hợp"
                >
                  <Select
                    selectedOption={summaryType}
                    onChange={({ detail }) => setSummaryType(detail.selectedOption)}
                    options={availableSummaryTypes}
                    placeholder="Chọn loại tóm tắt"
                  />
                </FormField>

                <FormField 
                  label="Độ dài tối đa"
                  description="Số từ tối đa"
                >
                  <Input
                    value={maxLength}
                    onChange={({ detail }) => setMaxLength(detail.value)}
                    type="number"
                    inputMode="numeric"
                    placeholder="300"
                  />
                </FormField>

                <FormField 
                  label="Ngôn ngữ"
                  description="Ngôn ngữ đầu ra"
                >
                  <Select
                    selectedOption={language}
                    onChange={({ detail }) => setLanguage(detail.selectedOption)}
                    options={availableLanguages}
                  />
                </FormField>
              </Grid>

              <Box>
                <Button
                  variant="primary"
                  onClick={handleSummarizeDocument}
                  disabled={!selectedFile || !!fileError}
                  loading={isLoading}
                  iconName="play"
                >
                  {isLoading ? 'Đang xử lý...' : 'Tóm tắt tài liệu'}
                </Button>
              </Box>
            </SpaceBetween>

            {/* Results Section */}
            <SpaceBetween direction="vertical" size="m">
              <FormField label="Kết quả tóm tắt tài liệu">
                <div className="summary-output">
                  {isLoading ? (
                    <Box textAlign="center" padding="l">
                      <Spinner size="large" />
                      <Box variant="p" color="text-status-info" marginTop="s">
                        AI đang trích xuất và tóm tắt nội dung từ tài liệu...
                      </Box>
                      <Box variant="small" color="text-body-secondary" marginTop="xs">
                        Quá trình này có thể mất 10-60 giây tùy thuộc vào kích thước tài liệu
                      </Box>
                    </Box>
                  ) : summaryResult ? (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formatSummaryOutput(summaryResult.summary) 
                      }} 
                      style={{ lineHeight: '1.6' }}
                    />
                  ) : (
                    <Box variant="p" color="text-status-inactive" textAlign="center" padding="l">
                      <Box marginBottom="s">📄</Box>
                      Upload tài liệu để xem kết quả tóm tắt...
                      <Box variant="small" display="block" marginTop="xs">
                        Chọn file và nhấn "Tóm tắt tài liệu" để bắt đầu
                      </Box>
                    </Box>
                  )}
                </div>
              </FormField>

              {/* Document Statistics */}
              {summaryResult && (
                <ExpandableSection headerText="Thông tin chi tiết tài liệu" defaultExpanded>
                  <SpaceBetween direction="vertical" size="m">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-value">
                          {selectedFile?.name || 'N/A'}
                        </div>
                        <div className="stat-label">Tên file</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {selectedFile ? formatFileSize(selectedFile.size) : 'N/A'}
                        </div>
                        <div className="stat-label">Kích thước file</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {summaryResult.original_length?.toLocaleString('vi-VN') || 'N/A'}
                        </div>
                        <div className="stat-label">Độ dài văn bản (ký tự)</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {formatDuration(summaryResult.processing_time || 0)}
                        </div>
                        <div className="stat-label">Thời gian xử lý</div>
                      </div>
                    </div>

                    <KeyValuePairs
                      columns={2}
                      items={[
                        {
                          label: 'Loại tóm tắt',
                          value: summaryType.label || summaryType.value
                        },
                        {
                          label: 'Ngôn ngữ',
                          value: language.label || language.value
                        },
                        {
                          label: 'Độ dài tóm tắt',
                          value: summaryResult.summary_length?.toLocaleString('vi-VN') + ' ký tự' || 'N/A'
                        },
                        {
                          label: 'Tỷ lệ nén',
                          value: summaryResult.compression_ratio?.toFixed(2) || 'N/A'
                        },
                        {
                          label: 'Model AI',
                          value: summaryResult.model_used || 'Claude 3.7 Sonnet'
                        },
                        {
                          label: 'Phương pháp xử lý',
                          value: summaryResult.processing_method || 'Document Processing'
                        }
                      ]}
                    />

                    {summaryResult.word_count && (
                      <Alert
                        type="info"
                        header="Thống kê từ ngữ"
                      >
                        <KeyValuePairs
                          columns={2}
                          items={[
                            {
                              label: 'Số từ gốc',
                              value: summaryResult.word_count.original?.toLocaleString('vi-VN') || 'N/A'
                            },
                            {
                              label: 'Số từ tóm tắt',
                              value: summaryResult.word_count.summary?.toLocaleString('vi-VN') || 'N/A'
                            }
                          ]}
                        />
                      </Alert>
                    )}

                    {summaryResult.document_analysis && (
                      <Alert
                        type="info"
                        header="Phân tích tài liệu"
                      >
                        <KeyValuePairs
                          columns={1}
                          items={[
                            {
                              label: 'Danh mục tài liệu',
                              value: summaryResult.document_analysis.document_category || 'N/A'
                            },
                            {
                              label: 'Gợi ý loại tóm tắt',
                              value: summaryResult.document_analysis.recommendations?.suggested_types?.join(', ') || 'N/A'
                            },
                            {
                              label: 'Ghi chú',
                              value: summaryResult.document_analysis.recommendations?.note || 'N/A'
                            }
                          ]}
                        />
                      </Alert>
                    )}
                  </SpaceBetween>
                </ExpandableSection>
              )}
            </SpaceBetween>
          </Grid>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

export default DocumentUpload;
