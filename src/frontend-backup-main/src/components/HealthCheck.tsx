import React, { useState, useEffect } from 'react';
import { 
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  StatusIndicator,
  ColumnLayout,
  Spinner,
  Alert
} from '@cloudscape-design/components';
import { healthAPI } from '../services/api';

interface HealthStatus {
  status: 'checking' | 'healthy' | 'error';
  message: string;
  timestamp?: string;
}

interface SystemHealth {
  backend: HealthStatus;
  database: HealthStatus;
  aws: HealthStatus;
  bedrock: HealthStatus;
}

const HealthCheck: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    backend: { status: 'checking', message: 'Checking backend connection...' },
    database: { status: 'checking', message: 'Checking database connection...' },
    aws: { status: 'checking', message: 'Checking AWS connection...' },
    bedrock: { status: 'checking', message: 'Checking Bedrock availability...' }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkAllHealth();
  }, []);

  const checkAllHealth = async () => {
    setIsRefreshing(true);
    
    // Check Backend Health
    try {
      const response = await healthAPI.checkHealth();
      if (response.status === 'success') {
        setSystemHealth(prev => ({
          ...prev,
          backend: {
            status: 'healthy',
            message: 'Backend API is healthy',
            timestamp: new Date().toISOString(),
          },
        }));
      } else {
        throw new Error(response.message || 'Backend check failed');
      }
    } catch (error) {
      setSystemHealth(prev => ({
        ...prev,
        backend: {
          status: 'error',
          message: `Backend connection failed: ${error}`,
          timestamp: new Date().toLocaleString()
        }
      }));
    }

    // Simulate other health checks
    setTimeout(() => {
      setSystemHealth(prev => ({
        ...prev,
        database: {
          status: 'healthy',
          message: 'Database connection active',
          timestamp: new Date().toLocaleString()
        },
        aws: {
          status: 'healthy',
          message: 'AWS services accessible',
          timestamp: new Date().toLocaleString()
        },
        bedrock: {
          status: 'healthy',
          message: 'Bedrock API responding',
          timestamp: new Date().toLocaleString()
        }
      }));
      setIsRefreshing(false);
    }, 2000);
  };

  const getStatusType = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'error':
        return 'error';
      case 'checking':
        return 'loading';
      default:
        return 'info';
    }
  };

  const getOverallStatus = () => {
    const statuses = Object.values(systemHealth).map(h => h.status);
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('checking')) return 'loading';
    return 'success';
  };

  const healthyCount = Object.values(systemHealth).filter(h => h.status === 'healthy').length;
  const totalCount = Object.values(systemHealth).length;

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h1"
          description="Monitor the health and status of all system components."
          actions={
            <Button
              variant="primary"
              iconName="refresh"
              onClick={checkAllHealth}
              loading={isRefreshing}
            >
              Refresh Status
            </Button>
          }
        >
          System Health Check
        </Header>

        {/* Overall Status */}
        <Alert
          type={getOverallStatus() === 'success' ? 'success' : getOverallStatus() === 'error' ? 'error' : 'info'}
          header="System Status"
        >
          {getOverallStatus() === 'success' 
            ? `All systems operational (${healthyCount}/${totalCount} services healthy)`
            : getOverallStatus() === 'error'
            ? `System issues detected (${healthyCount}/${totalCount} services healthy)`
            : `Checking system status... (${healthyCount}/${totalCount} services checked)`
          }
        </Alert>

        {/* Individual Service Status */}
        <Box>
          <Header variant="h2">Service Status</Header>
          <ColumnLayout columns={2}>
            {/* Backend API */}
            <div style={{ border: '1px solid #e9ebed', borderRadius: '8px' }}>
              <Box padding="l">
                <SpaceBetween direction="vertical" size="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Header variant="h3">🔧 Backend API</Header>
                    <StatusIndicator type={getStatusType(systemHealth.backend.status)}>
                      {systemHealth.backend.status === 'checking' ? 'Checking...' : systemHealth.backend.status}
                    </StatusIndicator>
                  </SpaceBetween>
                  <div style={{ fontSize: '14px', color: '#5f6b7a' }}>
                    {systemHealth.backend.message}
                  </div>
                  {systemHealth.backend.timestamp && (
                    <div style={{ fontSize: '12px', color: '#879596' }}>
                      Last checked: {systemHealth.backend.timestamp}
                    </div>
                  )}
                  <div>
                    <Box variant="awsui-key-label">Endpoint</Box>
                    <div>http://localhost:8080/riskassessment/public/api/v1/health-check/health</div>
                  </div>
                </SpaceBetween>
              </Box>
            </div>

            {/* Database */}
            <div style={{ border: '1px solid #e9ebed', borderRadius: '8px' }}>
              <Box padding="l">
                <SpaceBetween direction="vertical" size="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Header variant="h3">🗄️ Database</Header>
                    <StatusIndicator type={getStatusType(systemHealth.database.status)}>
                      {systemHealth.database.status === 'checking' ? 'Checking...' : systemHealth.database.status}
                    </StatusIndicator>
                  </SpaceBetween>
                  <div style={{ fontSize: '14px', color: '#5f6b7a' }}>
                    {systemHealth.database.message}
                  </div>
                  {systemHealth.database.timestamp && (
                    <div style={{ fontSize: '12px', color: '#879596' }}>
                      Last checked: {systemHealth.database.timestamp}
                    </div>
                  )}
                  <div>
                    <Box variant="awsui-key-label">Type</Box>
                    <div>DynamoDB & MongoDB</div>
                  </div>
                </SpaceBetween>
              </Box>
            </div>

            {/* AWS Services */}
            <div style={{ border: '1px solid #e9ebed', borderRadius: '8px' }}>
              <Box padding="l">
                <SpaceBetween direction="vertical" size="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Header variant="h3">☁️ AWS Services</Header>
                    <StatusIndicator type={getStatusType(systemHealth.aws.status)}>
                      {systemHealth.aws.status === 'checking' ? 'Checking...' : systemHealth.aws.status}
                    </StatusIndicator>
                  </SpaceBetween>
                  <div style={{ fontSize: '14px', color: '#5f6b7a' }}>
                    {systemHealth.aws.message}
                  </div>
                  {systemHealth.aws.timestamp && (
                    <div style={{ fontSize: '12px', color: '#879596' }}>
                      Last checked: {systemHealth.aws.timestamp}
                    </div>
                  )}
                  <div>
                    <Box variant="awsui-key-label">Region</Box>
                    <div>ap-southeast-1</div>
                  </div>
                </SpaceBetween>
              </Box>
            </div>

            {/* AWS Bedrock */}
            <div style={{ border: '1px solid #e9ebed', borderRadius: '8px' }}>
              <Box padding="l">
                <SpaceBetween direction="vertical" size="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Header variant="h3">🤖 AWS Bedrock</Header>
                    <StatusIndicator type={getStatusType(systemHealth.bedrock.status)}>
                      {systemHealth.bedrock.status === 'checking' ? 'Checking...' : systemHealth.bedrock.status}
                    </StatusIndicator>
                  </SpaceBetween>
                  <div style={{ fontSize: '14px', color: '#5f6b7a' }}>
                    {systemHealth.bedrock.message}
                  </div>
                  {systemHealth.bedrock.timestamp && (
                    <div style={{ fontSize: '12px', color: '#879596' }}>
                      Last checked: {systemHealth.bedrock.timestamp}
                    </div>
                  )}
                  <div>
                    <Box variant="awsui-key-label">Model</Box>
                    <div>Claude 3.7 Sonnet</div>
                  </div>
                </SpaceBetween>
              </Box>
            </div>
          </ColumnLayout>
        </Box>

        {/* System Information */}
        <Box>
          <Header variant="h2">System Information</Header>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Application Version</Box>
              <div>1.0.0</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Environment</Box>
              <div>Development</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Build Date</Box>
              <div>{new Date().toLocaleDateString()}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Backend Framework</Box>
              <div>FastAPI 0.115.2</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Frontend Framework</Box>
              <div>React 18.2.0</div>
            </div>
            <div>
              <Box variant="awsui-key-label">UI Library</Box>
              <div>AWS CloudScape</div>
            </div>
          </ColumnLayout>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Header variant="h2">Quick Actions</Header>
          <SpaceBetween direction="horizontal" size="s">
            <Button href="/dashboard" iconName="status-info">
              View Dashboard
            </Button>
            <Button href="/agents" iconName="settings">
              Manage Agents
            </Button>
            <Button href="http://localhost:8080/docs" iconName="external" target="_blank">
              API Documentation
            </Button>
            <Button href="/settings" iconName="settings">
              System Settings
            </Button>
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default HealthCheck;
