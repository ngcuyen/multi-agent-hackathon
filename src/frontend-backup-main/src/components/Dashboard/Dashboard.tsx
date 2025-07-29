import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Cards,
  Badge,
  ProgressBar,
  StatusIndicator,
  Table,
  LineChart,
  BarChart,
  PieChart
} from "@cloudscape-design/components";

interface DashboardStats {
  totalAgents: number;
  activeChats: number;
  messagesProcessed: number;
  avgResponseTime: number;
  systemUptime: number;
  errorRate: number;
}

interface ChartData {
  x: string;
  y: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 5,
    activeChats: 12,
    messagesProcessed: 1247,
    avgResponseTime: 1.8,
    systemUptime: 99.9,
    errorRate: 0.1
  });

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockChartData = Array.from({ length: 24 }, (_, i) => ({
          x: `${i}:00`,
          y: Math.floor(Math.random() * 100) + 20
        }));
        setChartData(mockChartData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const recentActivities = [
    {
      id: '1',
      type: 'chat',
      message: 'New chat session started with Risk Assessment Agent',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'agent',
      message: 'Document Processing Agent updated',
      timestamp: '15 minutes ago',
      status: 'info'
    },
    {
      id: '3',
      type: 'system',
      message: 'System health check completed',
      timestamp: '1 hour ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'error',
      message: 'API rate limit warning',
      timestamp: '2 hours ago',
      status: 'warning'
    }
  ];

  const agentPerformance = [
    {
      name: 'Risk Assessment Agent',
      requests: 245,
      avgResponseTime: 1.2,
      successRate: 99.2,
      status: 'active'
    },
    {
      name: 'Document Processor',
      requests: 189,
      avgResponseTime: 2.1,
      successRate: 98.7,
      status: 'active'
    },
    {
      name: 'Chat Assistant',
      requests: 156,
      avgResponseTime: 0.9,
      successRate: 99.8,
      status: 'active'
    },
    {
      name: 'Data Analyzer',
      requests: 98,
      avgResponseTime: 3.2,
      successRate: 97.1,
      status: 'inactive'
    }
  ];

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h1"
          description="Monitor system performance, agent activity, and usage statistics."
        >
          Dashboard
        </Header>

        {/* Key Metrics */}
        <Box>
          <Header variant="h2">System Overview</Header>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total Agents</Box>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0073bb' }}>
                {stats.totalAgents}
              </div>
              <StatusIndicator type="success">Active</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Active Chats</Box>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#037f0c' }}>
                {stats.activeChats}
              </div>
              <StatusIndicator type="success">Online</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Messages Processed</Box>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8c4fff' }}>
                {stats.messagesProcessed.toLocaleString()}
              </div>
              <StatusIndicator type="success">Today</StatusIndicator>
            </div>
            <div>
              <Box variant="awsui-key-label">Avg Response Time</Box>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6600' }}>
                {stats.avgResponseTime}s
              </div>
              <StatusIndicator type="success">Optimal</StatusIndicator>
            </div>
          </ColumnLayout>
        </Box>

        {/* Performance Metrics */}
        <ColumnLayout columns={2}>
          <Box>
            <Header variant="h3">System Health</Header>
            <SpaceBetween direction="vertical" size="m">
              <div>
                <Box variant="awsui-key-label">System Uptime</Box>
                <ProgressBar
                  value={stats.systemUptime}
                  additionalInfo={`${stats.systemUptime}%`}
                  description="Last 30 days"
                  status="success"
                />
              </div>
              <div>
                <Box variant="awsui-key-label">Error Rate</Box>
                <ProgressBar
                  value={stats.errorRate}
                  additionalInfo={`${stats.errorRate}%`}
                  description="Last 24 hours"
                  status="success"
                />
              </div>
              <div>
                <Box variant="awsui-key-label">API Response Time</Box>
                <ProgressBar
                  value={85}
                  additionalInfo="1.8s avg"
                  description="Target: < 2s"
                  status="success"
                />
              </div>
            </SpaceBetween>
          </Box>

          <Box>
            <Header variant="h3">Usage Statistics</Header>
            {loading ? (
              <Box textAlign="center" padding="l">
                <StatusIndicator type="loading">Loading chart data...</StatusIndicator>
              </Box>
            ) : (
              <LineChart
                series={[
                  {
                    title: "Messages per Hour",
                    type: "line",
                    data: chartData.map(item => ({ x: item.x, y: item.y }))
                  }
                ]}
                xDomain={chartData.map(item => item.x)}
                yDomain={[0, Math.max(...chartData.map(item => item.y)) + 20]}
                i18nStrings={{
                  filterLabel: "Filter displayed data",
                  filterPlaceholder: "Filter data",
                  filterSelectedAriaLabel: "selected",
                  legendAriaLabel: "Legend",
                  chartAriaRoleDescription: "line chart"
                }}
                ariaLabel="Messages processed per hour"
                height={300}
              />
            )}
          </Box>
        </ColumnLayout>

        {/* Agent Performance Table */}
        <Box>
          <Header variant="h2">Agent Performance</Header>
          <Table
            items={agentPerformance}
            columnDefinitions={[
              {
                id: 'name',
                header: 'Agent Name',
                cell: item => (
                  <SpaceBetween direction="horizontal" size="s">
                    <span>🤖</span>
                    <strong>{item.name}</strong>
                  </SpaceBetween>
                ),
                sortingField: 'name'
              },
              {
                id: 'requests',
                header: 'Requests',
                cell: item => item.requests.toLocaleString(),
                sortingField: 'requests'
              },
              {
                id: 'responseTime',
                header: 'Avg Response Time',
                cell: item => `${item.avgResponseTime}s`,
                sortingField: 'avgResponseTime'
              },
              {
                id: 'successRate',
                header: 'Success Rate',
                cell: item => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <span>{item.successRate}%</span>
                    <StatusIndicator type={item.successRate > 98 ? 'success' : 'warning'} />
                  </SpaceBetween>
                ),
                sortingField: 'successRate'
              },
              {
                id: 'status',
                header: 'Status',
                cell: item => (
                  <StatusIndicator type={item.status === 'active' ? 'success' : 'stopped'}>
                    {item.status}
                  </StatusIndicator>
                ),
                sortingField: 'status'
              }
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No agents found</b>
              </Box>
            }
            header={
              <Header counter={`(${agentPerformance.length})`}>
                Agent Performance Metrics
              </Header>
            }
          />
        </Box>

        {/* Recent Activity */}
        <Box>
          <Header variant="h2">Recent Activity</Header>
          <Table
            items={recentActivities}
            columnDefinitions={[
              {
                id: 'type',
                header: 'Type',
                cell: item => {
                  const icons = {
                    chat: '💬',
                    agent: '🤖',
                    system: '⚙️',
                    error: '⚠️'
                  };
                  return (
                    <SpaceBetween direction="horizontal" size="s">
                      <span>{icons[item.type as keyof typeof icons]}</span>
                      <Badge color={
                        item.type === 'error' ? 'red' : 
                        item.type === 'system' ? 'blue' : 'green'
                      }>
                        {item.type}
                      </Badge>
                    </SpaceBetween>
                  );
                }
              },
              {
                id: 'message',
                header: 'Activity',
                cell: item => item.message
              },
              {
                id: 'timestamp',
                header: 'Time',
                cell: item => item.timestamp
              },
              {
                id: 'status',
                header: 'Status',
                cell: item => (
                  <StatusIndicator 
                    type={
                      item.status === 'success' ? 'success' : 
                      item.status === 'warning' ? 'warning' : 'info'
                    }
                  >
                    {item.status}
                  </StatusIndicator>
                )
              }
            ]}
            header={
              <Header counter={`(${recentActivities.length})`}>
                Recent System Activity
              </Header>
            }
          />
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default Dashboard;
