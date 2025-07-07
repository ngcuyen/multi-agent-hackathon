import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Header,
  Input,
  Button,
  SpaceBetween,
  Box,
  Icon
} from '@cloudscape-design/components';

import { sendChatMessage, generateUUID } from '../services/api';

const ChatInterface = ({ onNotification }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Xin chào! Tôi có thể giúp bạn tóm tắt văn bản, trả lời câu hỏi hoặc phân tích tài liệu. Bạn cần hỗ trợ gì?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState(generateUUID());
  const [userId] = useState('user-' + Date.now());
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
      content: inputMessage,
      timestamp: new Date()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const messageData = {
        message: inputMessage,
        conversation_id: conversationId,
        user_id: userId
      };

      const response = await sendChatMessage(messageData);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.data && data.data.type === 'ai') {
                aiMessage = data.data.message;
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      if (aiMessage) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: aiMessage,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      onNotification({
        type: 'error',
        content: 'Lỗi kết nối chat AI!',
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

  // Format message content
  const formatMessageContent = (content) => {
    let formatted = content;
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/# (.*)/g, '<h4 style="margin: 8px 0; color: #0073bb;">$1</h4>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  };

  return (
    <SpaceBetween direction="vertical" size="l">
      <Header
        variant="h1"
        description="Trò chuyện với AI Assistant sử dụng Claude 3.7 Sonnet"
      >
        Trò chuyện AI
      </Header>

      <Container>
        <div className="chat-container">
          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.type}`}
              >
                {message.type === 'ai' && (
                  <Box display="inline-block" marginRight="xs">
                    <Icon name="robot" />
                  </Box>
                )}
                <strong>
                  {message.type === 'user' ? 'Bạn:' : 'AI Assistant:'}
                </strong>
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatMessageContent(message.content)
                  }}
                />
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-message ai">
                <Box display="inline-block" marginRight="xs">
                  <Icon name="robot" />
                </Box>
                <strong>AI Assistant:</strong>
                <span className="typing-indicator"></span>
                <span className="typing-indicator"></span>
                <span className="typing-indicator"></span>
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
                placeholder="Nhập tin nhắn của bạn..."
                disabled={isTyping}
              />
            </Box>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              iconName="send"
            >
              Gửi
            </Button>
          </SpaceBetween>
        </div>
      </Container>
    </SpaceBetween>
  );
};

export default ChatInterface;
