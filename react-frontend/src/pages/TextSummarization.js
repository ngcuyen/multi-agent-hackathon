import React, { useState, useEffect } from 'react';
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
  Spinner,
  Alert,
  ExpandableSection,
  KeyValuePairs
} from '@cloudscape-design/components';

import { 
  summarizeText, 
  getSummaryTypes, 
  validateTextInput,
  handleApiError,
  formatDuration 
} from '../services/api';
import { useLoading } from '../hooks/useLoading';

const TextSummarization = ({ onNotification }) => {
  const [inputText, setInputText] = useState('');
  const [summaryType, setSummaryType] = useState({ value: 'general' });
  const [maxLength, setMaxLength] = useState('300');
  const [language, setLanguage] = useState({ value: 'vietnamese' });
  const [summaryResult, setSummaryResult] = useState(null);
  const [availableSummaryTypes, setAvailableSummaryTypes] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [inputError, setInputError] = useState('');
  const { isLoading, startLoading, stopLoading } = useLoading();

  // Default summary type options (fallback)
  const defaultSummaryTypeOptions = [
    { label: 'Tóm tắt chung', value: 'general' },
    { label: 'Điểm chính', value: 'bullet_points' },
    { label: 'Thông tin quan trọng', value: 'key_insights' },
    { label: 'Tóm tắt điều hành', value: 'executive_summary' },
    { label: 'Tóm tắt chi tiết', value: 'detailed' }
  ];

  // Default language options (fallback)
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
          // Convert API response to select options
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
          // Use defaults if API fails
          setAvailableSummaryTypes(defaultSummaryTypeOptions);
          setAvailableLanguages(defaultLanguageOptions);
        }
      } catch (error) {
        console.error('Failed to load summary types:', error);
        // Use defaults if API fails
        setAvailableSummaryTypes(defaultSummaryTypeOptions);
        setAvailableLanguages(defaultLanguageOptions);
        
        onNotification({
          type: 'warning',
          content: 'Không thể tải danh sách loại tóm tắt. Sử dụng cấu hình mặc định.',
          dismissible: true
        });
      }
    };

    loadSummaryTypes();
  }, [onNotification]);

  // Handle text input change with validation
  const handleTextChange = (value) => {
    setInputText(value);
    setInputError('');
    
    // Real-time validation
    if (value.trim().length > 0) {
      const validation = validateTextInput(value, 10, 50000);
      if (!validation.isValid) {
        setInputError(validation.error);
      }
    }
  };

  // Handle text summarization
  const handleSummarize = async () => {
    // Validate input
    const validation = validateTextInput(inputText, 10, 50000);
    if (!validation.isValid) {
      setInputError(validation.error);
      onNotification({
        type: 'error',
        content: validation.error,
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
      startLoading('Đang phân tích và tóm tắt văn bản...');
      
      const requestData = {
        text: validation.text,
        summary_type: summaryType.value,
        max_length: parseInt(maxLength) || 300,
        language: language.value
      };

      console.log('📝 Summarizing text with options:', {
        ...requestData,
        text: requestData.text.substring(0, 100) + '...'
      });

      const response = await summarizeText(requestData);
      
      if (response.status === 'success') {
        setSummaryResult(response.data);
        setInputError('');
        onNotification({
          type: 'success',
          content: `Tóm tắt văn bản thành công! Thời gian xử lý: ${formatDuration(response.data.processing_time || 0)}`,
          dismissible: true
        });
      } else {
        throw new Error(response.message || 'Summarization failed');
      }
    } catch (error) {
      console.error('❌ Summarization error:', error);
      const errorMessage = handleApiError(error);
      onNotification({
        type: 'error',
        content: `Lỗi tóm tắt văn bản: ${errorMessage}`,
        dismissible: true
      });
    } finally {
      stopLoading();
    }
  };

  // Clear all data
  const handleClear = () => {
    setInputText('');
    setSummaryResult(null);
    setInputError('');
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

  // Get character count info
  const getCharacterCountInfo = () => {
    const length = inputText.length;
    if (length === 0) return { color: 'text-status-inactive', text: '0 ký tự' };
    if (length < 10) return { color: 'text-status-error', text: `${length} ký tự (tối thiểu 10)` };
    if (length > 50000) return { color: 'text-status-error', text: `${length} ký tự (tối đa 50,000)` };
    return { color: 'text-status-success', text: `${length} ký tự` };
  };

  const charCountInfo = getCharacterCountInfo();

  return (
    <SpaceBetween direction="vertical" size="l">
      <Header
        variant="h1"
        description="Sử dụng AI Claude 3.7 Sonnet để tóm tắt văn bản thông minh với nhiều loại tóm tắt khác nhau"
        actions={
          <Button
            variant="normal"
            onClick={handleClear}
            disabled={!inputText && !summaryResult}
            iconName="refresh"
          >
            Xóa tất cả
          </Button>
        }
      >
        Tóm tắt văn bản
      </Header>

      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Grid
            gridDefinition={[
              { colspan: { default: 12, xs: 7 } },
              { colspan: { default: 12, xs: 5 } }
            ]}
          >
            {/* Input Section */}
            <SpaceBetween direction="vertical" size="m">
              <FormField
                label="Văn bản cần tóm tắt"
                description={
                  <Box>
                    Nhập hoặc dán văn bản cần tóm tắt vào đây. 
                    <Box display="inline" color={charCountInfo.color} marginLeft="s">
                      {charCountInfo.text}
                    </Box>
                  </Box>
                }
                errorText={inputError}
              >
                <Textarea
                  value={inputText}
                  onChange={({ detail }) => handleTextChange(detail.value)}
                  placeholder="Nhập văn bản cần tóm tắt... (tối thiểu 10 ký tự, tối đa 50,000 ký tự)"
                  rows={15}
                  invalid={!!inputError}
                />
              </FormField>

              <Grid
                gridDefinition={[
                  { colspan: 6 },
                  { colspan: 3 },
                  { colspan: 3 }
                ]}
              >
                <FormField 
                  label="Loại tóm tắt"
                  description="Chọn kiểu tóm tắt phù hợp với mục đích sử dụng"
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
                  description="Số từ tối đa trong tóm tắt"
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
                  onClick={handleSummarize}
                  loading={isLoading}
                  disabled={!inputText.trim() || !!inputError}
                  iconName="play"
                >
                  {isLoading ? 'Đang tóm tắt...' : 'Tóm tắt văn bản'}
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
                      <Box variant="p" color="text-status-info" marginTop="s">
                        AI đang phân tích và tóm tắt nội dung...
                      </Box>
                      <Box variant="small" color="text-body-secondary" marginTop="xs">
                        Quá trình này có thể mất 5-30 giây tùy thuộc vào độ dài văn bản
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
                      <Box marginBottom="s">📝</Box>
                      Kết quả tóm tắt sẽ hiển thị ở đây...
                      <Box variant="small" display="block" marginTop="xs">
                        Nhập văn bản và nhấn "Tóm tắt văn bản" để bắt đầu
                      </Box>
                    </Box>
                  )}
                </div>
              </FormField>

              {/* Statistics */}
              {summaryResult && (
                <ExpandableSection headerText="Thống kê chi tiết" defaultExpanded>
                  <SpaceBetween direction="vertical" size="m">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-value">
                          {summaryResult.original_length?.toLocaleString('vi-VN') || 'N/A'}
                        </div>
                        <div className="stat-label">Độ dài gốc (ký tự)</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {summaryResult.summary_length?.toLocaleString('vi-VN') || 'N/A'}
                        </div>
                        <div className="stat-label">Độ dài tóm tắt (ký tự)</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {summaryResult.compression_ratio?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="stat-label">Tỷ lệ nén</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">
                          {formatDuration(summaryResult.processing_time || 0)}
                        </div>
                        <div className="stat-label">Thời gian xử lý</div>
                      </div>
                    </div>

                    {summaryResult.word_count && (
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
                          },
                          {
                            label: 'Model AI sử dụng',
                            value: summaryResult.model_used || 'Claude 3.7 Sonnet'
                          },
                          {
                            label: 'Phương pháp xử lý',
                            value: summaryResult.processing_method || 'Direct AI Call'
                          }
                        ]}
                      />
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

export default TextSummarization;
