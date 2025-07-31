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
  Link
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import { systemAPI, agentAPI } from '../../services/api';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'processing';
  capabilities: string[];
  accuracy?: string;
  processingTime?: string;
  loadPercentage?: number;
  currentTask?: string;
  lastActivity?: string;
}

interface HomePageProps {
  agents: Agent[];
  loading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ agents: propAgents, loading: propLoading }) => {
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [agentStats, setAgentStats] = useState<any>(null);
  const [realTimeAgents, setRealTimeAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real system data
  useEffect(() => {
    const loadSystemData = async () => {
      try {
        setLoading(true);
        
        // Load system health
        const healthResponse = await systemAPI.getSystemHealth();
        if (healthResponse.success) {
          setSystemHealth(healthResponse.data);
        }

        // Load real-time agent data
        const agentResponse = await agentAPI.getAgents();
        if (agentResponse.success) {
          setRealTimeAgents(agentResponse.data);
          
          // Calculate agent statistics
          const activeAgents = agentResponse.data.filter((agent: Agent) => agent.status === 'active').length;
          const totalAgents = agentResponse.data.length;
          const avgLoad = agentResponse.data.reduce((sum: number, agent: Agent) => 
            sum + (agent.loadPercentage || 0), 0) / totalAgents;
          
          setAgentStats({
            total: totalAgents,
            active: activeAgents,
            averageLoad: avgLoad.toFixed(1),
            processing: agentResponse.data.filter((agent: Agent) => agent.currentTask).length
          });
        }
        
      } catch (error) {
        console.error('Failed to load system data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSystemData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Use real-time data if available, otherwise fall back to props
  const displayAgents = realTimeAgents.length > 0 ? realTimeAgents : propAgents;
  const isLoading = loading || propLoading;

  // System metrics based on real data
  const systemMetrics = [
    {
      label: 'System Status',
      value: systemHealth?.status || 'Unknown',
      type: systemHealth?.status === 'healthy' ? 'success' : 'error'
    },
    {
      label: 'Active Agents',
      value: `${agentStats?.active || 0}/${agentStats?.total || 0}`,
      type: agentStats?.active === agentStats?.total ? 'success' : 'warning'
    },
    {
      label: 'Average Load',
      value: `${agentStats?.averageLoad || '0.0'}%`,
      type: parseFloat(agentStats?.averageLoad || '0') < 70 ? 'success' : 'warning'
    },
    {
      label: 'Processing Tasks',
      value: agentStats?.processing || 0,
      type: 'info'
    }
  ];

  if (isLoading) {
    return (
      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Header variant="h1">VPBank K-MULT Agent Studio</Header>
          <Box textAlign="center">
            <ProgressBar
              status="in-progress"
              value={50}
              label="Loading system data..."
            />
          </Box>
        </SpaceBetween>
      </Container>
    );
  }

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        {/* Header Section */}
        <Header
          variant="h1"
          description="Multi-Agent AI Platform for Vietnamese Banking Process Automation"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => navigate('/agent-dashboard')}
              >
                View Agent Dashboard
              </Button>
              <Button
                onClick={() => navigate('/text-summary')}
              >
                Process Documents
              </Button>
            </SpaceBetween>
          }
        >
          VPBank K-MULT Agent Studio
        </Header>

        {/* System Metrics */}
        <ColumnLayout columns={4} variant="text-grid">
          {systemMetrics.map((metric, index) => (
            <div key={index}>
              <Box variant="awsui-key-label">{metric.label}</Box>
              <StatusIndicator type={metric.type as any}>
                {metric.value}
              </StatusIndicator>
            </div>
          ))}
        </ColumnLayout>

        {/* Real-time Agent Status */}
        <Cards
          cardDefinition={{
            header: (item: Agent) => (
              <Link href="#" fontSize="heading-m">
                {item.name}
              </Link>
            ),
            sections: [
              {
                id: "description",
                content: (item: Agent) => item.description
              },
              {
                id: "status",
                header: "Status",
                content: (item: Agent) => (
                  <StatusIndicator type={item.status === 'active' ? 'success' : 'error'}>
                    {item.status}
                  </StatusIndicator>
                )
              },
              {
                id: "load",
                header: "Current Load",
                content: (item: Agent) => (
                  <div>
                    <ProgressBar
                      value={item.loadPercentage || 0}
                      label={`${item.loadPercentage || 0}%`}
                      status={item.loadPercentage && item.loadPercentage > 80 ? 'error' : 'success'}
                    />
                  </div>
                )
              },
              {
                id: "task",
                header: "Current Task",
                content: (item: Agent) => (
                  <Badge color={item.currentTask ? 'blue' : 'grey'}>
                    {item.currentTask || 'Idle'}
                  </Badge>
                )
              },
              {
                id: "capabilities",
                header: "Capabilities",
                content: (item: Agent) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    {item.capabilities?.slice(0, 3).map((capability, idx) => (
                      <Badge key={idx} color="green">
                        {capability}
                      </Badge>
                    ))}
                    {item.capabilities?.length > 3 && (
                      <Badge color="grey">+{item.capabilities.length - 3} more</Badge>
                    )}
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
          items={displayAgents}
          loadingText="Loading agents..."
          empty={
            <Box textAlign="center" color="inherit">
              <b>No agents available</b>
              <Box
                padding={{ bottom: "s" }}
                variant="p"
                color="inherit"
              >
                No agents are currently configured.
              </Box>
            </Box>
          }
          header={
            <Header
              counter={`(${displayAgents.length})`}
              actions={
                <Button
                  variant="primary"
                  onClick={() => navigate('/agents')}
                >
                  Manage Agents
                </Button>
              }
            >
              Banking Agents
            </Header>
          }
        />

        {/* Quick Actions */}
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 6, s: 4 } },
            { colspan: { default: 12, xs: 6, s: 4 } },
            { colspan: { default: 12, xs: 12, s: 4 } }
          ]}
        >
          <Box padding="l" className="awsui-util-border-radius-medium" style={{ backgroundColor: '#f2f3f3' }}>
            <SpaceBetween direction="vertical" size="s">
              <Header variant="h3">Document Processing</Header>
              <Box variant="p">
                Process Vietnamese banking documents with advanced OCR and NLP capabilities.
              </Box>
              <Button
                variant="primary"
                onClick={() => navigate('/text-summary')}
              >
                Start Processing
              </Button>
            </SpaceBetween>
          </Box>

          <Box padding="l" className="awsui-util-border-radius-medium" style={{ backgroundColor: '#f2f3f3' }}>
            <SpaceBetween direction="vertical" size="s">
              <Header variant="h3">LC Processing</Header>
              <Box variant="p">
                Validate Letter of Credit documents against UCP 600 and ISBP 821 standards.
              </Box>
              <Button
                variant="primary"
                onClick={() => navigate('/lc-processing')}
              >
                Process LC
              </Button>
            </SpaceBetween>
          </Box>

          <Box padding="l" className="awsui-util-border-radius-medium" style={{ backgroundColor: '#f2f3f3' }}>
            <SpaceBetween direction="vertical" size="s">
              <Header variant="h3">Risk Assessment</Header>
              <Box variant="p">
                Automated credit risk analysis and scoring for Vietnamese banking.
              </Box>
              <Button
                variant="primary"
                onClick={() => navigate('/credit-assessment')}
              >
                Assess Risk
              </Button>
            </SpaceBetween>
          </Box>
        </Grid>

        {/* System Information */}
        <Box variant="awsui-key-label">
          System Information
        </Box>
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Service Version</Box>
            <div>{systemHealth?.version || '2.0.0'}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Last Updated</Box>
            <div>{new Date().toLocaleString()}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Features</Box>
            <div>
              {systemHealth?.features ? (
                <SpaceBetween direction="horizontal" size="xs">
                  {Object.entries(systemHealth.features).map(([key, value]) => (
                    <Badge key={key} color={value ? 'green' : 'red'}>
                      {key.replace('_', ' ')}
                    </Badge>
                  ))}
                </SpaceBetween>
              ) : (
                'Multi-Agent, Vietnamese NLP, Banking Compliance'
              )}
            </div>
          </div>
        </ColumnLayout>
      </SpaceBetween>
    </Container>
  );
};

export default HomePage;
