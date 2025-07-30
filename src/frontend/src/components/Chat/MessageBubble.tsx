import React from 'react';
import { SpaceBetween, Badge, TextContent } from '@cloudscape-design/components';
import { Message, Agent } from '../../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ComplianceResult from './ComplianceResult';
import AgentResult from './AgentResult';

interface MessageBubbleProps {
  message: Message;
  agent: Agent;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, agent }) => {
  const isUser = message.sender === 'user';

  // Debug logging for ALL messages - this should ALWAYS run
  console.log('🚨 MessageBubble ENTRY:', {
    messageId: message.id,
    isUser,
    agentName: agent.name,
    contentType: typeof message.content,
    contentLength: message.content.length,
    contentStart: message.content.substring(0, 100),
    sender: message.sender,
    timestamp: message.timestamp
  });

  // Try to detect if this looks like compliance data
  const looksLikeCompliance = message.content.includes('compliance_status') && 
                              message.content.includes('document_type');
  
  console.log('🔍 Quick Compliance Check:', {
    looksLikeCompliance,
    hasComplianceStatus: message.content.includes('compliance_status'),
    hasDocumentType: message.content.includes('document_type'),
    hasViolations: message.content.includes('violations')
  });

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Check if message contains compliance data
  const isComplianceResponse = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      
      // More detailed debug logging
      console.log('🔍 Detailed Compliance Check:', {
        contentPreview: content.substring(0, 200) + '...',
        parsedKeys: Object.keys(parsed),
        hasStatus: parsed.status === 'success',
        hasData: !!parsed.data,
        dataKeys: parsed.data ? Object.keys(parsed.data) : null,
        hasComplianceStatus: !!parsed.data?.compliance_status,
        complianceStatusValue: parsed.data?.compliance_status,
        hasDocumentType: !!parsed.data?.document_type,
        documentTypeValue: parsed.data?.document_type
      });
      
      const result = parsed.status === 'success' && 
             parsed.data && 
             parsed.data.compliance_status && 
             parsed.data.document_type;
      
      console.log('🔍 Compliance Result:', result);
      
      return result;
    } catch (error) {
      console.log('❌ JSON Parse Error:', error);
      return false;
    }
  };

  // Check if message contains structured agent response
  const isStructuredAgentResponse = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return parsed.status === 'success' && 
             parsed.data && 
             typeof parsed.data === 'object' &&
             !parsed.data.compliance_status; // Not a compliance response
    } catch {
      return false;
    }
  };

  // Parse compliance data from message
  const parseComplianceData = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.status === 'success' && parsed.data) {
        return {
          data: parsed.data,
          message: parsed.message || 'Kiểm tra tuân thủ hoàn tất'
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  // Parse structured agent data from message
  const parseAgentData = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.status === 'success' && parsed.data) {
        return {
          data: parsed.data,
          message: parsed.message || 'Xử lý hoàn tất',
          agentType: parsed.agent_type || 'unknown'
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  // Determine agent type from agent name or message content
  const getAgentType = (agentName: string, content: string) => {
    const name = agentName.toLowerCase();
    if (name.includes('compliance')) return 'compliance';
    if (name.includes('credit')) return 'credit_analysis';
    if (name.includes('risk')) return 'risk_assessment';
    if (name.includes('lc') || name.includes('letter')) return 'lc_processing';
    if (name.includes('document')) return 'document_intelligence';
    if (name.includes('decision')) return 'decision_synthesis';
    if (name.includes('supervisor')) return 'supervisor';
    
    // Try to infer from content
    if (content.includes('compliance_status')) return 'compliance';
    if (content.includes('credit_score')) return 'credit_analysis';
    if (content.includes('risk_score')) return 'risk_assessment';
    
    return 'unknown';
  };

  // PRIORITY 1: If this is a compliance response, render the compliance component
  if (!isUser && isComplianceResponse(message.content)) {
    const complianceData = parseComplianceData(message.content);
    if (complianceData) {
      return (
        <div
          style={{
            padding: '12px',
            marginRight: '20%',
            backgroundColor: '#f5f5f5',
            borderRadius: '12px',
            border: '1px solid #e9ebed',
            marginBottom: '8px'
          }}
        >
          <SpaceBetween direction="vertical" size="xs">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge color="green">
                  {agent.name}
                </Badge>
                <span style={{ fontSize: '12px', color: '#5f6b7a' }}>
                  🔍 Compliance Agent
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#5f6b7a' }}>
                {formatTimestamp(message.timestamp)}
              </span>
            </div>

            {/* Compliance Result Component */}
            <ComplianceResult 
              data={complianceData.data} 
              message={complianceData.message} 
            />
          </SpaceBetween>
        </div>
      );
    }
  }

  // PRIORITY 2: If this is a structured agent response, render the agent result component
  if (!isUser && isStructuredAgentResponse(message.content)) {
    const agentData = parseAgentData(message.content);
    if (agentData) {
      const agentType = getAgentType(agent.name, message.content);
      
      return (
        <div
          style={{
            padding: '12px',
            marginRight: '20%',
            backgroundColor: '#f5f5f5',
            borderRadius: '12px',
            border: '1px solid #e9ebed',
            marginBottom: '8px'
          }}
        >
          <SpaceBetween direction="vertical" size="xs">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge color="green">
                  {agent.name}
                </Badge>
                <span style={{ fontSize: '12px', color: '#5f6b7a' }}>
                  🤖 AI Agent
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#5f6b7a' }}>
                {formatTimestamp(message.timestamp)}
              </span>
            </div>

            {/* Agent Result Component */}
            <AgentResult 
              data={agentData.data} 
              message={agentData.message}
              agentType={agentType}
            />
          </SpaceBetween>
        </div>
      );
    }
  }

  // PRIORITY 3: Default message rendering (text, markdown, code)
  const isCode = message.content.includes('```');
  
  // Regular message rendering
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
