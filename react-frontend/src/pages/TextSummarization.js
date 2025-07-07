import React, { useState } from 'react';
import {
  Container,
  Header,
  FormField,
  Textarea,
  Select,
  Input,
  Button,
  SpaceBetween,
  Grid,
  Box,
  Spinner
} from '@cloudscape-design/components';

import { summarizeText } from '../services/api';
import { useLoading } from '../hooks/useLoading';

const TextSummarization = ({ onNotification }) => {
  const [inputText, setInputText] = useState('');
  const [summaryType, setSummaryType] = useState({ value: 'general' });
  const [maxLength, setMaxLength] = useState('300');
  const [language, setLanguage] = useState({ value: 'vietnamese' });
  const [summaryResult, setSummaryResult] = useState(null);
  const { isLoading, startLoading, stopLoading } = useLoading();

  // Summary type options
  const summaryTypeOptions = [
    { label: 'Tóm tắt chung', value: 'general' },
    { label: 'Điểm chính', value: 'bullet_points' },
    { label: 'Thông tin quan trọng', value: 'key_insights' },
    { label: 'Tóm tắt điều hành', value: 'executive_summary' },
    { label: 'Tóm tắt chi tiết', value: 'detailed' }
  ];

  // Language options
  const languageOptions = [
    { label: 'Tiếng Việt', value: 'vietnamese' },
    { label: 'English', value: 'english' }
  ];

  // Handle text summarization
  const handleSummarize = async () => {
    if (!inputText.trim()) {
      onNotification({
        type: 'warning',
        content: 'Vui lòng nhập văn bản cần tóm tắt!',
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
      startLoading('Đang tóm tắt văn bản...');
      
      const requestData = {
        text: inputText,
        summary_type: summaryType.value,
        max_length: parseInt(maxLength),
        language: language.value
      };

      const response = await summarizeText(requestData);
      
      if (response.status === 'success') {
        setSummaryResult(response.data);
        onNotification({
          type: 'success',
          content: 'Tóm tắt văn bản thành công!',
          dismissible: true
        });
      } else {
        throw new Error('Summarization failed');
      }
    } catch (error) {
      console.error('Summarization error:', error);
      onNotification({
        type: 'error',
        content: 'Có lỗi xảy ra khi tóm tắt văn bản!',
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
    formatted = formatted.replace(/\* (.*)/g, '<li style="margin: 4px 0;">$1</li>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  return (
    <SpaceBetween direction="vertical" size="l">
      <Header
        variant="h1"
        description="Sử dụng AI để tóm tắt văn bản thông minh với nhiều loại tóm tắt khác nhau"
      >
        Tóm tắt văn bản
      </Header>

      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Grid
            gridDefinition={[
              { colspan: { default: 12, xs: 8 } },
              { colspan: { default: 12, xs: 4 } }
            ]}
          >
            {/* Input Section */}
            <SpaceBetween direction="vertical" size="m">
              <FormField
                label="Văn bản cần tóm tắt"
                description="Nhập hoặc dán văn bản cần tóm tắt vào đây"
              >
                <Textarea
                  value={inputText}
                  onChange={({ detail }) => setInputText(detail.value)}
                  placeholder="Nhập văn bản cần tóm tắt..."
                  rows={12}
                />
              </FormField>

              <Grid
                gridDefinition={[
                  { colspan: 6 },
                  { colspan: 3 },
                  { colspan: 3 }
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

                <FormField label="Độ dài tối đa (từ)">
                  <Input
                    value={maxLength}
                    onChange={({ detail }) => setMaxLength(detail.value)}
                    type="number"
                    inputMode="numeric"
                  />
                </FormField>

                <FormField label="Ngôn ngữ">
                  <Select
                    selectedOption={language}
                    onChange={({ detail }) => setLanguage(detail.selectedOption)}
                    options={languageOptions}
                  />
                </FormField>
              </Grid>

              <Box>
                <Button
                  variant="primary"
                  onClick={handleSummarize}
                  loading={isLoading}
                  iconName="play"
                >
                  Tóm tắt văn bản
                </Button>
              </Box>
            </SpaceBetween>

            {/* Output Section */}
            <SpaceBetween direction="vertical" size="m">
              <FormField label="Kết quả tóm tắt">
                <div className="summary-output">
                  {isLoading ? (
                    <Box textAlign="center" padding="l">
                      <Spinner size="large" />
                      <Box variant="p" color="text-status-info">
                        AI đang phân tích và tóm tắt nội dung...
                      </Box>
                    </Box>
                  ) : summaryResult ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: formatSummaryOutput(summaryResult.summary) 
                    }} />
                  ) : (
                    <Box variant="p" color="text-status-inactive">
                      Kết quả tóm tắt sẽ hiển thị ở đây...
                    </Box>
                  )}
                </div>
              </FormField>

              {/* Statistics */}
              {summaryResult && (
                <Container header={<Header variant="h3">Thống kê</Header>}>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">
                        {summaryResult.original_length?.toLocaleString('vi-VN')}
                      </div>
                      <div className="stat-label">Độ dài gốc (ký tự)</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {summaryResult.summary_length?.toLocaleString('vi-VN')}
                      </div>
                      <div className="stat-label">Độ dài tóm tắt (ký tự)</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {summaryResult.compression_ratio?.toFixed(2)}x
                      </div>
                      <div className="stat-label">Tỷ lệ nén</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {summaryResult.processing_time?.toFixed(2)}s
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

export default TextSummarization;
