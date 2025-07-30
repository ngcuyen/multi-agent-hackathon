import React, { useState } from 'react';
import { 
  SpaceBetween, 
  Badge, 
  Button, 
  ExpandableSection, 
  Box, 
  Container,
  Header,
  KeyValuePairs,
  Tiles,
  TextContent,
  StatusIndicator
} from '@cloudscape-design/components';

interface AgentResultData {
  [key: string]: any;
}

interface AgentResultProps {
  data: AgentResultData;
  message: string;
  agentType: string;
}

const AgentResult: React.FC<AgentResultProps> = ({ data, message, agentType }) => {
  const [expanded, setExpanded] = useState(false);

  const getAgentInfo = (type: string) => {
    const agentMap: { [key: string]: { name: string; icon: string; color: string } } = {
      'credit_analysis': { name: 'Phân tích tín dụng', icon: '💰', color: 'blue' },
      'risk_assessment': { name: 'Đánh giá rủi ro', icon: '📊', color: 'red' },
      'lc_processing': { name: 'Xử lý LC', icon: '💳', color: 'green' },
      'document_intelligence': { name: 'Trí tuệ tài liệu', icon: '📄', color: 'purple' },
      'decision_synthesis': { name: 'Tổng hợp quyết định', icon: '🧠', color: 'orange' },
      'supervisor': { name: 'Giám sát', icon: '🎯', color: 'grey' }
    };
    return agentMap[type] || { name: 'AI Agent', icon: '🤖', color: 'grey' };
  };

  const agentInfo = getAgentInfo(agentType);

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <Box color="text-status-inactive" fontSize="body-s">N/A</Box>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <StatusIndicator type={value ? 'success' : 'error'}>
          {value ? 'Có' : 'Không'}
        </StatusIndicator>
      );
    }
    
    if (typeof value === 'number') {
      return <Box fontSize="body-s">{value.toLocaleString('vi-VN')}</Box>;
    }
    
    if (Array.isArray(value)) {
      return (
        <TextContent>
          <ul>
            {value.map((item, index) => (
              <li key={index}>
                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
              </li>
            ))}
          </ul>
        </TextContent>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <Box padding="xs">
          <TextContent>
            <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa' }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          </TextContent>
        </Box>
      );
    }
    
    return <Box fontSize="body-s">{String(value)}</Box>;
  };

  const renderKeyValuePairs = (obj: any, level: number = 0): any[] => {
    if (!obj || typeof obj !== 'object') return [];

    return Object.entries(obj).map(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return {
          label: displayKey,
          value: (
            <ExpandableSection headerText={`Chi tiết ${displayKey}`} variant="container">
              <KeyValuePairs
                columns={1}
                items={renderKeyValuePairs(value, level + 1)}
              />
            </ExpandableSection>
          )
        };
      }

      return {
        label: displayKey,
        value: renderValue(value)
      };
    });
  };

  // Extract key metrics for summary tiles
  const getKeyMetrics = (data: any) => {
    const metrics = [];
    
    // Common patterns for different agent types
    if (data.confidence_score !== undefined) {
      metrics.push({
        label: 'Độ tin cậy',
        value: `${Math.round(data.confidence_score * 100)}%`,
        description: 'Mức độ tin cậy của kết quả'
      });
    }
    
    if (data.processing_time !== undefined) {
      metrics.push({
        label: 'Thời gian xử lý',
        value: `${data.processing_time.toFixed(2)}s`,
        description: 'Thời gian xử lý yêu cầu'
      });
    }
    
    if (data.status !== undefined) {
      metrics.push({
        label: 'Trạng thái',
        value: data.status === 'success' ? 'Thành công' : 'Lỗi',
        description: 'Trạng thái xử lý'
      });
    }
    
    if (data.risk_score !== undefined) {
      metrics.push({
        label: 'Điểm rủi ro',
        value: data.risk_score.toFixed(2),
        description: 'Mức độ rủi ro đánh giá'
      });
    }
    
    if (data.credit_score !== undefined) {
      metrics.push({
        label: 'Điểm tín dụng',
        value: data.credit_score.toFixed(0),
        description: 'Điểm tín dụng được tính toán'
      });
    }

    if (data.amount !== undefined) {
      metrics.push({
        label: 'Số tiền',
        value: new Intl.NumberFormat('vi-VN', { 
          style: 'currency', 
          currency: 'VND' 
        }).format(data.amount),
        description: 'Số tiền liên quan'
      });
    }

    return metrics;
  };

  const keyMetrics = getKeyMetrics(data);
  const keyValueItems = renderKeyValuePairs(data);

  return (
    <SpaceBetween direction="vertical" size="s">
      {/* Main Header */}
      <Container
        header={
          <Header
            variant="h3"
            actions={
              <Button
                variant="inline-link"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Thu gọn' : 'Chi tiết'}
              </Button>
            }
          >
            <SpaceBetween direction="horizontal" size="s">
              <Badge color={agentInfo.color as any}>
                {agentInfo.icon} {agentInfo.name}
              </Badge>
            </SpaceBetween>
          </Header>
        }
      >
        {/* Key Metrics */}
        {keyMetrics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(keyMetrics.length, 4)}, 1fr)`, gap: '16px' }}>
            {keyMetrics.map((metric, index) => (
              <div key={index} style={{ backgroundColor: '#f8f9fa', textAlign: 'center', padding: '16px', borderRadius: '8px', border: '1px solid #e1e4e8' }}>
                <SpaceBetween direction="vertical" size="xs">
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0073bb' }}>
                    {metric.value}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {metric.label}
                  </div>
                  {metric.description && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {metric.description}
                    </div>
                  )}
                </SpaceBetween>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Processing Message */}
      <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e1e4e8' }}>
        <TextContent>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <StatusIndicator type="success" /> {message}
          </p>
        </TextContent>
      </div>

      {/* Expanded Details */}
      {expanded && keyValueItems.length > 0 && (
        <Container header={<Header variant="h3">📋 Dữ liệu chi tiết</Header>}>
          <KeyValuePairs
            columns={1}
            items={keyValueItems}
          />
        </Container>
      )}

      {/* Raw Data (for debugging) */}
      {expanded && (
        <ExpandableSection headerText="🔧 Dữ liệu thô (Debug)">
          <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e1e4e8' }}>
            <TextContent>
              <pre style={{ 
                fontSize: '11px', 
                margin: 0, 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </TextContent>
          </div>
        </ExpandableSection>
      )}
    </SpaceBetween>
  );
};

export default AgentResult;
