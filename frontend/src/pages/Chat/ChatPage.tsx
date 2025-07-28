import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Textarea,
  Alert,
  Badge,
  StatusIndicator,
  ColumnLayout,
  Cards,
  FileUpload,
  FormField,
  ExpandableSection,
  TextContent,
  Spinner
} from '@cloudscape-design/components';
import { Agent, ChatSession } from '../../types';

interface ChatPageProps {
  agents: Agent[];
  loading: boolean;
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent_used?: string;
  file_info?: any;
  processing_time?: number;
}

const ChatPage: React.FC<ChatPageProps> = ({ agents, loading, onShowSnackbar }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState('default_session');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'system',
      content: `Welcome to VPBank K-MULT Agent Studio AI Assistant!

I'm an intelligent multi-agent AI system, ready to assist you with:

Pure Strands Multi-Agent System:
- Intelligent routing based on message content
- Simultaneous file and text processing
- Deep Vietnamese NLP integration

Key Features:
- Document summarization (PDF, DOCX, TXT, images)
- Risk analysis and credit assessment
- Banking compliance validation
- Information extraction from documents

How to Use:
- Send direct messages or attach files
- Use keywords like "summarize", "analyze", "check"
- The system will automatically select the appropriate agent

Start by sending a message or uploading a file!`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        onShowSnackbar('File too large. Maximum 50MB allowed.', 'error');
        return;
      }

      setSelectedFile(file);
      onShowSnackbar(`File selected: ${file.name}`, 'success');
    }
  }, [onShowSnackbar]);

  // Send message to Pure Strands API
  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) {
      onShowSnackbar('Please enter a message or select a file.', 'warning');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: selectedFile 
        ? `${inputMessage}\nAttached file: ${selectedFile.name}`
        : inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('message', inputMessage);
      formData.append('conversation_id', conversationId);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/pure-strands/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.response,
        timestamp: new Date(),
        agent_used: result.agent_used,
        file_info: result.file_info,
        processing_time: result.processing_time
      };

      setMessages(prev => [...prev, assistantMessage]);
      onShowSnackbar('Response received successfully!', 'success');

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, an error occurred while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      onShowSnackbar('An error occurred while sending the message.', 'error');
    } finally {
      setIsProcessing(false);
      setInputMessage('');
      setSelectedFile(null);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setConversationId(`session_${Date.now()}`);
    onShowSnackbar('Conversation cleared.', 'info');
  };

  // Render message
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    return (
      <Box
        key={message.id}
        padding="m"
        margin={{ bottom: 's' }}
        color={isSystem ? 'text-status-info' : undefined}
      >
        <div style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: '8px'
        }}>
          <div style={{
            maxWidth: '80%',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: isUser ? '#0073bb' : isSystem ? '#f8f9fa' : '#e8f4f8',
            color: isUser ? 'white' : '#16191f',
            border: isSystem ? '1px solid #d1d5db' : 'none'
          }}>
            {/* Message Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              fontSize: '12px',
              opacity: 0.8
            }}>
              <span>
                {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
              </span>
              <span style={{ marginLeft: '8px' }}>
                {message.timestamp.toLocaleTimeString()}
              </span>
              {message.agent_used && (
                <Badge color="blue" style={{ marginLeft: '8px' }}>
                  {message.agent_used}
                </Badge>
              )}
            </div>

            {/* Message Content */}
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {message.content}
            </div>

            {/* Message Metadata */}
            {message.processing_time && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '11px', 
                opacity: 0.7 
              }}>
                Processing time: {message.processing_time}s
              </div>
            )}

            {message.file_info && message.file_info !== 'No file' && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '11px', 
                opacity: 0.7 
              }}>
                File: {message.file_info}
              </div>
            )}
          </div>
        </div>
      </Box>
    );
  };

  return (
    <SpaceBetween size="l">
      {/* Header */}
      <Container>
        <Header
          variant="h1"
          description="Interact with our intelligent multi-agent AI system"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="normal"
                onClick={clearConversation}
                disabled={isProcessing}
              >
                Clear Conversation
              </Button>
              <StatusIndicator type={isProcessing ? "loading" : "success"}>
                {isProcessing ? "Processing..." : "Ready"}
              </StatusIndicator>
            </SpaceBetween>
          }
        >
          AI Assistant
        </Header>

        <Alert
          statusIconAriaLabel="Info"
          type="info"
          header="Pure Strands Multi-Agent System"
        >
          The system will automatically select the appropriate AI agent based on your message content. 
          You can send messages with attached files for better assistance.
        </Alert>
      </Container>

      {/* Chat Interface */}
      <Container>
        <SpaceBetween size="l">
          {/* Messages Area */}
          <div style={{
            height: '500px',
            overflowY: 'auto',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa'
          }}>
            {messages.map(renderMessage)}
            {isProcessing && (
              <Box padding="m" textAlign="center">
                <Spinner size="normal" />
                <Box variant="p" color="text-status-subdued">
                  AI is thinking and processing...
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <SpaceBetween size="m">
            {/* File Upload */}
            <FormField
              label="Attach File (Optional)"
              description="Supports PDF, DOCX, TXT, JPG, PNG - max 50MB"
            >
              <FileUpload
                onChange={({ detail }) => handleFileUpload(detail.value)}
                value={selectedFile ? [selectedFile] : []}
                i18nStrings={{
                  uploadButtonText: e => e ? "Choose different file" : "Choose file",
                  dropzoneText: e => e ? "Drop file to replace" : "Drop file here",
                  removeFileAriaLabel: e => `Remove file ${e + 1}`,
                  limitShowFewer: "Show fewer",
                  limitShowMore: "Show more",
                  errorIconAriaLabel: "Error"
                }}
                showFileLastModified
                showFileSize
                tokenLimit={1}
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.tiff"
              />
            </FormField>

            {/* Message Input */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Textarea
                  onChange={({ detail }) => setInputMessage(detail.value)}
                  value={inputMessage}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  rows={3}
                  onKeyDown={handleKeyPress}
                  disabled={isProcessing}
                />
              </div>
              <Button
                variant="primary"
                onClick={sendMessage}
                disabled={isProcessing || (!inputMessage.trim() && !selectedFile)}
                loading={isProcessing}
              >
                Send Message
              </Button>
            </div>
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      {/* Quick Actions */}
      <Container
        header={
          <Header
            variant="h2"
            description="Common questions and requests"
          >
            Usage Examples
          </Header>
        }
      >
        <ExpandableSection headerText="Example Messages" defaultExpanded>
          <Cards
            ariaLabels={{
              itemSelectionLabel: (e, t) => `select ${t.title}`,
              selectionGroupLabel: "Example selection"
            }}
            cardDefinition={{
              header: item => item.title,
              sections: [
                {
                  id: "example",
                  content: item => (
                    <Box>
                      <TextContent>
                        <p><strong>Example:</strong> "{item.example}"</p>
                        <p><em>{item.description}</em></p>
                      </TextContent>
                      <Button
                        variant="inline-link"
                        onClick={() => setInputMessage(item.example)}
                      >
                        Use this example
                      </Button>
                    </Box>
                  )
                }
              ]
            }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 }
            ]}
            items={[
              {
                title: "Document Summarization",
                example: "Please summarize this document for me",
                description: "Upload a file and request summarization"
              },
              {
                title: "Risk Analysis",
                example: "Analyze the financial risk of this company",
                description: "Risk assessment from financial documents"
              },
              {
                title: "Compliance Check",
                example: "Check if this document complies with regulations",
                description: "Validate compliance with banking standards"
              },
              {
                title: "Information Extraction",
                example: "Extract key information from this document",
                description: "Get important details from files"
              }
            ]}
          />
        </ExpandableSection>
      </Container>
    </SpaceBetween>
  );
};

export default ChatPage;
