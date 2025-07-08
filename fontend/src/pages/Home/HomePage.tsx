import React from 'react';
import {
  Container,
  Header,
  Grid,
  Box,
  Cards,
  Button,
  Badge,
  ProgressBar,
  SpaceBetween,
  TextContent,
  ColumnLayout,
  StatusIndicator
} from "@cloudscape-design/components";
import { useNavigate } from 'react-router-dom';
import { Agent } from '../../types';

interface HomePageProps {
  agents: Agent[];
  loading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ agents, loading }) => {
  const navigate = useNavigate();

  const features = [
    {
      title: '📄 Tóm tắt văn bản & Tài liệu',
      description: 'Sử dụng AI để tóm tắt văn bản và tài liệu với nhiều định dạng khác nhau (PDF, DOCX, TXT).',
      action: () => navigate('/text-summary'),
      buttonText: 'Bắt đầu tóm tắt'
    },
    {
      title: '💬 Chat với AI Agent',
      description: 'Trò chuyện với các AI Agent chuyên về phân tích rủi ro và xử lý tài liệu.',
      action: () => navigate('/chat'),
      buttonText: 'Bắt đầu chat'
    },
    {
      title: '📊 Dashboard phân tích',
      description: 'Theo dõi hiệu suất, thống kê sử dụng và các chỉ số sức khỏe hệ thống.',
      action: () => navigate('/dashboard'),
      buttonText: 'Xem Dashboard'
    },
    {
      title: '🤖 Quản lý Agent',
      description: 'Tạo, cấu hình và quản lý các AI Agent với khả năng tùy chỉnh.',
      action: () => navigate('/agents'),
      buttonText: 'Quản lý Agent'
    }
  ];

  const systemStats = [
    {
      title: 'AI Agents hoạt động',
      value: agents.length.toString(),
      status: agents.length > 0 ? 'success' : 'warning' as const
    },
    {
      title: 'Trạng thái hệ thống',
      value: 'Hoạt động tốt',
      status: 'success' as const
    },
    {
      title: 'Thời gian phản hồi',
      value: '< 3s',
      status: 'success' as const
    },
    {
      title: 'Uptime',
      value: '99.9%',
      status: 'success' as const
    }
  ];

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h1"
          description="Hệ thống đánh giá rủi ro AI với khả năng tóm tắt tài liệu, trò chuyện AI và kiến trúc đa agent sử dụng AWS Bedrock (Claude 3.7)."
        >
          🤖 Hệ thống đánh giá rủi ro AI đa Agent
        </Header>

        {/* System Status Cards */}
        <Box>
          <Header variant="h2">Tổng quan hệ thống</Header>
          <ColumnLayout columns={4} variant="text-grid">
            {systemStats.map((stat, index) => (
              <div key={index}>
                <Box variant="awsui-key-label">{stat.title}</Box>
                <SpaceBetween direction="horizontal" size="xs">
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {stat.value}
                  </div>
                  <StatusIndicator type={stat.status as any} />
                </SpaceBetween>
              </div>
            ))}
          </ColumnLayout>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Header variant="h2">Tính năng chính</Header>
          <ColumnLayout columns={2}>
            {features.map((feature, index) => (
              <div key={index} style={{ border: '1px solid #e9ebed', borderRadius: '8px' }}>
                <Box padding="l">
                  <SpaceBetween direction="vertical" size="m">
                    <Header variant="h3">{feature.title}</Header>
                    <TextContent>
                      <p>{feature.description}</p>
                    </TextContent>
                    <Button variant="primary" onClick={feature.action}>
                      {feature.buttonText}
                    </Button>
                  </SpaceBetween>
                </Box>
              </div>
            ))}
          </ColumnLayout>
        </Box>

        {/* Features Overview */}
        <Box>
          <Header variant="h2">Key Features</Header>
          <ColumnLayout columns={1}>
            <div style={{ border: '1px solid #e9ebed', borderRadius: '8px' }}>
              <Box padding="l">
                <SpaceBetween direction="vertical" size="m">
                  <Header variant="h3">🤖 Multi-Agent System</Header>
                  <TextContent>
                    <p>Orchestrate multiple AI agents for collaborative risk assessment and document analysis.</p>
                  </TextContent>
                </SpaceBetween>
              </Box>
            </div>

            <div style={{ border: '1px solid #e9ebed', borderRadius: '8px' }}>
              <Box padding="l">
                <SpaceBetween direction="vertical" size="m">
                  <Header variant="h3">📄 Document Processing</Header>
                  <TextContent>
                    <p>Summarize, extract, and analyze documents in Vietnamese and English.</p>
                  </TextContent>
                </SpaceBetween>
              </Box>
            </div>

            <div style={{ border: '1px solid #e9ebed', borderRadius: '8px' }}>
              <Box padding="l">
                <SpaceBetween direction="vertical" size="m">
                  <Header variant="h3">💬 Conversational AI</Header>
                  <TextContent>
                    <p>Chat with AI agents for real-time insights and support.</p>
                  </TextContent>
                </SpaceBetween>
              </Box>
            </div>
          </ColumnLayout>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box>
            <Header variant="h3">Loading System Data...</Header>
            <ProgressBar 
              status="in-progress"
              value={50}
              additionalInfo="Connecting to backend services..."
            />
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default HomePage;
