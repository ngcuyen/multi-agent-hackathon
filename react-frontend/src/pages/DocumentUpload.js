import React, { useState, useRef } from 'react';
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
  Icon
} from '@cloudscape-design/components';

import { summarizeDocument, formatFileSize } from '../services/api';
import { useLoading } from '../hooks/useLoading';

const DocumentUpload = ({ onNotification }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [summaryType, setSummaryType] = useState({ value: 'general' });
  const [maxLength, setMaxLength] = useState('300');
  const [summaryResult, setSummaryResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { isLoading, startLoading, stopLoading } = useLoading();
  const fileInputRef = useRef(null);

  // Summary type options
  const summaryTypeOptions = [
    { label: 'Tóm tắt chung', value: 'general' },
    { label: 'Điểm chính', value: 'bullet_points' },
    { label: 'Thông tin quan trọng', value: 'key_insights' },
    { label: 'Tóm tắt điều hành', value: 'executive_summary' },
    { label: 'Tóm tắt chi tiết', value: 'detailed' }
  ];

  // Handle file selection
  const handleFileSelect = (file) => {
    const allowedTypes = ['.txt', '.pdf', '.docx', '.doc'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      onNotification({
        type: 'error',
        content: 'Loại file không được hỗ trợ! Chỉ chấp nhận: TXT, PDF, DOCX, DOC',
        dismissible: true
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      onNotification({
        type: 'error',
        content: 'File quá lớn! Kích thước tối đa là 10MB',
        dismissible: true
      });
      return;
    }

    setSelectedFile(file);
    onNotification({
      type: 'success',
      content: `File "${file.name}" đã được chọn thành công!`,
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle document summarization
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

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('summary_type', summaryType.value);
      formData.append('max_length', maxLength);
      formData.append('language', 'vietnamese');

      const response = await summarizeDocument(formData);

      if (response.status === 'success') {
        setSummaryResult(response.data);
        onNotification({
          type: 'success',
          content: 'Tóm tắt tài liệu thành công!',
          dismissible: true
        });
      } else {
        throw new Error('Document summarization failed');
      }
    } catch (error) {
      console.error('Document summarization error:', error);
      onNotification({
        type: 'error',
        content: 'Có lỗi xảy ra khi tóm tắt tài liệu!',
        dismissible: true
      });
    } finally {
      stopLoading();
    }
  };

  // Format summary output
  const formatSummaryOutput = (summary) => {
    if (!summary) return '';
    
    let formatted = summary;
    formatted = formatted.replace(/# (.*)/g, '<h3 style="color: #0073bb; margin: 16px 0 8px 0;">$1</h3>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\* (.*)/g, '<li style="margin: 4px 0; list-style-type: disc; margin-left: 20px;">$1</li>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  return (
    <SpaceBetween direction="vertical" size="l">
      <Header
        variant="h1"
        description="Upload và tóm tắt tài liệu với AI. Hỗ trợ TXT, PDF, DOCX, DOC"
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
              <FormField label="Chọn tài liệu">
                <div
                  className={`file-drop-zone ${isDragOver ? 'dragover' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleSelectFileClick}
                >
                  <Box textAlign="center">
                    <Icon name="upload" size="large" />
                    <h3>Kéo thả tài liệu vào đây</h3>
                    <p>hoặc click để chọn file</p>
                    <Button variant="primary">
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

              {/* File Info */}
              {selectedFile && (
                <Alert
                  type="success"
                  dismissible
                  onDismiss={handleRemoveFile}
                  header="File đã được chọn"
                >
                  <strong>{selectedFile.name}</strong><br />
                  Kích thước: {formatFileSize(selectedFile.size)}
                </Alert>
              )}

              {/* Upload Options */}
              <Grid
                gridDefinition={[
                  { colspan: 8 },
                  { colspan: 4 }
                ]}
              >
                <FormField label="Loại tóm tắt">
                  <Select
                    selectedOption={summaryType}
                    onChange={({ detail }) => setSummaryType(detail.selectedOption)}
                    options={summaryTypeOptions}
                    placeholder="Chọn loại tóm tắt"
                  />
                </FormField>

                <FormField label="Độ dài tối đa">
                  <Input
                    value={maxLength}
                    onChange={({ detail }) => setMaxLength(detail.value)}
                    type="number"
                    inputMode="numeric"
                  />
                </FormField>
              </Grid>

              <Box>
                <Button
                  variant="primary"
                  onClick={handleSummarizeDocument}
                  disabled={!selectedFile}
                  loading={isLoading}
                  iconName="play"
                >
                  Tóm tắt tài liệu
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
                      <Box variant="p" color="text-status-info">
                        AI đang trích xuất và tóm tắt nội dung từ tài liệu...
                      </Box>
                    </Box>
                  ) : summaryResult ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: formatSummaryOutput(summaryResult.summary) 
                    }} />
                  ) : (
                    <Box variant="p" color="text-status-inactive">
                      Upload tài liệu để xem kết quả tóm tắt...
                    </Box>
                  )}
                </div>
              </FormField>

              {/* Document Statistics */}
              {summaryResult && (
                <Container header={<Header variant="h3">Thông tin tài liệu</Header>}>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">
                        {summaryResult.document_info?.filename || 'N/A'}
                      </div>
                      <div className="stat-label">Tên file</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {summaryResult.document_info?.file_size 
                          ? formatFileSize(summaryResult.document_info.file_size)
                          : 'N/A'
                        }
                      </div>
                      <div className="stat-label">Kích thước</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {summaryResult.document_info?.extracted_text_length?.toLocaleString('vi-VN') || 'N/A'}
                      </div>
                      <div className="stat-label">Độ dài văn bản</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {summaryResult.processing_time?.toFixed(2) || 'N/A'}s
                      </div>
                      <div className="stat-label">Thời gian xử lý</div>
                    </div>
                  </div>
                </Container>
              )}
            </SpaceBetween>
          </Grid>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

export default DocumentUpload;
