import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  Button,
  SpaceBetween,
  Grid,
  Box,
  StatusIndicator,
  KeyValuePairs,
  ExpandableSection,
  Icon
} from '@cloudscape-design/components';

import { checkSystemHealth } from '../services/api';

const SystemStatus = ({ onNotification, systemStatus }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  // Refresh system status
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await checkSystemHealth();
      setHealthData(response);
      setLastChecked(new Date());
      
      if (response.status === 'healthy') {
        onNotification({
          type: 'success',
          content: 'Hệ thống hoạt động bình thường!',
          dismissible: true
        });
      } else {
        onNotification({
          type: 'warning',
          content: 'Hệ thống có một số vấn đề!',
          dismissible: true
        });
      }
    } catch (error) {
      console.error('Health check error:', error);
      onNotification({
        type: 'error',
        content: 'Không thể kiểm tra trạng thái hệ thống!',
        dismissible: true
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh on component mount
  useEffect(() => {
    handleRefreshStatus();
  }, []);

  // Get status indicator type
  const getStatusType = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'pending';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'healthy':
        return 'Hoạt động bình thường';
      case 'error':
        return 'Có lỗi xảy ra';
      case 'warning':
        return 'Cảnh báo';
      default:
        return 'Đang kiểm tra...';
    }
  };

  // Service status cards
  const ServiceStatusCard = ({ title, status, description, icon }) => (
    <Box
      padding="l"
      backgroundColor="background-container-content"
      borderRadius="s"
    >
      <SpaceBetween direction="vertical" size="s">
        <Box display="flex" alignItems="center">
          <Icon name={icon} size="large" />
          <Box marginLeft="s">
            <Box variant="h3">{title}</Box>
          </Box>
        </Box>
        <StatusIndicator type={getStatusType(status)}>
          {getStatusText(status)}
        </StatusIndicator>
        {description && (
          <Box variant="small" color="text-body-secondary">
            {description}
          </Box>
        )}
      </SpaceBetween>
    </Box>
  );

  return (
    <SpaceBetween direction="vertical" size="l">
      <Header
        variant="h1"
        description="Giám sát trạng thái và hiệu suất của hệ thống AI"
        actions={
          <Button
            variant="primary"
            onClick={handleRefreshStatus}
            loading={isRefreshing}
            iconName="refresh"
          >
            Làm mới trạng thái
          </Button>
        }
      >
        Trạng thái hệ thống
      </Header>

      {/* Overall System Status */}
      <Container>
        <SpaceBetween direction="vertical" size="m">
          <Box display="flex" alignItems="center">
            <Box marginRight="m">
              <StatusIndicator type={getStatusType(systemStatus)} size="large">
                Trạng thái tổng thể: {getStatusText(systemStatus)}
              </StatusIndicator>
            </Box>
            {lastChecked && (
              <Box variant="small" color="text-body-secondary">
                Kiểm tra lần cuối: {lastChecked.toLocaleString('vi-VN')}
              </Box>
            )}
          </Box>
        </SpaceBetween>
      </Container>

      {/* Service Status Cards */}
      <Container header={<Header variant="h2">Trạng thái các dịch vụ</Header>}>
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 6, s: 3 } },
            { colspan: { default: 12, xs: 6, s: 3 } },
            { colspan: { default: 12, xs: 6, s: 3 } },
            { colspan: { default: 12, xs: 6, s: 3 } }
          ]}
        >
          <ServiceStatusCard
            title="Backend API"
            status={systemStatus}
            description="FastAPI server với các endpoint chính"
            icon="status-positive"
          />
          <ServiceStatusCard
            title="AWS Bedrock"
            status={healthData?.features?.text_summary ? 'healthy' : 'error'}
            description="Claude 3.7 Sonnet AI model"
            icon="status-positive"
          />
          <ServiceStatusCard
            title="DynamoDB"
            status={healthData?.features?.knowledge_base ? 'healthy' : 'error'}
            description="Cơ sở dữ liệu NoSQL"
            icon="status-positive"
          />
          <ServiceStatusCard
            title="MongoDB"
            status={systemStatus === 'healthy' ? 'healthy' : 'error'}
            description="Cơ sở dữ liệu tài liệu"
            icon="status-positive"
          />
        </Grid>
      </Container>

      {/* System Information */}
      <Container>
        <ExpandableSection headerText="Thông tin chi tiết hệ thống" defaultExpanded>
          <KeyValuePairs
            columns={2}
            items={[
              {
                label: 'Phiên bản API',
                value: healthData?.version || '1.0.0'
              },
              {
                label: 'Model AI',
                value: 'Claude 3.7 Sonnet'
              },
              {
                label: 'Vùng AWS',
                value: 'us-east-1'
              },
              {
                label: 'Ngôn ngữ hỗ trợ',
                value: 'Tiếng Việt, English'
              },
              {
                label: 'Định dạng file',
                value: 'TXT, PDF, DOCX, DOC'
              },
              {
                label: 'Kích thước file tối đa',
                value: '10MB'
              },
              {
                label: 'Thời gian phản hồi trung bình',
                value: '< 5 giây'
              },
              {
                label: 'Uptime',
                value: healthData?.timestamp ? 
                  `${Math.floor((Date.now() - healthData.timestamp * 1000) / 1000 / 60)} phút` : 
                  'N/A'
              }
            ]}
          />
        </ExpandableSection>
      </Container>

      {/* Feature Status */}
      {healthData?.features && (
        <Container header={<Header variant="h2">Tính năng hệ thống</Header>}>
          <Grid
            gridDefinition={[
              { colspan: { default: 12, xs: 4 } },
              { colspan: { default: 12, xs: 4 } },
              { colspan: { default: 12, xs: 4 } }
            ]}
          >
            <Box
              padding="m"
              backgroundColor="background-container-content"
              borderRadius="s"
            >
              <SpaceBetween direction="vertical" size="s">
                <Box display="flex" alignItems="center">
                  <Icon name="file-text" />
                  <Box marginLeft="s" variant="h4">Tóm tắt văn bản</Box>
                </Box>
                <StatusIndicator 
                  type={healthData.features.text_summary ? 'success' : 'error'}
                >
                  {healthData.features.text_summary ? 'Hoạt động' : 'Không khả dụng'}
                </StatusIndicator>
              </SpaceBetween>
            </Box>

            <Box
              padding="m"
              backgroundColor="background-container-content"
              borderRadius="s"
            >
              <SpaceBetween direction="vertical" size="s">
                <Box display="flex" alignItems="center">
                  <Icon name="upload" />
                  <Box marginLeft="s" variant="h4">S3 Integration</Box>
                </Box>
                <StatusIndicator 
                  type={healthData.features.s3_integration ? 'success' : 'error'}
                >
                  {healthData.features.s3_integration ? 'Hoạt động' : 'Không khả dụng'}
                </StatusIndicator>
              </SpaceBetween>
            </Box>

            <Box
              padding="m"
              backgroundColor="background-container-content"
              borderRadius="s"
            >
              <SpaceBetween direction="vertical" size="s">
                <Box display="flex" alignItems="center">
                  <Icon name="search" />
                  <Box marginLeft="s" variant="h4">Knowledge Base</Box>
                </Box>
                <StatusIndicator 
                  type={healthData.features.knowledge_base ? 'success' : 'error'}
                >
                  {healthData.features.knowledge_base ? 'Hoạt động' : 'Không khả dụng'}
                </StatusIndicator>
              </SpaceBetween>
            </Box>
          </Grid>
        </Container>
      )}
    </SpaceBetween>
  );
};

export default SystemStatus;
