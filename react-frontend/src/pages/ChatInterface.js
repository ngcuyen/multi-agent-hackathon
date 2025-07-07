import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Header,
  Input,
  Button,
  SpaceBetween,
  Box,
  Icon,
  Alert,
  Badge,
  KeyValuePairs
} from '@cloudscape-design/components';

import { sendChatMessage, generateUUID, handleApiError } from '../services/api';

const ChatInterface = ({ onNotification }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Xin chào! Tôi là AI Assistant sử dụng Claude 3.7 Sonnet. Tôi có thể giúp bạn:\n\n• **Tóm tắt văn bản** - Phân tích và tóm tắt nội dung\n• **Trả lời câu hỏi** - Giải đáp thắc mắc của bạn\n• **Phân tích tài liệu** - Xử lý và phân tích thông tin\n• **Hỗ trợ nghiên cứu** - Tìm kiếm và tổng hợp thông tin\n\nBạn cần hỗ trợ gì hôm nay?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState(generateUUID());
  const [userId] = useState('user-' + Date.now());
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [messageCount, setMessageCount] = useState(1);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setConnectionStatus('sending');
    setMessageCount(prev => prev + 1);

    try {
      const messageData = {
        message: inputMessage.trim(),
        conversation_id: conversationId,
        user_id: userId
      };

      console.log('💬 Sending chat message to conversation:', conversationId);

      const response = await sendChatMessage(messageData);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setConnectionStatus('receiving');

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = '';
      let chunks = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          chunks.push(chunk);
          
          // Split by lines to handle multiple data chunks
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr) {
                  const data = JSON.parse(jsonStr);
                  console.log('📨 Received streaming data:', data);
                  
                  if (data.status === 'success' && data.data) {
                    if (data.data.type === 'ai' && data.data.message) {
                      aiMessage = data.data.message;
                    } else if (data.data.type === 'human') {
                      // Echo of user message, can be ignored
                      console.log('👤 User message echo received');
                    }
                  }
                }
              } catch (parseError) {
                console.log('⚠️ Could not parse JSON chunk:', line.slice(6));
                // Continue processing other lines
              }
            }
          }
        }
      } catch (streamError) {
        console.error('❌ Stream reading error:', streamError);
        throw streamError;
      }

      // Add AI response if we got one
      if (aiMessage && aiMessage.trim()) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: aiMessage.trim(),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        setMessageCount(prev => prev + 1);
        setConnectionStatus('connected');
      } else {
        // If no AI message received, show a fallback
        const fallbackMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: 'Xin lỗi, tôi không nhận được phản hồi từ hệ thống AI. Vui lòng thử lại.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMessage]);
        setConnectionStatus('error');
      }

    } catch (error) {
      console.error('❌ Chat error:', error);
      setConnectionStatus('error');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `❌ **Lỗi kết nối**: ${handleApiError(error)}\n\nVui lòng kiểm tra:\n• Kết nối mạng\n• Trạng thái backend server\n• Thử lại sau vài giây`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      
      onNotification({
        type: 'error',
        content: `Lỗi chat AI: ${handleApiError(error)}`,
        dismissible: true
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Clear conversation
  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'ai',
        content: 'Cuộc trò chuyện đã được xóa. Tôi sẵn sàng hỗ trợ bạn!',
        timestamp: new Date()
      }
    ]);
    setMessageCount(1);
    setConnectionStatus('connected');
  };

  // Format message content with better HTML rendering
  const formatMessageContent = (content) => {
    let formatted = content;
    
    // Handle headers
    formatted = formatted.replace(/^### (.*$)/gm, '<h4 style="margin: 12px 0 6px 0; color: #0073bb; font-size: 1.1em;">$1</h4>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h3 style="margin: 16px 0 8px 0; color: #0073bb; font-size: 1.3em;">$1</h3>');
    formatted = formatted.replace(/^# (.*$)/gm, '<h2 style="margin: 20px 0 12px 0; color: #0073bb; font-size: 1.5em;">$1</h2>');
    
    // Handle bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
    
    // Handle bullet points
    formatted = formatted.replace(/^• (.*$)/gm, '<li style="margin: 4px 0; list-style-type: disc; margin-left: 20px;">$1</li>');
    formatted = formatted.replace(/^\* (.*$)/gm, '<li style="margin: 4px 0; list-style-type: disc; margin-left: 20px;">$1</li>');
    
    // Handle numbered lists
    formatted = formatted.replace(/^(\d+)\. (.*$)/gm, '<li style="margin: 4px 0; list-style-type: decimal; margin-left: 20px;">$2</li>');
    
    // Handle code blocks
    formatted = formatted.replace(/```(.*?)```/gs, '<pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin: 8px 0; overflow-x: auto;"><code>$1</code></pre>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
    
    // Handle line breaks
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  // Get connection status badge
  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge color="green">Đã kết nối</Badge>;
      case 'sending':
        return <Badge color="blue">Đang gửi...</Badge>;
      case 'receiving':
        return <Badge color="blue">Đang nhận phản hồi...</Badge>;
      case 'error':
        return <Badge color="red">Lỗi kết nối</Badge>;
      default:
        return <Badge color="grey">Không xác định</Badge>;
    }
  };

  return (
    <SpaceBetween direction="vertical" size="l">
      <Header
        variant="h1"
        description="Trò chuyện với AI Assistant sử dụng Claude 3.7 Sonnet - Hỗ trợ tóm tắt, phân tích và trả lời câu hỏi"
        actions={
          <SpaceBetween direction="horizontal" size="s">
            {getConnectionBadge()}
            <Button
              variant="normal"
              onClick={handleClearChat}
              disabled={isTyping}
              iconName="refresh"
            >
              Xóa cuộc trò chuyện
            </Button>
          </SpaceBetween>
        }
      >
        Trò chuyện AI
      </Header>

      {/* Chat Info */}
      <Alert
        type="info"
        header="Thông tin cuộc trò chuyện"
      >
        <KeyValuePairs
          columns={3}
          items={[
            {
              label: 'ID Cuộc trò chuyện',
              value: conversationId.split('-')[0] + '...'
            },
            {
              label: 'Số tin nhắn',
              value: messageCount.toString()
            },
            {
              label: 'Model AI',
              value: 'Claude 3.7 Sonnet'
            }
          ]}
        />
      </Alert>

      <Container>
        <div className="chat-container">
          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.type} ${message.isError ? 'error' : ''}`}
              >
                <Box display="flex" alignItems="flex-start">
                  {message.type === 'ai' && (
                    <Box marginRight="s" marginTop="xs">
                      <Icon name={message.isError ? "status-negative" : "robot"} />
                    </Box>
                  )}
                  {message.type === 'user' && (
                    <Box marginRight="s" marginTop="xs">
                      <Icon name="user-profile" />
                    </Box>
                  )}
                  <Box flex="1">
                    <Box marginBottom="xs">
                      <strong>
                        {message.type === 'user' ? 'Bạn' : 'AI Assistant'}
                      </strong>
                      <Box 
                        display="inline" 
                        marginLeft="s" 
                        variant="small" 
                        color="text-body-secondary"
                      >
                        {message.timestamp.toLocaleTimeString('vi-VN')}
                      </Box>
                    </Box>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatMessageContent(message.content)
                      }}
                      style={{ lineHeight: '1.5' }}
                    />
                  </Box>
                </Box>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-message ai">
                <Box display="flex" alignItems="flex-start">
                  <Box marginRight="s" marginTop="xs">
                    <Icon name="robot" />
                  </Box>
                  <Box flex="1">
                    <Box marginBottom="xs">
                      <strong>AI Assistant</strong>
                      <Box 
                        display="inline" 
                        marginLeft="s" 
                        variant="small" 
                        color="text-body-secondary"
                      >
                        đang trả lời...
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <span className="typing-indicator"></span>
                      <span className="typing-indicator"></span>
                      <span className="typing-indicator"></span>
                      <Box marginLeft="s" variant="small" color="text-body-secondary">
                        AI đang suy nghĩ...
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <SpaceBetween direction="horizontal" size="s">
            <Box flex="1">
              <Input
                value={inputMessage}
                onChange={({ detail }) => setInputMessage(detail.value)}
                onKeyDown={handleKeyPress}
                placeholder={isTyping ? "Đang chờ phản hồi..." : "Nhập tin nhắn của bạn... (Enter để gửi)"}
                disabled={isTyping}
              />
            </Box>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              loading={isTyping}
              iconName="send"
            >
              {isTyping ? 'Đang gửi...' : 'Gửi'}
            </Button>
          </SpaceBetween>

          {/* Usage Tips */}
          <Box variant="small" color="text-body-secondary" textAlign="center" marginTop="s">
            💡 <strong>Mẹo sử dụng:</strong> Bạn có thể hỏi về tóm tắt văn bản, phân tích tài liệu, 
            hoặc bất kỳ câu hỏi nào. AI sẽ trả lời dựa trên kiến thức được huấn luyện.
          </Box>
        </div>
      </Container>
    </SpaceBetween>
  );
};

export default ChatInterface;
