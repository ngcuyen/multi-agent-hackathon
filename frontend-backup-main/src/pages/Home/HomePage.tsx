import React from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Grid,
  Box,
  Button,
  Badge,
  ColumnLayout,
  StatusIndicator,
  ProgressBar,
  Cards,
  Link
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'processing';
  capabilities: string[];
  accuracy?: string;
  processingTime?: string;
}

interface HomePageProps {
  agents: Agent[];
  loading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ agents, loading }) => {
  const navigate = useNavigate();

  const bankingAgents = [
    {
      id: 'supervisor',
      name: 'Supervisor Agent',
      description: 'Orchestrates workflow and coordinates other agents',
      status: 'active' as const,
      capabilities: ['Workflow Management', 'Agent Coordination', 'Task Distribution'],
      accuracy: '99.8%',
      processingTime: '< 1 min'
    },
    {
      id: 'document-intelligence',
      name: 'Document Intelligence Agent',
      description: 'Advanced OCR with deep Vietnamese NLP capabilities',
      status: 'active' as const,
      capabilities: ['OCR Processing', 'Vietnamese NLP', 'Document Classification'],
      accuracy: '99.5%',
      processingTime: '2-5 min'
    },
    {
      id: 'risk-assessment',
      name: 'Risk Assessment Agent',
      description: 'Automated financial analysis and predictive risk modeling',
      status: 'active' as const,
      capabilities: ['Financial Analysis', 'Risk Modeling', 'Credit Scoring'],
      accuracy: '95.2%',
      processingTime: '3-8 min'
    },
    {
      id: 'compliance-validation',
      name: 'Compliance Validation Agent',
      description: 'Validates against UCP 600, ISBP 821, and SBV regulations',
      status: 'active' as const,
      capabilities: ['UCP 600 Validation', 'ISBP 821 Compliance', 'SBV Regulations'],
      accuracy: '98.7%',
      processingTime: '1-3 min'
    },
    {
      id: 'decision-synthesis',
      name: 'Decision Synthesis Agent',
      description: 'Generates evidence-based recommendations with confidence scores',
      status: 'active' as const,
      capabilities: ['Decision Making', 'Confidence Scoring', 'Report Generation'],
      accuracy: '97.3%',
      processingTime: '2-4 min'
    },
    {
      id: 'process-automation',
      name: 'Process Automation Agent',
      description: 'End-to-end automation for banking workflows',
      status: 'active' as const,
      capabilities: ['LC Processing', 'Credit Proposals', 'Workflow Automation'],
      accuracy: '96.8%',
      processingTime: '5-15 min'
    }
  ];

  const performanceMetrics = [
    { label: 'Processing Time Reduction', value: '60-80%', trend: 'positive' },
    { label: 'Operational Cost Reduction', value: '40-50%', trend: 'positive' },
    { label: 'Error Rate Reduction', value: '< 1%', trend: 'positive' },
    { label: 'Documents Processed Today', value: '1,247', trend: 'neutral' }
  ];

  const quickActions = [
    {
      title: 'Letter of Credit Processing',
      description: 'Process LC documents with automated validation',
      action: () => navigate('/lc-processing'),
      icon: '📄',
      badge: 'New'
    },
    {
      title: 'Credit Proposal Assessment',
      description: 'Automated credit risk analysis and recommendations',
      action: () => navigate('/credit-assessment'),
      icon: '💰',
      badge: 'Popular'
    },
    {
      title: 'Document Intelligence',
      description: 'OCR and Vietnamese NLP document processing',
      action: () => navigate('/text-summary'),
      icon: '🔍',
      badge: null
    },
    {
      title: 'Risk Dashboard',
      description: 'Real-time risk monitoring and analytics',
      action: () => navigate('/risk-dashboard'),
      icon: '📊',
      badge: 'Beta'
    }
  ];

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        {/* Header */}
        <Header
          variant="h1"
          description="Multi-Agent AI for Banking Process Automation"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="primary" onClick={() => navigate('/agents')}>
                Manage Agents
              </Button>
              <Button onClick={() => navigate('/settings')}>
                Settings
              </Button>
            </SpaceBetween>
          }
        >
          🏦 VPBank K-MULT Agent Studio
        </Header>

        {/* Performance Metrics */}
        <Box>
          <Header variant="h2">Performance Overview</Header>
          <ColumnLayout columns={4}>
            {performanceMetrics.map((metric, index) => (
              <Box key={index} padding="m">
                <SpaceBetween direction="vertical" size="xs">
                  <Box fontSize="heading-s" color="text-status-success">
                    {metric.value}
                  </Box>
                  <Box fontSize="body-s" color="text-body-secondary">
                    {metric.label}
                  </Box>
                  {metric.trend === 'positive' && (
                    <StatusIndicator type="success">Improved</StatusIndicator>
                  )}
                </SpaceBetween>
              </Box>
            ))}
          </ColumnLayout>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Header variant="h2">Quick Actions</Header>
          <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }, { colspan: 6 }, { colspan: 6 }]}>
            {quickActions.map((action, index) => (
              <Box key={index} padding="s">
                <Box
                  padding="m"
                  
                  
                >
                  <SpaceBetween direction="vertical" size="s">
                    <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                      <Box fontSize="heading-m">{action.icon}</Box>
                      {action.badge && (
                        <Badge color={action.badge === 'New' ? 'green' : action.badge === 'Popular' ? 'blue' : 'grey'}>
                          {action.badge}
                        </Badge>
                      )}
                    </SpaceBetween>
                    <Box fontSize="heading-s">{action.title}</Box>
                    <Box fontSize="body-s" color="text-body-secondary">
                      {action.description}
                    </Box>
                    <Button variant="primary" onClick={action.action} fullWidth>
                      Get Started
                    </Button>
                  </SpaceBetween>
                </Box>
              </Box>
            ))}
          </Grid>
        </Box>

        {/* Agent Status */}
        <Box>
          <Header 
            variant="h2"
            actions={
              <Button onClick={() => navigate('/agents')}>
                View All Agents
              </Button>
            }
          >
            AI Agents Status
          </Header>
          <Cards
            cardDefinition={{
              header: item => (
                <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                  <Link href="#" fontSize="heading-s">{item.name}</Link>
                  <StatusIndicator type={item.status === 'active' ? 'success' : 'pending'}>
                    {item.status === 'active' ? 'Active' : 'Inactive'}
                  </StatusIndicator>
                </SpaceBetween>
              ),
              sections: [
                {
                  id: "description",
                  content: item => item.description
                },
                {
                  id: "metrics",
                  content: item => (
                    <ColumnLayout columns={2}>
                      <SpaceBetween direction="vertical" size="xs">
                        <Box fontSize="body-s" color="text-body-secondary">Accuracy</Box>
                        <Box fontSize="heading-s" color="text-status-success">{item.accuracy}</Box>
                      </SpaceBetween>
                      <SpaceBetween direction="vertical" size="xs">
                        <Box fontSize="body-s" color="text-body-secondary">Processing Time</Box>
                        <Box fontSize="heading-s">{item.processingTime}</Box>
                      </SpaceBetween>
                    </ColumnLayout>
                  )
                },
                {
                  id: "capabilities",
                  content: item => (
                    <SpaceBetween direction="horizontal" size="xs">
                      {item.capabilities.slice(0, 3).map((capability, index) => (
                        <Badge key={index} color="blue">{capability}</Badge>
                      ))}
                    </SpaceBetween>
                  )
                }
              ]
            }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 },
              { minWidth: 800, cards: 3 }
            ]}
            items={bankingAgents.slice(0, 6)}
            loading={loading}
            loadingText="Loading agents..."
            empty={
              <Box textAlign="center" color="inherit">
                <Box variant="strong" textAlign="center" color="inherit">
                  No agents available
                </Box>
                <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                  Configure your AI agents to get started.
                </Box>
                <Button onClick={() => navigate('/agents')}>Create Agent</Button>
              </Box>
            }
          />
        </Box>

        {/* System Status */}
        <Box>
          <Header variant="h2">System Status</Header>
          <ColumnLayout columns={3}>
            <SpaceBetween direction="vertical" size="s">
              <Box fontSize="body-s" color="text-body-secondary">AWS Bedrock</Box>
              <StatusIndicator type="success">Operational</StatusIndicator>
              <ProgressBar value={98} additionalInfo="Claude 3.7 Sonnet" />
            </SpaceBetween>
            <SpaceBetween direction="vertical" size="s">
              <Box fontSize="body-s" color="text-body-secondary">Document Processing</Box>
              <StatusIndicator type="success">Operational</StatusIndicator>
              <ProgressBar value={95} additionalInfo="OCR & NLP Services" />
            </SpaceBetween>
            <SpaceBetween direction="vertical" size="s">
              <Box fontSize="body-s" color="text-body-secondary">Database</Box>
              <StatusIndicator type="success">Operational</StatusIndicator>
              <ProgressBar value={99} additionalInfo="DynamoDB & MongoDB" />
            </SpaceBetween>
          </ColumnLayout>
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default HomePage;
