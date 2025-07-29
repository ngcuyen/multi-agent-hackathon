import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  Box,
  Button,
  Alert,
  StatusIndicator,
  ColumnLayout,
  Cards,
  Badge,
  Table,
  Modal,
  Form,
  FormField,
  Input,
  Select,
  Toggle,
  LineChart,
  BarChart,
  PieChart,
  KeyValuePairs,
  ProgressBar,
  DatePicker
} from '@cloudscape-design/components';

interface RiskAnalyticsDashboardProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

interface RiskMonitoring {
  entity_id: string;
  status: 'active' | 'inactive' | 'alert';
  last_score: number;
  alerts: RiskAlert[];
}

interface RiskAlert {
  time: string;
  type: 'credit' | 'market' | 'operational' | 'liquidity';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RiskHistory {
  entity_id: string;
  history: Array<{
    date: string;
    score: number;
  }>;
}

interface MarketData {
  stock_price: number;
  exchange_rate: number;
  interest_rate?: number;
  inflation_rate?: number;
  timestamp: string;
}

interface EntityMonitoring {
  entity_id: string;
  entity_name: string;
  entity_type: 'individual' | 'corporate';
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  last_updated: string;
  monitoring_status: 'active' | 'paused' | 'stopped';
}

const RiskAnalyticsDashboard: React.FC<RiskAnalyticsDashboardProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [monitoringEntities, setMonitoringEntities] = useState<EntityMonitoring[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [riskHistory, setRiskHistory] = useState<RiskHistory | null>(null);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [entityModalVisible, setEntityModalVisible] = useState(false);

  // Alert Configuration Form
  const [alertForm, setAlertForm] = useState({
    entity_id: '',
    alert_type: 'credit' as 'credit' | 'market' | 'operational' | 'liquidity',
    threshold: 70,
    enabled: true
  });

  // Entity Monitoring Form
  const [entityForm, setEntityForm] = useState({
    entity_id: '',
    entity_name: '',
    entity_type: 'corporate' as 'individual' | 'corporate',
    monitoring_enabled: true
  });

  // Load data on component mount
  useEffect(() => {
    loadMarketData();
    loadMonitoringEntities();
    loadAlerts();
    
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadMarketData();
      if (selectedEntity) {
        loadRiskHistory(selectedEntity);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedEntity]);

  const loadMarketData = async () => {
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/risk/market-data');
      const data = await response.json();
      setMarketData(data.data);
    } catch (error) {
      onShowSnackbar('Lỗi khi tải dữ liệu thị trường', 'error');
    }
  };

  const loadMonitoringEntities = async () => {
    // Mock data since we don't have a specific endpoint for this
    const mockEntities: EntityMonitoring[] = [
      {
        entity_id: 'ABC-COMPANY-001',
        entity_name: 'ABC Company Ltd',
        entity_type: 'corporate',
        risk_score: 68,
        risk_level: 'medium',
        last_updated: new Date().toISOString(),
        monitoring_status: 'active'
      },
      {
        entity_id: 'XYZ-CORP-002',
        entity_name: 'XYZ Corporation',
        entity_type: 'corporate',
        risk_score: 45,
        risk_level: 'low',
        last_updated: new Date(Date.now() - 3600000).toISOString(),
        monitoring_status: 'active'
      },
      {
        entity_id: 'DEF-LTD-003',
        entity_name: 'DEF Limited',
        entity_type: 'corporate',
        risk_score: 82,
        risk_level: 'high',
        last_updated: new Date(Date.now() - 1800000).toISOString(),
        monitoring_status: 'active'
      }
    ];
    setMonitoringEntities(mockEntities);
  };

  const loadRiskHistory = async (entityId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/mutil_agent/api/v1/risk/score/history/${entityId}`);
      const data = await response.json();
      setRiskHistory(data);
    } catch (error) {
      onShowSnackbar('Lỗi khi tải lịch sử rủi ro', 'error');
    }
  };

  const loadAlerts = async () => {
    // Mock alerts data
    const mockAlerts: RiskAlert[] = [
      {
        time: new Date().toISOString(),
        type: 'credit',
        message: 'Điểm tín dụng của ABC Company giảm xuống dưới ngưỡng cảnh báo',
        severity: 'high'
      },
      {
        time: new Date(Date.now() - 3600000).toISOString(),
        type: 'market',
        message: 'Biến động tỷ giá USD/VND vượt quá 2%',
        severity: 'medium'
      },
      {
        time: new Date(Date.now() - 7200000).toISOString(),
        type: 'operational',
        message: 'Phát hiện giao dịch bất thường tại XYZ Corporation',
        severity: 'critical'
      }
    ];
    setAlerts(mockAlerts);
  };

  const handleEntitySelection = (entityId: string) => {
    setSelectedEntity(entityId);
    if (entityId) {
      loadRiskHistory(entityId);
    }
  };

  const handleAlertConfiguration = async () => {
    if (!alertForm.entity_id) {
      onShowSnackbar('Vui lòng chọn entity', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/risk/alert/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: alertForm.entity_id,
          alert_type: alertForm.alert_type,
          threshold: alertForm.threshold,
          enabled: alertForm.enabled
        }),
      });

      if (response.ok) {
        onShowSnackbar('Cấu hình cảnh báo thành công', 'success');
        setAlertModalVisible(false);
        setAlertForm({ entity_id: '', alert_type: 'credit', threshold: 70, enabled: true });
      } else {
        throw new Error('Alert configuration failed');
      }
    } catch (error) {
      onShowSnackbar('Lỗi khi cấu hình cảnh báo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'blue';
      case 'medium': return 'blue';
      case 'high': return 'red';
      case 'critical': return 'red';
      default: return 'grey';
    }
  };

  const entityTableColumns = [
    {
      id: 'entity_name',
      header: 'Tên Entity',
      cell: (item: EntityMonitoring) => (
        <Box>
          <div><strong>{item.entity_name}</strong></div>
          <div style={{ fontSize: '0.85em', color: '#666' }}>{item.entity_id}</div>
        </Box>
      ),
      isRowHeader: true
    },
    {
      id: 'entity_type',
      header: 'Loại',
      cell: (item: EntityMonitoring) => (
        <Badge color={item.entity_type === 'corporate' ? 'blue' : 'green'}>
          {item.entity_type === 'corporate' ? 'Doanh nghiệp' : 'Cá nhân'}
        </Badge>
      )
    },
    {
      id: 'risk_score',
      header: 'Điểm rủi ro',
      cell: (item: EntityMonitoring) => (
        <Box>
          <ProgressBar
            value={item.risk_score}
            description={`${item.risk_score}/100`}
          />
        </Box>
      )
    },
    {
      id: 'risk_level',
      header: 'Mức độ rủi ro',
      cell: (item: EntityMonitoring) => (
        <StatusIndicator type={getRiskLevelColor(item.risk_level)}>
          {item.risk_level === 'low' ? 'Thấp' :
           item.risk_level === 'medium' ? 'Trung bình' :
           item.risk_level === 'high' ? 'Cao' : 'Nghiêm trọng'}
        </StatusIndicator>
      )
    },
    {
      id: 'monitoring_status',
      header: 'Trạng thái giám sát',
      cell: (item: EntityMonitoring) => (
        <StatusIndicator 
          type={item.monitoring_status === 'active' ? 'success' : 
                item.monitoring_status === 'paused' ? 'warning' : 'stopped'}
        >
          {item.monitoring_status === 'active' ? 'Đang giám sát' :
           item.monitoring_status === 'paused' ? 'Tạm dừng' : 'Dừng'}
        </StatusIndicator>
      )
    },
    {
      id: 'last_updated',
      header: 'Cập nhật cuối',
      cell: (item: EntityMonitoring) => new Date(item.last_updated).toLocaleString('vi-VN')
    }
  ];

  const alertTableColumns = [
    {
      id: 'time',
      header: 'Thời gian',
      cell: (item: RiskAlert) => new Date(item.time).toLocaleString('vi-VN'),
      isRowHeader: true
    },
    {
      id: 'type',
      header: 'Loại',
      cell: (item: RiskAlert) => (
        <Badge color="blue">
          {item.type === 'credit' ? 'Tín dụng' :
           item.type === 'market' ? 'Thị trường' :
           item.type === 'operational' ? 'Vận hành' : 'Thanh khoản'}
        </Badge>
      )
    },
    {
      id: 'severity',
      header: 'Mức độ',
      cell: (item: RiskAlert) => (
        <Badge color={getAlertSeverityColor(item.severity)}>
          {item.severity === 'low' ? 'Thấp' :
           item.severity === 'medium' ? 'Trung bình' :
           item.severity === 'high' ? 'Cao' : 'Nghiêm trọng'}
        </Badge>
      )
    },
    {
      id: 'message',
      header: 'Thông báo',
      cell: (item: RiskAlert) => item.message
    }
  ];

  const riskHistoryChartData = riskHistory?.history.map(item => ({
    x: new Date(item.date).toLocaleDateString('vi-VN'),
    y: item.score
  })) || [];

  const riskDistributionData = [
    { title: 'Thấp', value: monitoringEntities.filter(e => e.risk_level === 'low').length, color: '#1f77b4' },
    { title: 'Trung bình', value: monitoringEntities.filter(e => e.risk_level === 'medium').length, color: '#ff7f0e' },
    { title: 'Cao', value: monitoringEntities.filter(e => e.risk_level === 'high').length, color: '#d62728' },
    { title: 'Nghiêm trọng', value: monitoringEntities.filter(e => e.risk_level === 'critical').length, color: '#9467bd' }
  ];

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Giám sát và phân tích rủi ro theo thời gian thực"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                iconName="notification"
                onClick={() => setAlertModalVisible(true)}
              >
                Cấu hình cảnh báo
              </Button>
              <Button
                iconName="add-plus"
                onClick={() => setEntityModalVisible(true)}
              >
                Thêm Entity
              </Button>
              <Button
                iconName="refresh"
                onClick={() => {
                  loadMarketData();
                  loadMonitoringEntities();
                  loadAlerts();
                }}
              >
                Làm mới
              </Button>
            </SpaceBetween>
          }
        >
          📊 Risk Analytics Dashboard
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Market Data Overview */}
        {marketData && (
          <Container header={<Header variant="h2">Dữ liệu thị trường</Header>}>
            <ColumnLayout columns={4} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Giá cổ phiếu</Box>
                <Box variant="awsui-value-large">{marketData.stock_price?.toLocaleString()} VND</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Tỷ giá USD/VND</Box>
                <Box variant="awsui-value-large">{marketData.exchange_rate?.toLocaleString()}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Lãi suất</Box>
                <Box variant="awsui-value-large">{marketData.interest_rate || 'N/A'}%</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Cập nhật</Box>
                <Box variant="awsui-value-large">
                  {new Date(marketData.timestamp).toLocaleTimeString('vi-VN')}
                </Box>
              </div>
            </ColumnLayout>
          </Container>
        )}

        {/* Risk Overview Statistics */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Tổng Entities</Box>
            <Box variant="awsui-value-large">{monitoringEntities.length}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Đang giám sát</Box>
            <Box variant="awsui-value-large" color="text-status-success">
              {monitoringEntities.filter(e => e.monitoring_status === 'active').length}
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Cảnh báo cao</Box>
            <Box variant="awsui-value-large" color="text-status-error">
              {monitoringEntities.filter(e => e.risk_level === 'high' || e.risk_level === 'critical').length}
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Điểm rủi ro TB</Box>
            <Box variant="awsui-value-large">
              {monitoringEntities.length > 0 ? 
                (monitoringEntities.reduce((sum, e) => sum + e.risk_score, 0) / monitoringEntities.length).toFixed(1) : 
                '0'
              }
            </Box>
          </div>
        </ColumnLayout>

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'overview',
              label: 'Tổng quan',
              content: (
                <SpaceBetween size="l">
                  <ColumnLayout columns={2}>
                    <Container header={<Header variant="h2">Phân bố mức độ rủi ro</Header>}>
                      {riskDistributionData.some(d => d.value > 0) && (
                        <PieChart
                          data={riskDistributionData}
                          detailPopoverContent={(datum, sum) => [
                            { key: "Mức độ", value: datum.title },
                            { key: "Số lượng", value: datum.value },
                            {
                              key: "Tỷ lệ",
                              value: `${((datum.value / sum) * 100).toFixed(1)}%`
                            }
                          ]}
                          ariaDescription="Biểu đồ phân bố mức độ rủi ro"
                          ariaLabel="Risk distribution pie chart"
                        />
                      )}
                    </Container>

                    <Container header={<Header variant="h2">Lịch sử điểm rủi ro</Header>}>
                      <FormField label="Chọn Entity">
                        <Select
                          selectedOption={
                            selectedEntity
                              ? { 
                                  label: monitoringEntities.find(e => e.entity_id === selectedEntity)?.entity_name || '', 
                                  value: selectedEntity 
                                }
                              : null
                          }
                          onChange={({ detail }) => handleEntitySelection(detail.selectedOption?.value || '')}
                          options={monitoringEntities.map(entity => ({
                            label: entity.entity_name,
                            value: entity.entity_id
                          }))}
                          placeholder="Chọn entity để xem lịch sử"
                        />
                      </FormField>

                      {riskHistoryChartData.length > 0 && (
                        <LineChart
                          series={[
                            {
                              title: "Điểm rủi ro",
                              type: "line",
                              data: riskHistoryChartData
                            }
                          ]}
                          xTitle="Ngày"
                          yTitle="Điểm rủi ro"
                          yDomain={[0, 100]}
                          ariaLabel="Risk score history chart"
                          errorText="Error loading data."
                          loadingText="Loading chart"
                          recoveryText="Retry"
                        />
                      )}
                    </Container>
                  </ColumnLayout>

                  {/* Recent Alerts */}
                  <Container header={<Header variant="h2">Cảnh báo gần đây</Header>}>
                    <Table
                      columnDefinitions={alertTableColumns}
                      items={alerts.slice(0, 5)}
                      loading={loading}
                      loadingText="Đang tải cảnh báo..."
                      variant="embedded"
                      empty={
                        <Box textAlign="center" color="inherit">
                          <b>Không có cảnh báo nào</b>
                          <Box variant="p" color="inherit">
                            Hiện tại không có cảnh báo rủi ro nào.
                          </Box>
                        </Box>
                      }
                    />
                  </Container>
                </SpaceBetween>
              )
            },
            {
              id: 'monitoring',
              label: 'Giám sát Entities',
              content: (
                <Table
                  columnDefinitions={entityTableColumns}
                  items={monitoringEntities}
                  loading={loading}
                  loadingText="Đang tải entities..."
                  selectionType="single"
                  onSelectionChange={({ detail }) => {
                    const selected = detail.selectedItems[0];
                    if (selected) {
                      handleEntitySelection(selected.entity_id);
                    }
                  }}
                  header={
                    <Header
                      counter={`(${monitoringEntities.length})`}
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            disabled={!selectedEntity}
                            onClick={() => {
                              setAlertForm({ ...alertForm, entity_id: selectedEntity });
                              setAlertModalVisible(true);
                            }}
                          >
                            Cấu hình cảnh báo
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => setEntityModalVisible(true)}
                          >
                            Thêm Entity
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      Danh sách Entities đang giám sát
                    </Header>
                  }
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>Không có entity nào</b>
                      <Box variant="p" color="inherit">
                        Chưa có entity nào được thêm vào hệ thống giám sát.
                      </Box>
                    </Box>
                  }
                />
              )
            },
            {
              id: 'alerts',
              label: 'Quản lý cảnh báo',
              content: (
                <Table
                  columnDefinitions={alertTableColumns}
                  items={alerts}
                  loading={loading}
                  loadingText="Đang tải cảnh báo..."
                  header={
                    <Header
                      counter={`(${alerts.length})`}
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            variant="primary"
                            onClick={() => setAlertModalVisible(true)}
                          >
                            Cấu hình cảnh báo mới
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      Lịch sử cảnh báo
                    </Header>
                  }
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>Không có cảnh báo nào</b>
                      <Box variant="p" color="inherit">
                        Hiện tại không có cảnh báo rủi ro nào.
                      </Box>
                    </Box>
                  }
                />
              )
            }
          ]}
        />

        {/* Alert Configuration Modal */}
        <Modal
          onDismiss={() => setAlertModalVisible(false)}
          visible={alertModalVisible}
          closeAriaLabel="Close modal"
          size="medium"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setAlertModalVisible(false)}>
                  Hủy
                </Button>
                <Button variant="primary" loading={loading} onClick={handleAlertConfiguration}>
                  Lưu cấu hình
                </Button>
              </SpaceBetween>
            </Box>
          }
          header="Cấu hình cảnh báo rủi ro"
        >
          <Form>
            <SpaceBetween size="m">
              <FormField label="Chọn Entity">
                <Select
                  selectedOption={
                    alertForm.entity_id
                      ? { 
                          label: monitoringEntities.find(e => e.entity_id === alertForm.entity_id)?.entity_name || '', 
                          value: alertForm.entity_id 
                        }
                      : null
                  }
                  onChange={({ detail }) =>
                    setAlertForm({ ...alertForm, entity_id: detail.selectedOption?.value || '' })
                  }
                  options={monitoringEntities.map(entity => ({
                    label: entity.entity_name,
                    value: entity.entity_id
                  }))}
                  placeholder="Chọn entity"
                />
              </FormField>

              <FormField label="Loại cảnh báo">
                <Select
                  selectedOption={{ label: alertForm.alert_type, value: alertForm.alert_type }}
                  onChange={({ detail }) =>
                    setAlertForm({ ...alertForm, alert_type: detail.selectedOption?.value as any || 'credit' })
                  }
                  options={[
                    { label: 'Tín dụng', value: 'credit' },
                    { label: 'Thị trường', value: 'market' },
                    { label: 'Vận hành', value: 'operational' },
                    { label: 'Thanh khoản', value: 'liquidity' }
                  ]}
                />
              </FormField>

              <FormField label="Ngưỡng cảnh báo">
                <Input
                  type="number"
                  value={alertForm.threshold.toString()}
                  onChange={({ detail }) => {
                    const value = parseInt(detail.value) || 70;
                    const clampedValue = Math.min(Math.max(value, 0), 100);
                    setAlertForm({ ...alertForm, threshold: clampedValue });
                  }}
                />
              </FormField>

              <FormField label="Kích hoạt cảnh báo">
                <Toggle
                  checked={alertForm.enabled}
                  onChange={({ detail }) =>
                    setAlertForm({ ...alertForm, enabled: detail.checked })
                  }
                >
                  {alertForm.enabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                </Toggle>
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

        {/* Entity Modal */}
        <Modal
          onDismiss={() => setEntityModalVisible(false)}
          visible={entityModalVisible}
          closeAriaLabel="Close modal"
          size="medium"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setEntityModalVisible(false)}>
                  Hủy
                </Button>
                <Button variant="primary" loading={loading}>
                  Thêm Entity
                </Button>
              </SpaceBetween>
            </Box>
          }
          header="Thêm Entity vào giám sát"
        >
          <Form>
            <SpaceBetween size="m">
              <FormField label="Entity ID">
                <Input
                  value={entityForm.entity_id}
                  onChange={({ detail }) =>
                    setEntityForm({ ...entityForm, entity_id: detail.value })
                  }
                  placeholder="VD: ABC-COMPANY-001"
                />
              </FormField>

              <FormField label="Tên Entity">
                <Input
                  value={entityForm.entity_name}
                  onChange={({ detail }) =>
                    setEntityForm({ ...entityForm, entity_name: detail.value })
                  }
                  placeholder="VD: ABC Company Ltd"
                />
              </FormField>

              <FormField label="Loại Entity">
                <Select
                  selectedOption={{ label: entityForm.entity_type === 'corporate' ? 'Doanh nghiệp' : 'Cá nhân', value: entityForm.entity_type }}
                  onChange={({ detail }) =>
                    setEntityForm({ ...entityForm, entity_type: detail.selectedOption?.value as any || 'corporate' })
                  }
                  options={[
                    { label: 'Doanh nghiệp', value: 'corporate' },
                    { label: 'Cá nhân', value: 'individual' }
                  ]}
                />
              </FormField>

              <FormField label="Kích hoạt giám sát">
                <Toggle
                  checked={entityForm.monitoring_enabled}
                  onChange={({ detail }) =>
                    setEntityForm({ ...entityForm, monitoring_enabled: detail.checked })
                  }
                >
                  {entityForm.monitoring_enabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                </Toggle>
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </SpaceBetween>
    </Container>
  );
};

export default RiskAnalyticsDashboard;
