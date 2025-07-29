import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  Box,
  Form,
  FormField,
  Textarea,
  Select,
  Input,
  Button,
  Alert,
  ExpandableSection,
  ColumnLayout,
  FileUpload,
  ProgressBar
} from '@cloudscape-design/components';
import { textAPI } from '../../services/api';
import { SummaryResponse, SummaryType, Language } from '../../types';

interface TextSummaryPageProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

const TextSummaryPage: React.FC<TextSummaryPageProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResponse | null>(null);

  // Text Summary State
  const [textForm, setTextForm] = useState({
    text: '',
    summary_type: 'general' as SummaryType,
    language: 'vietnamese' as Language,
    max_length: 300
  });

  // Document Upload State
  const [documentForm, setDocumentForm] = useState({
    file: null as File | null,
    summary_type: 'general' as SummaryType,
    language: 'vietnamese' as Language
  });

  const summaryTypeOptions = [
    { label: 'Tóm tắt chung', value: 'general' },
    { label: 'Điểm chính', value: 'bullet_points' },
    { label: 'Thông tin quan trọng', value: 'key_insights' },
    { label: 'Tóm tắt điều hành', value: 'executive_summary' },
    { label: 'Tóm tắt chi tiết', value: 'detailed' },
    { label: 'Tóm tắt ngắn gọn', value: 'brief' }
  ];

  const languageOptions = [
    { label: 'Tiếng Việt', value: 'vietnamese' },
    { label: 'English', value: 'english' }
  ];

  const handleTextSummary = async () => {
    if (!textForm.text.trim()) {
      onShowSnackbar('Vui lòng nhập văn bản cần tóm tắt', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await textAPI.summarizeText(textForm);
      if (response.status === 'success' && response.data) {
        setResult(response.data);
        onShowSnackbar('Tóm tắt văn bản thành công!', 'success');
      } else {
        throw new Error(response.message || 'Có lỗi xảy ra khi tóm tắt văn bản');
      }
    } catch (error) {
      console.error('Text summary error:', error);
      onShowSnackbar('Không thể tóm tắt văn bản. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSummary = async () => {
    if (!documentForm.file) {
      onShowSnackbar('Vui lòng chọn tài liệu cần tóm tắt', 'warning');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting document summary...');
      onShowSnackbar('Đang xử lý tài liệu, vui lòng chờ...', 'info');

      const response = await textAPI.summarizeDocument(documentForm.file!, documentForm.summary_type, documentForm.language);

      console.log('Document summary response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.status === 'success' && response.data) {
        setResult(response.data);
        onShowSnackbar('Tóm tắt tài liệu thành công!', 'success');
        console.log('Success: Document summarized successfully');
      } else {
        console.error('Response indicates failure:', response);
        throw new Error(response.message || 'Có lỗi xảy ra khi tóm tắt tài liệu');
      }
    } catch (error) {
      console.error('Document summary error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });

      if (error instanceof Error && error.name === 'AbortError') {
        onShowSnackbar('Quá trình xử lý tài liệu mất quá nhiều thời gian. Vui lòng thử lại với tài liệu nhỏ hơn.', 'error');
      } else {
        onShowSnackbar(`Không thể tóm tắt tài liệu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h1"
          description="Sử dụng AI để tóm tắt văn bản và tài liệu với nhiều định dạng khác nhau"
        >
          📄 Tóm tắt văn bản & Tài liệu
        </Header>

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'text',
              label: 'Tóm tắt văn bản',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Form>
                    <SpaceBetween direction="vertical" size="l">
                      <FormField
                        label="Văn bản cần tóm tắt"
                        description="Nhập hoặc dán văn bản bạn muốn tóm tắt"
                        constraintText="Tối đa 10,000 ký tự"
                      >
                        <Textarea
                          value={textForm.text}
                          onChange={({ detail }) => setTextForm({ ...textForm, text: detail.value })}
                          placeholder="Nhập văn bản cần tóm tắt tại đây..."
                          rows={8}
                          disabled={loading}
                        />
                      </FormField>

                      <ColumnLayout columns={3}>
                        <FormField label="Loại tóm tắt">
                          <Select
                            selectedOption={summaryTypeOptions.find(opt => opt.value === textForm.summary_type) || null}
                            onChange={({ detail }) => setTextForm({
                              ...textForm,
                              summary_type: detail.selectedOption.value as SummaryType
                            })}
                            options={summaryTypeOptions}
                            disabled={loading}
                          />
                        </FormField>

                        <FormField label="Ngôn ngữ">
                          <Select
                            selectedOption={languageOptions.find(opt => opt.value === textForm.language) || null}
                            onChange={({ detail }) => setTextForm({
                              ...textForm,
                              language: detail.selectedOption.value as Language
                            })}
                            options={languageOptions}
                            disabled={loading}
                          />
                        </FormField>

                        <FormField label="Độ dài tối đa (từ)">
                          <Input
                            type="number"
                            value={textForm.max_length.toString()}
                            onChange={({ detail }) => setTextForm({
                              ...textForm,
                              max_length: Math.max(50, Math.min(1000, parseInt(detail.value) || 300))
                            })}
                            disabled={loading}
                          />
                        </FormField>
                      </ColumnLayout>

                      <Box>
                        <Button
                          variant="primary"
                          onClick={handleTextSummary}
                          loading={loading}
                          disabled={!textForm.text.trim()}
                        >
                          🤖 Tóm tắt văn bản
                        </Button>
                      </Box>
                    </SpaceBetween>
                  </Form>
                </SpaceBetween>
              )
            },
            {
              id: 'document',
              label: 'Tóm tắt tài liệu',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Alert type="info">
                    Hỗ trợ các định dạng: PDF, DOCX, TXT. Kích thước tối đa: 10MB
                  </Alert>

                  <Form>
                    <SpaceBetween direction="vertical" size="l">
                      <FormField
                        label="Tải lên tài liệu"
                        description="Chọn tài liệu cần tóm tắt"
                      >
                        <FileUpload
                          onChange={({ detail }) => setDocumentForm({
                            ...documentForm,
                            file: detail.value[0] || null
                          })}
                          value={documentForm.file ? [documentForm.file] : []}
                          i18nStrings={{
                            uploadButtonText: e => e ? "Chọn tài liệu khác" : "Chọn tài liệu",
                            dropzoneText: e => e ? "Thả tài liệu vào đây" : "Thả tài liệu vào đây để tải lên",
                            removeFileAriaLabel: e => `Xóa tài liệu ${e + 1}`,
                            limitShowFewer: "Hiển thị ít hơn",
                            limitShowMore: "Hiển thị thêm",
                            errorIconAriaLabel: "Lỗi"
                          }}
                          showFileLastModified
                          showFileSize
                          showFileThumbnail
                          constraintText="PDF, DOCX, TXT. Tối đa 10MB"
                          accept=".pdf,.docx,.txt"
                        />
                      </FormField>

                      <ColumnLayout columns={2}>
                        <FormField label="Loại tóm tắt">
                          <Select
                            selectedOption={summaryTypeOptions.find(opt => opt.value === documentForm.summary_type) || null}
                            onChange={({ detail }) => setDocumentForm({
                              ...documentForm,
                              summary_type: detail.selectedOption.value as SummaryType
                            })}
                            options={summaryTypeOptions}
                            disabled={loading}
                          />
                        </FormField>

                        <FormField label="Ngôn ngữ">
                          <Select
                            selectedOption={languageOptions.find(opt => opt.value === documentForm.language) || null}
                            onChange={({ detail }) => setDocumentForm({
                              ...documentForm,
                              language: detail.selectedOption.value as Language
                            })}
                            options={languageOptions}
                            disabled={loading}
                          />
                        </FormField>
                      </ColumnLayout>

                      <Box>
                        <Button
                          variant="primary"
                          onClick={handleDocumentSummary}
                          loading={loading}
                          disabled={!documentForm.file}
                        >
                          📄 Tóm tắt tài liệu
                        </Button>
                      </Box>
                    </SpaceBetween>
                  </Form>
                </SpaceBetween>
              )
            }
          ]}
        />

        {/* Loading Progress */}
        {loading && (
          <Box>
            <ProgressBar
              status="in-progress"
              value={50}
              additionalInfo="Đang xử lý bằng AI..."
              description="Vui lòng chờ trong giây lát"
            />
          </Box>
        )}

        {/* Results */}
        {result && (
          <Box>
            <Header
              variant="h2"
              actions={
                <Button onClick={clearResult} iconName="close">
                  Xóa kết quả
                </Button>
              }
            >
              ✨ Kết quả tóm tắt
            </Header>

            <SpaceBetween direction="vertical" size="m">
              {/* Summary Content */}
              <div style={{ border: '1px solid #e9ebed', borderRadius: '8px', backgroundColor: '#fafbfc' }}>
                <Box padding="l">
                  <Header variant="h3">📝 Nội dung tóm tắt</Header>
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>
                    {result.summary}
                  </div>
                </Box>
              </div>

              {/* Statistics */}
              <ColumnLayout columns={4} variant="text-grid">
                <div>
                  <Box variant="awsui-key-label">Độ dài gốc</Box>
                  <div>{result.original_length.toLocaleString()} ký tự</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Độ dài tóm tắt</Box>
                  <div>{result.summary_length.toLocaleString()} ký tự</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Tỷ lệ nén</Box>
                  <div>{result.compression_ratio.toFixed(2)}x</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Thời gian xử lý</Box>
                  <div>{result.processing_time.toFixed(2)}s</div>
                </div>
              </ColumnLayout>

              {/* Detailed Analysis */}
              <ExpandableSection headerText="📊 Phân tích chi tiết">
                <SpaceBetween direction="vertical" size="m">
                  <ColumnLayout columns={2}>
                    <div>
                      <Box variant="awsui-key-label">Loại tóm tắt</Box>
                      <div>{result.summary_type}</div>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Ngôn ngữ</Box>
                      <div>{result.language}</div>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Model AI</Box>
                      <div>{result.model_used}</div>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Loại tài liệu</Box>
                      <div>{result.document_analysis.document_category}</div>
                    </div>
                  </ColumnLayout>
                  <Box>
                    <Box variant="awsui-key-label">Số từ</Box>
                    <ColumnLayout columns={2}>
                      <div>Gốc: {result.word_count.original.toLocaleString()} từ</div>
                      <div>Tóm tắt: {result.word_count.summary.toLocaleString()} từ</div>
                    </ColumnLayout>
                  </Box>
                  {result.document_analysis.recommendations && (

                    <Box>
                      <Box variant="awsui-key-label">Gợi ý</Box>
                      <div style={{ fontSize: '14px', color: '#5f6b7a' }}>
                        {result.document_analysis.recommendations.note}
                      </div>
                    </Box>
                  )}
                </SpaceBetween>
              </ExpandableSection>
            </SpaceBetween>
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default TextSummaryPage;
