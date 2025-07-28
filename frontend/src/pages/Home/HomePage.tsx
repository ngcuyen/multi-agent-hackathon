import React, { useState, useEffect } from 'react';
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
  Link,
  Alert,
  Tiles,
  KeyValuePairs,
  TextContent,
  ExpandableSection
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
  const [systemStats, setSystemStats] = useState({
    totalProcessed: 1247,
    successRate: 99.5,
    avgProcessingTime: 2.3,
    activeAgents: 6
  });

  // Welcome banner with key features
  const welcomeContent = (
    <Alert
      statusIconAriaLabel="Info"
      header="Welcome to VPBank K-MULT Agent Studio"
      type="info"
    >
      <TextContent>
        <p>
          <strong>Advanced Multi-Agent AI System</strong> designed to automate complex banking processes.
          With specialized Vietnamese NLP capabilities and 99.5% accuracy, we reduce processing time by 60-80%.
        </p>
        <ul>
          <li><strong>6 Specialized AI Agents</strong> working collaboratively</li>
          <li><strong>Letter of Credit Processing</strong>: 8-12 hours reduced to under 30 minutes</li>
          <li><strong>Automated Credit Assessment</strong> with high accuracy scoring</li>
          <li><strong>Compliance Validation</strong> per UCP 600, ISBP 821, SBV standards</li>
        </ul>
      </TextContent>
    </Alert>
  );

  // Quick action tiles
  const quickActions = [
    {
      label: "Document Summarization",
      description: "Upload and summarize Vietnamese documents with 99.5% accuracy",
      value: "document-summary",
      href: "/text-summary"
    },
    {
      label: "AI Assistant",
      description: "Interact with our intelligent multi-agent system",
      value: "ai-chat", 
      href: "/chat"
    },
    {
      label: "LC Processing",
      description: "Automated Letter of Credit processing and validation",
      value: "lc-processing",
      href: "/lc-processing"
    },
    {
      label: "Credit Assessment",
      description: "Risk analysis and credit scoring automation",
      value: "credit-assessment",
      href: "/credit-assessment"
    }
  ];

  // System performance metrics
  const performanceMetrics = [
    {
      label: "Documents Processed",
      value: systemStats.totalProcessed.toLocaleString(),
      info: "Total documents successfully processed"
    },
    {
      label: "Success Rate",
      value: `${systemStats.successRate}%`,
      info: "Accuracy in processing and analysis"
    },
    {
      label: "Average Processing Time",
      value: `${systemStats.avgProcessingTime}s`,
      info: "Average system response time"
    },
    {
      label: "Active Agents",
      value: systemStats.activeAgents.toString(),
      info: "Number of AI agents ready to serve"
    }
  ];

  // Banking agents overview
  const bankingAgents = [
    {
      id: 'supervisor',
      name: 'Supervisor Agent',
      description: 'Orchestrates workflow and coordinates other agents',
      status: 'active' as const,
      capabilities: ['Workflow Management', 'Agent Coordination', 'Task Distribution'],
      accuracy: '99.8%',
      processingTime: 'Under 1 minute'
    },
    {
      id: 'document-intelligence',
      name: 'Document Intelligence Agent',
      description: 'Advanced OCR with deep Vietnamese NLP capabilities',
      status: 'active' as const,
      capabilities: ['Vietnamese OCR', 'Information Extraction', 'Document Classification'],
      accuracy: '99.5%',
      processingTime: 'Under 30 seconds'
    },
    {
      id: 'risk-assessment',
      name: 'Risk Assessment Agent',
      description: 'Financial risk analysis and predictive modeling',
      status: 'active' as const,
      capabilities: ['Credit Scoring', 'Financial Analysis', 'Risk Prediction'],
      accuracy: '97.2%',
      processingTime: 'Under 2 minutes'
    },
    {
      id: 'compliance-validation',
      name: 'Compliance Validation Agent',
      description: 'Banking regulation compliance checking',
      status: 'active' as const,
      capabilities: ['UCP 600', 'ISBP 821', 'SBV Regulations'],
      accuracy: '98.9%',
      processingTime: 'Under 1 minute'
    },
    {
      id: 'decision-synthesis',
      name: 'Decision Synthesis Agent',
      description: 'Evidence-based recommendation generation',
      status: 'active' as const,
      capabilities: ['Comprehensive Analysis', 'Decision Recommendations', 'Detailed Reports'],
      accuracy: '99.1%',
      processingTime: 'Under 45 seconds'
    },
    {
      id: 'process-automation',
      name: 'Process Automation Agent',
      description: 'End-to-end workflow automation',
      status: 'active' as const,
      capabilities: ['LC Automation', 'Credit Workflows', 'System Integration'],
      accuracy: '98.7%',
      processingTime: 'Under 5 minutes'
    }
  ];

  const handleQuickAction = (href: string) => {
    navigate(href);
  };

  return (
    <SpaceBetween size="l">
      {/* Welcome Section */}
      <Container>
        {welcomeContent}
      </Container>

      {/* Quick Actions */}
      <Container
        header={
          <Header
            variant="h2"
            description="Choose the feature you want to use"
          >
            Quick Start
          </Header>
        }
      >
        <Tiles
          onChange={({ detail }) => handleQuickAction(detail.value)}
          value=""
          items={quickActions}
        />
      </Container>

      {/* System Performance */}
      <Container
        header={
          <Header
            variant="h2"
            description="Real-time system performance metrics"
          >
            System Statistics
          </Header>
        }
      >
        <ColumnLayout columns={4} variant="text-grid">
          {performanceMetrics.map((metric, index) => (
            <div key={index}>
              <Box variant="awsui-key-label">{metric.label}</Box>
              <Box variant="h2" color="text-status-success">
                {metric.value}
              </Box>
              <Box variant="small" color="text-status-subdued">
                {metric.info}
              </Box>
            </div>
          ))}
        </ColumnLayout>
      </Container>

      {/* Multi-Agent System Overview */}
      <Container
        header={
          <Header
            variant="h2"
            description="6 specialized AI agents working together"
            actions={
              <Button
                variant="primary"
                onClick={() => navigate('/agents')}
              >
                View Details
              </Button>
            }
          >
            Multi-Agent System
          </Header>
        }
      >
        <Cards
          ariaLabels={{
            itemSelectionLabel: (e, t) => `select ${t.name}`,
            selectionGroupLabel: "Item selection"
          }}
          cardDefinition={{
            header: item => (
              <Link fontSize="heading-m">
                {item.name}
              </Link>
            ),
            sections: [
              {
                id: "description",
                content: item => item.description
              },
              {
                id: "capabilities",
                header: "Capabilities",
                content: item => (
                  <SpaceBetween direction="horizontal" size="xs">
                    {item.capabilities.map((capability: string, index: number) => (
                      <Badge key={index} color="blue">
                        {capability}
                      </Badge>
                    ))}
                  </SpaceBetween>
                )
              },
              {
                id: "performance",
                header: "Performance",
                content: item => (
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Accuracy</Box>
                      <StatusIndicator type="success">
                        {item.accuracy}
                      </StatusIndicator>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Processing Time</Box>
                      <Box>{item.processingTime}</Box>
                    </div>
                  </ColumnLayout>
                )
              }
            ]
          }}
          cardsPerRow={[
            { cards: 1 },
            { minWidth: 500, cards: 2 },
            { minWidth: 800, cards: 3 }
          ]}
          items={bankingAgents}
          loading={loading}
          loadingText="Loading agent information..."
          empty={
            <Box textAlign="center" color="inherit">
              <b>No agents available</b>
              <Box
                padding={{ bottom: "s" }}
                variant="p"
                color="inherit"
              >
                No agents have been configured in the system.
              </Box>
            </Box>
          }
        />
      </Container>

      {/* Getting Started Guide */}
      <Container
        header={
          <Header
            variant="h2"
            description="Learn how to use the system effectively"
          >
            Getting Started Guide
          </Header>
        }
      >
        <ExpandableSection headerText="How to Use the System" defaultExpanded>
          <SpaceBetween size="m">
            <Alert
              statusIconAriaLabel="Success"
              type="success"
              header="Step 1: Choose a Feature"
            >
              Use the "Quick Start" section above to select the feature you need: document summarization, AI assistant, LC processing, or credit assessment.
            </Alert>
            
            <Alert
              statusIconAriaLabel="Info"
              type="info"
              header="Step 2: Upload Documents (if needed)"
            >
              For document processing features, upload PDF, DOCX, or image files. The system supports Vietnamese with 99.5% accuracy.
            </Alert>
            
            <Alert
              statusIconAriaLabel="Warning"
              type="warning"
              header="Step 3: Review Results"
            >
              The system will process and return results within seconds to minutes depending on document complexity.
            </Alert>
          </SpaceBetween>
        </ExpandableSection>

        <ExpandableSection headerText="Best Practices">
          <TextContent>
            <ul>
              <li><strong>Document Quality:</strong> Use high-resolution PDF files or images for best OCR results</li>
              <li><strong>Language Support:</strong> System is optimized for Vietnamese but also supports English</li>
              <li><strong>File Size Limits:</strong> Maximum 50MB per file upload</li>
              <li><strong>Supported Formats:</strong> PDF, DOCX, TXT, JPG, PNG, TIFF</li>
              <li><strong>Security:</strong> All data is encrypted and processed securely</li>
            </ul>
          </TextContent>
        </ExpandableSection>

        <ExpandableSection headerText="API Integration">
          <TextContent>
            <p>Developers can integrate with our system using these key endpoints:</p>
            <ul>
              <li><strong>Pure Strands API:</strong> <code>POST /mutil_agent/api/pure-strands/process</code></li>
              <li><strong>Document Summary:</strong> <code>POST /mutil_agent/api/v1/text/summary/document</code></li>
              <li><strong>Health Check:</strong> <code>GET /mutil_agent/public/api/v1/health-check/health</code></li>
              <li><strong>Risk Assessment:</strong> <code>POST /mutil_agent/api/v1/risk/assess</code></li>
            </ul>
            <p>
              Visit our <Link href="/docs" external>API Documentation</Link> for complete integration guides and examples.
            </p>
          </TextContent>
        </ExpandableSection>
      </Container>
    </SpaceBetween>
  );
};

export default HomePage;
