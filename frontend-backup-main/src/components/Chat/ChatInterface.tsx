import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Header,
  Input,
  Button,
  SpaceBetween,
  Badge,
  Spinner,
  TextContent,
  ColumnLayout
} from '@cloudscape-design/components';
import { Message, Agent, ChatSession, ConversationRequest } from '../../types';
import { chatAPI } from '../../services/api';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatInterfaceProps {
  agent: Agent;
  session?: ChatSession | null;
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
  onSessionUpdate?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  agent,
  session,
  onShowSnackbar,
  onSessionUpdate,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(session?.id || null);
  const [userId] = useState('user-' + Date.now()); // Generate user ID
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session?.id) {
      setCurrentConversationId(session.id);
      // In real implementation, load messages from backend
      setMessages([]);
    } else {
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [session]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      agentId: agent.id,
      conversationId: currentConversationId || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const request: ConversationRequest = {
        user_id: userId,
        message: messageToSend,
        conversation_id: currentConversationId || undefined,
      };

      const response = await chatAPI.sendMessage(request);

      if (response.status === 'success' && response.data) {
        // If response.data is a ConversationResponse, create a Message object
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.data.response || '',
          sender: 'bot',
          timestamp: new Date(),
          agentId: agent.id,
          conversationId: response.data.conversation_id,
          type: 'ai',
        };
        setMessages([...messages, aiMessage]);
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      onShowSnackbar('Không thể gửi tin nhắn. Vui lòng thử lại.', 'error');
      
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        {/* Chat Header */}
        <Box>
          <Header
            variant="h2"
            description={agent.description}
            info={
              <Badge color={agent.status === 'active' ? 'green' : 'grey'}>
                {agent.status}
              </Badge>
            }
          >
            {agent.name}
          </Header>
        </Box>

        {/* Messages Container */}
        <div 
          style={{ 
            height: '500px', 
            overflowY: 'auto', 
            border: '1px solid #e9ebed', 
            borderRadius: '8px',
            backgroundColor: '#fafbfc',
            padding: '12px'
          }}
        >
          {isLoading && messages.length === 0 ? (
            <Box textAlign="center" padding="l">
              <Spinner size="large" />
              <TextContent>
                <p>Loading chat history...</p>
              </TextContent>
            </Box>
          ) : (
            <SpaceBetween direction="vertical" size="s">
              {messages.length === 0 ? (
                <Box textAlign="center" padding="l">
                  <TextContent>
                    <p>Start a conversation with {agent.name}!</p>
                    <p style={{ fontSize: '14px', color: '#5f6b7a' }}>
                      {agent.description}
                    </p>
                  </TextContent>
                </Box>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} agent={agent} />
                ))
              )}
              
              {isTyping && <TypingIndicator agent={agent} />}
              <div ref={messagesEndRef} />
            </SpaceBetween>
          )}
        </div>

        {/* Input Area */}
        <Box>
          <SpaceBetween direction="horizontal" size="s">
            <div style={{ flex: 1 }}>
              <Input
                value={inputMessage}
                onChange={({ detail }) => setInputMessage(detail.value)}
                onKeyDown={(event) => {
                  if (event.detail.key === 'Enter' && !event.detail.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Message ${agent.name}...`}
                disabled={isLoading}
              />
            </div>
            <Button
              variant="primary"
              iconName="send"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              loading={isLoading}
            >
              Send
            </Button>
          </SpaceBetween>
        </Box>

        {/* Agent Info */}
        <Box>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Model</Box>
              <div>{agent.model || 'Claude 3.7 Sonnet'}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Temperature</Box>
              <div>{agent.temperature || '0.7'}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Max Tokens</Box>
              <div>{agent.maxTokens || '8192'}</div>
            </div>
          </ColumnLayout>
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default ChatInterface;
