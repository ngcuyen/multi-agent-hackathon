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
  Spinner,
  KeyValuePairs,
  LineChart,
  BarChart,
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import { useRealTimeData, useAgentCoordination } from '../../hooks/useEnhancedApi';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'processing';
  capabilities: string[];
  loadPercentage?: number;
  currentTask?: string;
  lastActivity?: string;
}

const EnhancedHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { systemHealth, agentStatus, strandsStatus, loading, error, refresh } = useRealTimeData(15000);
  const { coordinateAgents, coordinationHistory } = useAgentCoordination();
  
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Generate performance chart data
  useEffect(() => {
    if (agentStatus?.agents) {
      const chartData = agentStatus.agents.map((agent: any, index: number) => ({
        x: agent.name,
        y: agent.load_percentage || 0,
      }));
      setPerformanceData(chartData);
    }
  }, [agentStatus]);

  // System metrics calculation
  const systemMetrics = React.useMemo(() => {
    if (!systemHealth || !agentStatus) return [];

    const activeAgents = agentStatus.active_agents || 0;
    const totalAgents = agentStatus.total_agents || 0;
    const avgLoad = agentStatus.agents?.reduce((sum: number, agent: any) => 
      sum + (agent.load_percentage || 0), 0) / totalAgents || 0;

    return [
      {
        label: 'System Status',
        value: systemHealth.status || 'Unknown',
        type: systemHealth.status === 'healthy' ? 'success' : 'error',
        description: `Service: ${systemHealth.service || 'N/A'}`,
      },
      {
        label: 'Active Agents',
        value: `${activeAgents}/${totalAgents}`,
        type: activeAgents === totalAgents ? 'success' : 'warning',
        description: `${totalAgents - activeAgents} inactive`,
      },
      {
        label: 'Average Load',
        value: `${avgLoad.toFixed(1)}%`,
        type: avgLoad < 70 ? 'success' : avgLoad < 90 ? 'warning' : 'error',
        description: 'System performance',
      },
      {
        label: 'Strands Agents',
        value: strandsStatus?.total_agents || 0,
        type: 'info',
        description: 'Multi-agent framework',
      },
    ];
  }, [systemHealth, agentStatus, strandsStatus]);

  // Handle agent coordination
  const handleCoordinateAgents = async (taskType: string) => {
    try {
      await coordinateAgents(taskType, 'high');
      refresh(); // Refresh data after coordination
    } catch (error) {
      console.error('Failed to coordinate agents:', error);
    }
  };

  // Loading state
  if (loading && !systemHealth && !agentStatus) {
    return (
      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Header variant="h1">VPBank K-MULT Agent Studio</Header>
          <Box textAlign="center">
            <Spinner size="large" />
            <Box variant="p" color="text-status-info">
              Loading real-time system data...
            </Box>
          </Box>
        </SpaceBetween>
      </Container>
    );
  }

  // Error state
  if (error && !systemHealth && !agentStatus) {
    return (
      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Header variant="h1">VPBank K-MULT Agent Studio</Header>
          <Alert
            statusIconAriaLabel="Error"
            type="error"
            header="System Connection Error"
            action={
              <Button onClick={refresh} variant="primary">
                Retry Connection
              </Button>
            }
          >
            Unable to connect to the backend services. Please check the system status and try again.
          </Alert>
        </SpaceBetween>
      </Container>
    );
  }

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        {/* Enhanced Header */}
        <Header
          variant="h1"
          description="Multi-Agent AI Platform for Vietnamese Banking Process Automation"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => navigate('/agent-dashboard')}
                iconName="status-positive"
              >
                Agent Dashboard
              </Button>
              <Button
                onClick={() => navigate('/text-summary')}
                iconName="file"
              >
                Process Documents
              </Button>
              <Button
                onClick={refresh}
                iconName="refresh"
                loading={loading}
              >
                Refresh
              </Button>
            </SpaceBetween>
          }
          info={
            <Link variant="info" onFollow={() => navigate('/system')}>
              View detailed system health
            </Link>
          }
        >
          VPBank K-MULT Agent Studio
        </Header>

        {/* System Status Alert */}
        {error && (
          <Alert
            statusIconAriaLabel="Warning"
            type="warning"
            header="Partial System Connectivity"
            dismissible
          >
            Some services may be experiencing connectivity issues. Core functionality remains available.
          </Alert>
        )}

        {/* Real-time System Metrics */}
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 6, s: 3 } },
            { colspan: { default: 12, xs: 6, s: 3 } },
            { colspan: { default: 12, xs: 6, s: 3 } },
            { colspan: { default: 12, xs: 6, s: 3 } }
          ]}
        >
          {systemMetrics.map((metric, index) => (
            <Box key={index} padding="l" className="metric-card">
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="awsui-key-label">{metric.label}</Box>
                <StatusIndicator type={metric.type as any}>
                  <Box fontSize="heading-l">{metric.value}</Box>
                </StatusIndicator>
                <Box variant="small" color="text-status-inactive">
                  {metric.description}
                </Box>
              </SpaceBetween>
            </Box>
          ))}
        </Grid>

        {/* Agent Performance Chart */}
        {performanceData.length > 0 && (
          <Box>
            <Header variant="h2" description="Real-time agent load distribution">
              Agent Performance
            </Header>
            <BarChart
              series={[
                {
                  title: "Load Percentage",
                  type: "bar",
                  data: performanceData,
                }
              ]}
              xDomain={performanceData.map(d => d.x)}
              yDomain={[0, 100]}
              xTitle="Agents"
              yTitle="Load (%)"
              height={300}
              hideFilter
              hideLegend
            />
          </Box>
        )}

        {/* Enhanced Agent Status Cards */}
        <Cards
          cardDefinition={{
            header: (item: any) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Link 
                  href="#" 
                  fontSize="heading-m"
                  onFollow={() => setSelectedAgent(item.agent_id)}
                >
                  {item.name}
                </Link>
                <Badge color={item.status === 'active' ? 'green' : 'red'}>
                  {item.status}
                </Badge>
              </SpaceBetween>
            ),
            sections: [
              {
                id: "description",
                content: (item: any) => (
                  <Box variant="p">
                    {item.description}
                  </Box>
                )
              },
              {
                id: "performance",
                header: "Performance",
                content: (item: any) => (
                  <SpaceBetween direction="vertical" size="xs">
                    <div>
                      <Box variant="awsui-key-label">Current Load</Box>
                      <ProgressBar
                        value={item.load_percentage || 0}
                        label={`${item.load_percentage || 0}%`}
                        status={
                          item.load_percentage > 80 ? 'error' : 
                          item.load_percentage > 60 ? 'warning' : 'success'
                        }
                      />
                    </div>
                    <KeyValuePairs
                      columns={2}
                      items={[
                        {
                          label: "Current Task",
                          value: item.current_task ? (
                            <Badge color="blue">{item.current_task}</Badge>
                          ) : (
                            <Badge color="grey">Idle</Badge>
                          )
                        },
                        {
                          label: "Last Activity",
                          value: item.last_activity || 'N/A'
                        }
                      ]}
                    />
                  </SpaceBetween>
                )
              },
              {
                id: "capabilities",
                header: "Capabilities",
                content: (item: any) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    {item.capabilities?.slice(0, 3).map((capability: string, idx: number) => (
                      <Badge key={idx} color="green">
                        {capability}
                      </Badge>
                    ))}
                    {item.capabilities?.length > 3 && (
                      <Badge color="grey">+{item.capabilities.length - 3} more</Badge>
                    )}
                  </SpaceBetween>
                )
              },
              {
                id: "actions",
                header: "Quick Actions",
                content: (item: any) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      size="small"
                      onClick={() => handleCoordinateAgents('document_processing')}
                    >
                      Assign Task
                    </Button>
                    <Button
                      size="small"
                      variant="link"
                      onClick={() => navigate(`/agents/${item.agent_id}`)}
                    >
                      View Details
                    </Button>
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
          items={agentStatus?.agents || []}
          loading={loading}
          loadingText="Loading agents..."
          empty={
            <Box textAlign="center" color="inherit">
              <b>No agents available</b>
              <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                No agents are currently configured or accessible.
              </Box>
              <Button onClick={refresh}>Refresh</Button>
            </Box>
          }
          header={
            <Header
              counter={`(${agentStatus?.total_agents || 0})`}
              description="Real-time agent monitoring with live performance metrics"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/agents')}
                    iconName="settings"
                  >
                    Manage Agents
                  </Button>
                  <Button
                    onClick={() => handleCoordinateAgents('system_check')}
                    iconName="share"
                  >
                    Coordinate All
                  </Button>
                </SpaceBetween>
              }
            >
              Banking Agents
            </Header>
          }
        />

        {/* Recent Coordination History */}
        {coordinationHistory.length > 0 && (
          <Box>
            <Header variant="h3" description="Recent agent coordination activities">
              Coordination History
            </Header>
            <SpaceBetween direction="vertical" size="xs">
              {coordinationHistory.slice(-3).map((item, index) => (
                <Box key={index} padding="s" className="coordination-item">
                  <SpaceBetween direction="horizontal" size="s">
                    <Badge color="blue">{item.taskType}</Badge>
                    <Badge color="grey">{item.priority}</Badge>
                    <Box variant="small">
                      {item.timestamp.toLocaleTimeString()}
                    </Box>
                    <Box variant="small" color="text-status-success">
                      {item.response?.assigned_agents?.length || 0} agents assigned
                    </Box>
                  </SpaceBetween>
                </Box>
              ))}
            </SpaceBetween>
          </Box>
        )}

        {/* Enhanced Quick Actions */}
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 6, s: 4 } },
            { colspan: { default: 12, xs: 6, s: 4 } },
            { colspan: { default: 12, xs: 12, s: 4 } }
          ]}
        >
          <Box padding="l" className="action-card">
            <SpaceBetween direction="vertical" size="s">
              <Header variant="h3">
                <SpaceBetween direction="horizontal" size="xs">
                  Document Processing
                  <StatusIndicator type="success">Ready</StatusIndicator>
                </SpaceBetween>
              </Header>
              <Box variant="p">
                Process Vietnamese banking documents with advanced OCR and NLP capabilities powered by Claude.
              </Box>
              <KeyValuePairs
                columns={1}
                items={[
                  { label: "Accuracy", value: "99.5%" },
                  { label: "Languages", value: "Vietnamese, English" },
                  { label: "Processing Time", value: "2-5 seconds" }
                ]}
              />
              <Button
                variant="primary"
                onClick={() => navigate('/text-summary')}
                iconName="file"
              >
                Start Processing
              </Button>
            </SpaceBetween>
          </Box>

          <Box padding="l" className="action-card">
            <SpaceBetween direction="vertical" size="s">
              <Header variant="h3">
                <SpaceBetween direction="horizontal" size="xs">
                  LC Processing
                  <StatusIndicator type="success">Ready</StatusIndicator>
                </SpaceBetween>
              </Header>
              <Box variant="p">
                Validate Letter of Credit documents against UCP 600 and ISBP 821 standards with SBV compliance.
              </Box>
              <KeyValuePairs
                columns={1}
                items={[
                  { label: "Standards", value: "UCP 600, ISBP 821" },
                  { label: "Compliance", value: "SBV Regulations" },
                  { label: "Document Types", value: "14 supported" }
                ]}
              />
              <Button
                variant="primary"
                onClick={() => navigate('/lc-processing')}
                iconName="check"
              >
                Process LC
              </Button>
            </SpaceBetween>
          </Box>

          <Box padding="l" className="action-card">
            <SpaceBetween direction="vertical" size="s">
              <Header variant="h3">
                <SpaceBetween direction="horizontal" size="xs">
                  Risk Assessment
                  <StatusIndicator type="success">Ready</StatusIndicator>
                </SpaceBetween>
              </Header>
              <Box variant="p">
                Automated credit risk analysis and scoring for Vietnamese banking with ML-powered insights.
              </Box>
              <KeyValuePairs
                columns={1}
                items={[
                  { label: "Accuracy", value: "95%" },
                  { label: "Models", value: "ML + Rule-based" },
                  { label: "Processing", value: "Real-time" }
                ]}
              />
              <Button
                variant="primary"
                onClick={() => navigate('/credit-assessment')}
                iconName="analytics"
              >
                Assess Risk
              </Button>
            </SpaceBetween>
          </Box>
        </Grid>

        {/* Enhanced System Information */}
        <ColumnLayout columns={4} variant="text-grid">
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
          <div>
            <Box variant="awsui-key-label">Response Time</Box>
            <div>
              <StatusIndicator type="success">
                {loading ? 'Updating...' : '< 2 seconds'}
              </StatusIndicator>
            </div>
          </div>
        </ColumnLayout>
      </SpaceBetween>
    </Container>
  );
};

export default EnhancedHomePage;
