import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Alert,
  StatusIndicator,
  ColumnLayout,
  Cards,
  Badge,
  Form,
  FormField,
  Input,
  Textarea,
  FileUpload,
  Modal,
  ProgressBar,
  KeyValuePairs,
  Tabs,
  BarChart,
  LineChart
} from '@cloudscape-design/components';

interface PureStrandsInterfaceProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  processing_time?: number;
  agent_used?: string;
  file_info?: {
    filename: string;
    size: number;
    type: string;
  };
}

interface SystemStatus {
  status: string;
  system_info: {
    system: string;
    supervisor_status: string;
    available_agents: string[];
    node_integration: Record<string, string>;
    active_sessions: number;
    processing_stats: {
      total_requests: number;
      successful_responses: number;
      errors: number;
      agent_usage: Record<string, number>;
    };
  };
  endpoints: Record<string, string>;
  usage_examples: Record<string, string>;
}

interface ProcessingResult {
  response: string;
  processing_time: number;
  agent_used: string;
  confidence_score?: number;
  additional_info?: any;
}

const PureStrandsInterface: React.FC<PureStrandsInterfaceProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load system status on component mount
  useEffect(() => {
    loadSystemStatus();
    setSessionId(`session-${Date.now()}`);
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'system',
      content: '🤖 Chào mừng bạn đến với VPBank K-MULT Pure Strands AI Assistant!\n\nTôi có thể giúp bạn:\n• Tóm tắt tài liệu (PDF, DOCX, TXT)\n• Trả lời câu hỏi về quy định ngân hàng (UCP 600, SBV)\n• Phân tích rủi ro tín dụng\n• Xử lý thông tin đa dạng với AI thông minh\n\nHãy nhập câu hỏi hoặc upload file để bắt đầu!',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);

    // Set up auto-refresh for system status
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/pure-strands/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error loading system status:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() && !uploadedFile) {
      onShowSnackbar('Vui lòng nhập tin nhắn hoặc chọn file', 'warning');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
      file_info: uploadedFile ? {
        filename: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', currentMessage);
      
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/pure-strands/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: data.response || data.message || 'Đã xử lý thành công',
        timestamp: new Date(),
        processing_time: data.processing_time,
        agent_used: data.agent_used || 'Pure Strands AI'
      };

      setMessages(prev => [...prev, assistantMessage]);
      onShowSnackbar('Xử lý thành công', 'success');

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: `❌ Lỗi xử lý: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      onShowSnackbar('Lỗi khi xử lý tin nhắn', 'error');
    } finally {
      setLoading(false);
      setCurrentMessage('');
      setUploadedFile(null);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(`session-${Date.now()}`);
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'user': return '#e3f2fd';
      case 'assistant': return '#f3e5f5';
      case 'system': return '#fff3e0';
      default: return '#f5f5f5';
    }
  };

  const getAgentBadgeColor = (agent: string) => {
    if (agent.includes('text_summary')) return 'blue';
    if (agent.includes('compliance')) return 'green';
    if (agent.includes('risk')) return 'orange';
    return 'grey';
  };

  const agentUsageData = systemStatus?.system_info.processing_stats.agent_usage ? 
    Object.entries(systemStatus.system_info.processing_stats.agent_usage).map(([agent, count]) => ({
      x: agent.replace('_agent', '').replace('_', ' '),
      y: count
    })) : [];

  const processingStatsData = systemStatus ? [
    { title: 'Thành công', value: systemStatus.system_info.processing_stats.successful_responses, color: '#1f77b4' },
    { title: 'Lỗi', value: systemStatus.system_info.processing_stats.errors, color: '#d62728' }
  ] : [];

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Giao diện AI thông minh với khả năng xử lý đa dạng"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                iconName="status-info"
                onClick={() => setStatsModalVisible(true)}
              >
                Thống kê hệ thống
              </Button>
              <Button
                iconName="refresh"
                onClick={loadSystemStatus}
              >
                Làm mới
              </Button>
              <Button
                iconName="remove"
                onClick={clearChat}
              >
                Xóa chat
              </Button>
            </SpaceBetween>
          }
        >
          ⚡ Pure Strands AI Interface
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* System Status Overview */}
        {systemStatus && (
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Trạng thái hệ thống</Box>
              <Box variant="awsui-value-large">
                <StatusIndicator type={systemStatus.status === 'active' ? 'success' : 'error'}>
                  {systemStatus.status === 'active' ? 'Hoạt động' : 'Lỗi'}
                </StatusIndicator>
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Agents khả dụng</Box>
              <Box variant="awsui-value-large">{systemStatus.system_info.available_agents.length}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Sessions hoạt động</Box>
              <Box variant="awsui-value-large">{systemStatus.system_info.active_sessions}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Tổng requests</Box>
              <Box variant="awsui-value-large">{systemStatus.system_info.processing_stats.total_requests}</Box>
            </div>
          </ColumnLayout>
        )}

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'chat',
              label: 'AI Chat Interface',
              content: (
                <SpaceBetween size="l">
                  {/* Chat Messages Area */}
                  <Container>
                    <div style={{ 
                      height: '500px', 
                      overflowY: 'auto', 
                      padding: '16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: '#fafafa'
                    }}>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          style={{
                            marginBottom: '16px',
                            padding: '12px',
                            borderRadius: '8px',
                            backgroundColor: getMessageTypeColor(message.type),
                            border: '1px solid #e0e0e0'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Badge color={
                                message.type === 'user' ? 'blue' :
                                message.type === 'assistant' ? 'green' : 'grey'
                              }>
                                {message.type === 'user' ? '👤 Bạn' :
                                 message.type === 'assistant' ? '🤖 AI Assistant' : '🔧 Hệ thống'}
                              </Badge>
                              {message.agent_used && (
                                <Badge color={getAgentBadgeColor(message.agent_used)}>
                                  {message.agent_used}
                                </Badge>
                              )}
                              {message.processing_time && (
                                <Badge color="grey">
                                  {message.processing_time.toFixed(2)}s
                                </Badge>
                              )}
                            </div>
                            <span style={{ fontSize: '0.85em', color: '#666' }}>
                              {message.timestamp.toLocaleTimeString('vi-VN')}
                            </span>
                          </div>
                          
                          {message.file_info && (
                            <div style={{ 
                              marginBottom: '8px', 
                              padding: '8px', 
                              backgroundColor: 'rgba(0,0,0,0.05)', 
                              borderRadius: '4px',
                              fontSize: '0.9em'
                            }}>
                              📎 <strong>{message.file_info.filename}</strong> 
                              ({(message.file_info.size / 1024).toFixed(1)} KB)
                            </div>
                          )}
                          
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {message.content}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </Container>

                  {/* Input Area */}
                  <Container>
                    <Form
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            variant="primary"
                            loading={loading}
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim() && !uploadedFile}
                          >
                            Gửi
                          </Button>
                          <Button
                            onClick={() => {
                              setCurrentMessage('');
                              setUploadedFile(null);
                            }}
                          >
                            Xóa
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      <SpaceBetween size="m">
                        <FormField label="Tin nhắn">
                          <Textarea
                            value={currentMessage}
                            onChange={({ detail }) => setCurrentMessage(detail.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Nhập câu hỏi hoặc yêu cầu của bạn... (Nhấn Enter để gửi, Shift+Enter để xuống dòng)"
                            rows={3}
                          />
                        </FormField>

                        <FormField label="File đính kèm (tùy chọn)">
                          <FileUpload
                            onChange={({ detail }) => setUploadedFile(detail.value[0] || null)}
                            value={uploadedFile ? [uploadedFile] : []}
                            i18nStrings={{
                              uploadButtonText: e => e ? "Chọn file khác" : "Chọn file",
                              dropzoneText: e => e ? "Thả file để thay thế" : "Thả file để upload",
                              removeFileAriaLabel: e => `Xóa file ${e + 1}`,
                              limitShowFewer: "Hiện ít hơn",
                              limitShowMore: "Hiện nhiều hơn",
                              errorIconAriaLabel: "Lỗi"
                            }}
                            accept=".pdf,.docx,.txt,.doc"
                            showFileLastModified
                            showFileSize
                            constraintText="Hỗ trợ: PDF, DOCX, TXT, DOC (tối đa 10MB)"
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Container>
                </SpaceBetween>
              )
            },
            {
              id: 'examples',
              label: 'Ví dụ sử dụng',
              content: (
                <SpaceBetween size="l">
                  <Container header={<Header variant="h2">Các tính năng chính</Header>}>
                    <Cards
                      cardDefinition={{
                        header: (item: any) => item.title,
                        sections: [
                          {
                            id: 'description',
                            content: (item: any) => item.description
                          },
                          {
                            id: 'example',
                            header: 'Ví dụ',
                            content: (item: any) => (
                              <Box variant="code">
                                {item.example}
                              </Box>
                            )
                          },
                          {
                            id: 'action',
                            content: (item: any) => (
                              <Button
                                onClick={() => {
                                  setCurrentMessage(item.example);
                                  setActiveTab('chat');
                                }}
                              >
                                Thử ngay
                              </Button>
                            )
                          }
                        ]
                      }}
                      cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
                      items={[
                        {
                          title: '📄 Tóm tắt tài liệu',
                          description: 'Upload file PDF, DOCX hoặc TXT để AI tóm tắt nội dung chính',
                          example: 'Tóm tắt file này giúp tôi'
                        },
                        {
                          title: '⚖️ Tra cứu quy định',
                          description: 'Hỏi về các quy định ngân hàng như UCP 600, SBV, Basel III',
                          example: 'UCP 600 là gì? Các điều khoản chính?'
                        },
                        {
                          title: '📊 Phân tích rủi ro',
                          description: 'Phân tích rủi ro tín dụng cho doanh nghiệp hoặc cá nhân',
                          example: 'Phân tích rủi ro tín dụng cho công ty ABC với doanh thu 10 tỷ'
                        },
                        {
                          title: '💳 Xử lý Letter of Credit',
                          description: 'Kiểm tra và xử lý các tài liệu Letter of Credit',
                          example: 'Kiểm tra tính hợp lệ của L/C số LC-2024-001'
                        },
                        {
                          title: '🔍 Tìm kiếm thông tin',
                          description: 'Tìm kiếm thông tin trong cơ sở tri thức ngân hàng',
                          example: 'Tìm thông tin về quy trình mở tài khoản doanh nghiệp'
                        },
                        {
                          title: '💬 Hỗ trợ tổng quát',
                          description: 'Trả lời các câu hỏi chung về ngân hàng và tài chính',
                          example: 'Giải thích về lãi suất và các loại lãi suất trong ngân hàng'
                        }
                      ]}
                    />
                  </Container>

                  {systemStatus && (
                    <Container header={<Header variant="h2">Thông tin hệ thống</Header>}>
                      <KeyValuePairs
                        columns={2}
                        items={[
                          {
                            label: 'Hệ thống',
                            value: systemStatus.system_info.system
                          },
                          {
                            label: 'Supervisor Status',
                            value: (
                              <StatusIndicator type={systemStatus.system_info.supervisor_status === 'active' ? 'success' : 'error'}>
                                {systemStatus.system_info.supervisor_status}
                              </StatusIndicator>
                            )
                          },
                          {
                            label: 'Available Agents',
                            value: (
                              <SpaceBetween direction="horizontal" size="xs">
                                {systemStatus.system_info.available_agents.map(agent => (
                                  <Badge key={agent} color="blue">
                                    {agent.replace('_agent', '').replace('_', ' ')}
                                  </Badge>
                                ))}
                              </SpaceBetween>
                            )
                          },
                          {
                            label: 'Node Integration',
                            value: Object.keys(systemStatus.system_info.node_integration).length + ' integrations'
                          }
                        ]}
                      />
                    </Container>
                  )}
                </SpaceBetween>
              )
            }
          ]}
        />

        {/* System Statistics Modal */}
        <Modal
          onDismiss={() => setStatsModalVisible(false)}
          visible={statsModalVisible}
          closeAriaLabel="Close modal"
          size="large"
          footer={
            <Box float="right">
              <Button onClick={() => setStatsModalVisible(false)}>
                Đóng
              </Button>
            </Box>
          }
          header="Thống kê hệ thống Pure Strands"
        >
          {systemStatus && (
            <SpaceBetween size="l">
              <ColumnLayout columns={3} variant="text-grid">
                <div>
                  <Box variant="awsui-key-label">Tổng requests</Box>
                  <Box variant="awsui-value-large">{systemStatus.system_info.processing_stats.total_requests}</Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Thành công</Box>
                  <Box variant="awsui-value-large" color="text-status-success">
                    {systemStatus.system_info.processing_stats.successful_responses}
                  </Box>
                </div>
                <div>
                  <Box variant="awsui-key-label">Lỗi</Box>
                  <Box variant="awsui-value-large" color="text-status-error">
                    {systemStatus.system_info.processing_stats.errors}
                  </Box>
                </div>
              </ColumnLayout>

              <ColumnLayout columns={2}>
                <Container header={<Header variant="h3">Sử dụng Agents</Header>}>
                  {agentUsageData.length > 0 && (
                    <BarChart
                      series={[
                        {
                          title: "Số lần sử dụng",
                          type: "bar",
                          data: agentUsageData
                        }
                      ]}
                      xTitle="Agents"
                      yTitle="Số lần sử dụng"
                      ariaLabel="Agent usage chart"
                      errorText="Error loading data."
                      loadingText="Loading chart"
                      recoveryText="Retry"
                    />
                  )}
                </Container>

                <Container header={<Header variant="h3">Node Integration</Header>}>
                  <KeyValuePairs
                    columns={1}
                    items={Object.entries(systemStatus.system_info.node_integration).map(([agent, integration]) => ({
                      label: agent.replace('_agent', ''),
                      value: integration
                    }))}
                  />
                </Container>
              </ColumnLayout>

              <Container header={<Header variant="h3">Endpoints</Header>}>
                <KeyValuePairs
                  columns={1}
                  items={Object.entries(systemStatus.endpoints).map(([endpoint, description]) => ({
                    label: endpoint,
                    value: description
                  }))}
                />
              </Container>
            </SpaceBetween>
          )}
        </Modal>
      </SpaceBetween>
    </Container>
  );
};

export default PureStrandsInterface;
