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
  KeyValuePairs,
  LineChart,
  BarChart,
  PieChart,
  Table,
  Modal,
  FormField,
  Select,
  Input,
  Tabs,
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';
import { mockApiService } from '../../services/mockApiService';
import { mockData } from '../../data/mockData';
import DemoGuide from '../../components/DemoGuide/DemoGuide';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';

const MockHomePage: React.FC<{ onShowSnackbar: (message: string, type: string) => void }> = ({ onShowSnackbar }) => {
  const navigate = useNavigate();
  
  // State management
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [coordinationHistory, setCoordinationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    taskType: { value: 'document_processing' },
    priority: { value: 'medium' },
    description: '',
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load system health
        const healthResponse = await mockApiService.getSystemHealth();
        if (healthResponse.status === 'success') {
          setSystemHealth(healthResponse.data);
        }

        // Load agent status
        const agentResponse = await mockApiService.getAgentStatus();
        if (agentResponse.status === 'success') {
          setAgentStatus(agentResponse.data);
        }

        // Load performance history
        setPerformanceHistory(mockApiService.getPerformanceHistory());
        
        // Load coordination history
        setCoordinationHistory(mockApiService.getCoordinationHistory());

        onShowSnackbar('Dữ liệu hệ thống đã được tải thành công', 'success');
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Không thể tải dữ liệu hệ thống');
        onShowSnackbar('Lỗi khi tải dữ liệu hệ thống', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [onShowSnackbar]);

  // Calculate system metrics
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
        description: `Version: ${systemHealth.version || 'N/A'}`,
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
        label: 'Total Tasks',
        value: agentStatus.agents?.reduce((sum: number, agent: any) => sum + (agent.total_tasks || 0), 0) || 0,
        type: 'info',
        description: 'Completed tasks',
      },
    ];
  }, [systemHealth, agentStatus]);

  // Handle task coordination
  const handleCoordinateAgents = async (taskType: string, priority: string = 'medium') => {
    try {
      const response = await mockApiService.coordinateAgents(taskType, priority);
      if (response.status === 'success') {
        onShowSnackbar(response.data?.message || 'Task coordination successful', 'success');
        
        // Refresh data
        const agentResponse = await mockApiService.getAgentStatus();
        if (agentResponse.status === 'success') {
          setAgentStatus(agentResponse.data);
        }
        setCoordinationHistory(mockApiService.getCoordinationHistory());
      } else {
        throw new Error(response.error?.message || 'Coordination failed');
      }
    } catch (error) {
      console.error('Coordination error:', error);
      onShowSnackbar('Lỗi khi phối hợp agents', 'error');
    }
  };

  // Handle task assignment
  const handleAssignTask = async () => {
    if (!selectedAgent) {
      onShowSnackbar('Vui lòng chọn agent', 'error');
      return;
    }

    try {
      const response = await mockApiService.assignTask(selectedAgent, {
        type: taskForm.taskType.value,
        priority: taskForm.priority.value,
        description: taskForm.description
      });

      if (response.status === 'success') {
        onShowSnackbar(`Task assigned to ${selectedAgent}`, 'success');
        setShowTaskModal(false);
        
        // Refresh agent data
        const agentResponse = await mockApiService.getAgentStatus();
        if (agentResponse.status === 'success') {
          setAgentStatus(agentResponse.data);
        }
      } else {
        throw new Error(response.error?.message || 'Task assignment failed');
      }
    } catch (error) {
      console.error('Task assignment error:', error);
      onShowSnackbar('Lỗi khi giao task', 'error');
    }
  };

  // Prepare chart data
  const loadDistributionData = agentStatus?.agents?.map((agent: any) => ({
    title: agent.name,
    value: agent.load_percentage || 0,
  })) || [];

  const performanceChartSeries = agentStatus?.agents?.map((agent: any) => ({
    title: agent.name,
    type: 'line' as const,
    data: performanceHistory.map(point => ({
      x: point.x,
      y: point[agent.agent_id] || 0,
    })),
  })) || [];

  const taskTypeOptions = [
    { value: 'document_processing', label: 'Document Processing' },
    { value: 'text_summarization', label: 'Text Summarization' },
    { value: 'compliance_check', label: 'Compliance Check' },
    { value: 'risk_assessment', label: 'Risk Assessment' },
    { value: 'lc_processing', label: 'LC Processing' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  if (loading) {
    return <LoadingSpinner message="Loading VPBank K-MULT Agent Studio..." variant="centered" size="large" />;
  }

  if (error) {
    return (
      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Header variant="h1">VPBank K-MULT Agent Studio</Header>
          <Alert
            statusIconAriaLabel="Error"
            type="error"
            header="System Error"
            action={
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </SpaceBetween>
      </Container>
    );
  }

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        {/* Header */}
        <Header
          variant="h1"
          description="Multi-Agent AI Platform for Vietnamese Banking Process Automation"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => setShowDemoGuide(true)}
                iconName="status-info"
              >
                🎪 Demo Guide
              </Button>
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
                onClick={() => setShowTaskModal(true)}
                iconName="add-plus"
              >
                Assign Task
              </Button>
            </SpaceBetween>
          }
        >
          VPBank K-MULT Agent Studio
        </Header>

        {/* System Metrics */}
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

        {/* Main Dashboard Tabs */}
        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'overview',
              label: 'System Overview',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  {/* Load Distribution Chart */}
                  {loadDistributionData.length > 0 && (
                    <Box>
                      <Header variant="h3" description="Current load distribution across agents">
                        Agent Load Distribution
                      </Header>
                      <PieChart
                        data={loadDistributionData}
                        detailPopoverContent={(datum) => [
                          { key: "Agent", value: datum.title },
                          { key: "Load", value: `${datum.value}%` },
                          { key: "Status", value: datum.value > 80 ? "High Load" : datum.value > 50 ? "Busy" : "Available" }
                        ]}
                        segmentDescription={(datum, sum) => 
                          `${datum.value}% load (${((datum.value / sum) * 100).toFixed(1)}% of total)`
                        }
                        i18nStrings={{
                          filterLabel: "Filter displayed data",
                          filterPlaceholder: "Filter data",
                          filterSelectedAriaLabel: "selected",
                          detailPopoverDismissAriaLabel: "Dismiss",
                          legendAriaLabel: "Legend",
                          chartAriaRoleDescription: "pie chart",
                          segmentAriaRoleDescription: "segment"
                        }}
                      />
                    </Box>
                  )}

                  {/* Performance History Chart */}
                  {performanceHistory.length > 5 && (
                    <Box>
                      <Header variant="h3" description="Agent performance over time">
                        Performance History (24 Hours)
                      </Header>
                      <LineChart
                        series={performanceChartSeries}
                        xDomain={performanceHistory.map(point => point.x)}
                        yDomain={[0, 100]}
                        xTitle="Time"
                        yTitle="Load (%)"
                        height={300}
                        hideFilter={false}
                        hideLegend={false}
                        i18nStrings={{
                          filterLabel: "Filter displayed data",
                          filterPlaceholder: "Filter data",
                          filterSelectedAriaLabel: "selected",
                          legendAriaLabel: "Legend",
                          chartAriaRoleDescription: "line chart",
                          xTickFormatter: (value) => value.split(' ')[1] || value,
                        }}
                      />
                    </Box>
                  )}
                </SpaceBetween>
              )
            },
            {
              id: 'agents',
              label: 'Agent Status',
              content: (
                <Cards
                  cardDefinition={{
                    header: (item: any) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Box fontSize="heading-m">{item.name}</Box>
                        <Badge color={item.status === 'active' ? 'green' : item.status === 'processing' ? 'blue' : 'red'}>
                          {item.status}
                        </Badge>
                      </SpaceBetween>
                    ),
                    sections: [
                      {
                        id: "description",
                        content: (item: any) => (
                          <Box variant="p">{item.description}</Box>
                        )
                      },
                      {
                        id: "performance",
                        header: "Performance Metrics",
                        content: (item: any) => (
                          <SpaceBetween direction="vertical" size="s">
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
                                  label: "Total Tasks",
                                  value: item.total_tasks || 0
                                },
                                {
                                  label: "Success Rate",
                                  value: `${item.success_rate || 0}%`
                                },
                                {
                                  label: "Avg Response",
                                  value: `${item.average_response_time || 0}s`
                                },
                                {
                                  label: "Current Task",
                                  value: item.current_task ? (
                                    <Badge color="blue">{item.current_task}</Badge>
                                  ) : (
                                    <Badge color="grey">Idle</Badge>
                                  )
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
                        header: "Actions",
                        content: (item: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button
                              size="small"
                              onClick={() => {
                                setSelectedAgent(item.agent_id);
                                setShowTaskModal(true);
                              }}
                              iconName="add-plus"
                            >
                              Assign Task
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleCoordinateAgents('health_check')}
                              iconName="status-positive"
                            >
                              Health Check
                            </Button>
                          </SpaceBetween>
                        )
                      }
                    ]
                  }}
                  cardsPerRow={[
                    { cards: 1 },
                    { minWidth: 600, cards: 2 },
                    { minWidth: 900, cards: 3 }
                  ]}
                  items={agentStatus?.agents || []}
                  loading={loading}
                  loadingText="Loading agents..."
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No agents available</b>
                      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        No agents are currently configured.
                      </Box>
                    </Box>
                  }
                  header={
                    <Header
                      counter={`(${agentStatus?.total_agents || 0})`}
                      description="Real-time agent monitoring with performance metrics"
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            onClick={() => handleCoordinateAgents('system_check', 'high')}
                            iconName="share"
                          >
                            Coordinate All
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => navigate('/agents')}
                            iconName="settings"
                          >
                            Manage Agents
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      Banking Agents
                    </Header>
                  }
                />
              )
            },
            {
              id: 'coordination',
              label: 'Coordination History',
              content: (
                <Table
                  columnDefinitions={[
                    {
                      id: "timestamp",
                      header: "Time",
                      cell: (item: any) => item.timestamp.toLocaleString(),
                      sortingField: "timestamp"
                    },
                    {
                      id: "taskType",
                      header: "Task Type",
                      cell: (item: any) => (
                        <Badge color="blue">{item.taskType}</Badge>
                      )
                    },
                    {
                      id: "priority",
                      header: "Priority",
                      cell: (item: any) => (
                        <Badge color={
                          item.priority === 'critical' ? 'red' :
                          item.priority === 'high' ? 'orange' :
                          item.priority === 'medium' ? 'blue' : 'grey'
                        }>
                          {item.priority}
                        </Badge>
                      )
                    },
                    {
                      id: "assignedAgents",
                      header: "Assigned Agents",
                      cell: (item: any) => item.assignedAgents?.length || 0
                    },
                    {
                      id: "status",
                      header: "Status",
                      cell: (item: any) => (
                        <StatusIndicator type={
                          item.status === 'completed' ? 'success' :
                          item.status === 'in_progress' ? 'in-progress' : 'error'
                        }>
                          {item.status}
                        </StatusIndicator>
                      )
                    },
                    {
                      id: "duration",
                      header: "Duration",
                      cell: (item: any) => item.duration ? `${item.duration}s` : 'In progress'
                    }
                  ]}
                  items={coordinationHistory}
                  sortingDisabled={false}
                  header={
                    <Header
                      counter={`(${coordinationHistory.length})`}
                      description="Recent agent coordination activities"
                      actions={
                        <Button
                          onClick={() => handleCoordinateAgents('batch_processing', 'high')}
                          variant="primary"
                        >
                          Start Batch Processing
                        </Button>
                      }
                    >
                      Coordination History
                    </Header>
                  }
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No coordination history</b>
                      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        No recent coordination activities to display.
                      </Box>
                    </Box>
                  }
                />
              )
            },
            {
              id: 'services',
              label: 'System Services',
              content: (
                <Cards
                  cardDefinition={{
                    header: (item: any) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Box fontSize="heading-m">{item.service_name}</Box>
                        <StatusIndicator type={item.status === 'healthy' ? 'success' : 'error'}>
                          {item.status}
                        </StatusIndicator>
                      </SpaceBetween>
                    ),
                    sections: [
                      {
                        id: "metrics",
                        header: "Performance Metrics",
                        content: (item: any) => (
                          <KeyValuePairs
                            columns={2}
                            items={[
                              {
                                label: "Response Time",
                                value: `${item.response_time_ms}ms`
                              },
                              {
                                label: "Last Check",
                                value: new Date(item.last_check).toLocaleString()
                              }
                            ]}
                          />
                        )
                      },
                      {
                        id: "details",
                        header: "Service Details",
                        content: (item: any) => (
                          <SpaceBetween direction="vertical" size="xs">
                            {Object.entries(item.details || {}).map(([key, value]: [string, any]) => (
                              <div key={key}>
                                <Box variant="awsui-key-label">{key.replace('_', ' ')}</Box>
                                <div>
                                  {Array.isArray(value) ? value.join(', ') : 
                                   typeof value === 'object' ? JSON.stringify(value) : 
                                   String(value)}
                                </div>
                              </div>
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
                  items={systemHealth?.services || []}
                  header={
                    <Header
                      counter={`(${systemHealth?.services?.length || 0})`}
                      description="System service health monitoring"
                    >
                      System Services
                    </Header>
                  }
                />
              )
            }
          ]}
        />

        {/* Quick Actions */}
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xs: 6, s: 4 } },
            { colspan: { default: 12, xs: 6, s: 4 } },
            { colspan: { default: 12, xs: 12, s: 4 } }
          ]}
        >
          <Box padding="l" className="action-card">
            <SpaceBetween direction="vertical" size="s">
              <Header variant="h3">Document Processing</Header>
              <Box variant="p">
                Process Vietnamese banking documents with advanced OCR and NLP capabilities.
              </Box>
              <KeyValuePairs
                columns={1}
                items={[
                  { label: "Accuracy", value: "99.5%" },
                  { label: "Processing Time", value: "2-5 seconds" },
                  { label: "Supported Formats", value: "PDF, DOCX, TXT" }
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
              <Header variant="h3">LC Processing</Header>
              <Box variant="p">
                Validate Letter of Credit documents against UCP 600 and ISBP 821 standards.
              </Box>
              <KeyValuePairs
                columns={1}
                items={[
                  { label: "Standards", value: "UCP 600, ISBP 821" },
                  { label: "Compliance Rate", value: "98.7%" },
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
              <Header variant="h3">Risk Assessment</Header>
              <Box variant="p">
                Automated credit risk analysis and scoring for Vietnamese banking.
              </Box>
              <KeyValuePairs
                columns={1}
                items={[
                  { label: "Accuracy", value: "95.2%" },
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

        {/* Demo Guide Modal */}
        <DemoGuide
          visible={showDemoGuide}
          onDismiss={() => setShowDemoGuide(false)}
        />

        {/* Task Assignment Modal */}
        <Modal
          visible={showTaskModal}
          onDismiss={() => setShowTaskModal(false)}
          header="Assign Task to Agent"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAssignTask}
                  disabled={!selectedAgent}
                >
                  Assign Task
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween direction="vertical" size="m">
            <FormField
              label="Selected Agent"
              description="The agent that will receive this task"
            >
              <Select
                selectedOption={selectedAgent ? { value: selectedAgent, label: selectedAgent } : null}
                onChange={({ detail }) => setSelectedAgent(detail.selectedOption.value)}
                options={agentStatus?.agents?.map((agent: any) => ({
                  value: agent.agent_id,
                  label: `${agent.name} (${agent.load_percentage}% load)`
                })) || []}
                placeholder="Select an agent"
              />
            </FormField>

            <FormField
              label="Task Type"
              description="Select the type of task to assign"
            >
              <Select
                selectedOption={taskForm.taskType}
                onChange={({ detail }) => setTaskForm(prev => ({ ...prev, taskType: detail.selectedOption }))}
                options={taskTypeOptions}
                placeholder="Select task type"
              />
            </FormField>

            <FormField
              label="Priority"
              description="Set the priority level for this task"
            >
              <Select
                selectedOption={taskForm.priority}
                onChange={({ detail }) => setTaskForm(prev => ({ ...prev, priority: detail.selectedOption }))}
                options={priorityOptions}
                placeholder="Select priority"
              />
            </FormField>

            <FormField
              label="Description (Optional)"
              description="Additional details about the task"
            >
              <Input
                value={taskForm.description}
                onChange={({ detail }) => setTaskForm(prev => ({ ...prev, description: detail.value }))}
                placeholder="Enter task description..."
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        {/* System Information */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Service Version</Box>
            <div>{systemHealth?.version || '2.0.0'}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Total Requests</Box>
            <div>{mockApiService.getRequestCount()}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Cache Size</Box>
            <div>{mockApiService.getCacheStats().size} items</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Last Updated</Box>
            <div>{new Date().toLocaleString()}</div>
          </div>
        </ColumnLayout>
      </SpaceBetween>
    </Container>
  );
};

export default MockHomePage;
