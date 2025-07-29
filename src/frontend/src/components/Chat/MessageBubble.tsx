import React from 'react';
import { SpaceBetween, Badge, TextContent } from '@cloudscape-design/components';
import { Message, Agent } from '../../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  message: Message;
  agent: Agent;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, agent }) => {
  const isUser = message.sender === 'user';
  const isCode = message.content.includes('```');

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div
      style={{
        padding: '12px',
        marginLeft: isUser ? '20%' : '0',
        marginRight: isUser ? '0' : '20%',
        backgroundColor: isUser ? '#e3f2fd' : '#f5f5f5',
        borderRadius: '12px',
        border: '1px solid #e9ebed',
        marginBottom: '8px'
      }}
    >
      <SpaceBetween direction="vertical" size="xs">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge color={isUser ? 'blue' : 'green'}>
              {isUser ? 'You' : agent.name}
            </Badge>
            {!isUser && (
              <span style={{ fontSize: '12px', color: '#5f6b7a' }}>
                AI Assistant
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: '#5f6b7a' }}>
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* Content */}
        {isCode ? (
          <TextContent>
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  if (isInline) {
                    return (
                      <code 
                        className={className} 
                        style={{
                          backgroundColor: '#f1f3f4',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontSize: '0.9em'
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                },
                p: ({ children }) => (
                  <p style={{ margin: '0 0 8px 0' }}>{children}</p>
                ),
                ul: ({ children }) => (
                  <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>{children}</ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote style={{
                    borderLeft: '4px solid #e9ebed',
                    paddingLeft: '12px',
                    margin: '8px 0',
                    fontStyle: 'italic',
                    color: '#5f6b7a'
                  }}>
                    {children}
                  </blockquote>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </TextContent>
        ) : (
          <TextContent>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              lineHeight: '1.5'
            }}>
              {message.content}
            </div>
          </TextContent>
        )}
      </SpaceBetween>
    </div>
  );
};

export default MessageBubble;
