import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Grid,
  Box,
  Button,
  Cards,
  Badge,
  StatusIndicator,
  ProgressBar,
  KeyValuePairs,
  LineChart,
  BarChart,
  PieChart,
  Table,
  Modal,
  FormField,
  Select,
  Input,
  Alert,
  Tabs,
  ExpandableSection,
} from '@cloudscape-design/components';
import { 
  useRealTimeData, 
  useAgentCoordination, 
  useStrands,
  useAgentDetails 
} from '../../hooks/useEnhancedApi';

interface TaskAssignment {
  id: string;
  agentId: string;
  taskType: string;
  priority: string;
  status: string;
  timestamp: Date;
  estimatedCompletion?: string;
}

const EnhancedAgentDashboard: React.FC<{ onShowSnackbar: (message: string, type: string) => void }> = ({ onShowSnackbar }) => {
  const { systemHealth, agentStatus, strandsStatus, loading, error, refresh } = useRealTimeData(10000);
  const { coordinateAgents, assignTask, coordinationHistory } = useAgentCoordination();
  const { processWithStrands } = useStrands();
  
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    taskType: { value: 'document_processing' },
    priority: { value: 'medium' },
    description: '',
  });
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Generate performance history data
  useEffect(() => {
    if (agentStatus?.agents) {
      const timestamp = new Date();
      const newDataPoint = {
        x: timestamp.toLocaleTimeString(),
        timestamp,
        ...agentStatus.agents.reduce((acc: any, agent: any) => {
          acc[agent.agent_id] = agent.load_percentage || 0;
          return acc;
        }, {})
      };

      setPerformanceHistory(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });
    }
  }, [agentStatus]);

  // Task type options
  const taskTypeOptions = [
    { value: 'document_processing', label: 'Document Processing', description: 'Process and analyze documents' },
    { value: 'text_summarization', label: 'Text Summarization', description: 'Summarize Vietnamese text' },
    { value: 'compliance_check', label: 'Compliance Check', description: 'Validate regulatory compliance' },
    { value: 'risk_assessment', label: 'Risk Assessment', description: 'Analyze financial risk' },
    { value: 'lc_processing', label: 'LC Processing', description: 'Process Letter of Credit' },
    { value: 'system_maintenance', label: 'System Maintenance', description: 'System health check' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', description: 'Non-urgent task' },
    { value: 'medium', label: 'Medium', description: 'Standard priority' },
    { value: 'high', label: 'High', description: 'Urgent task' },
    { value: 'critical', label: 'Critical', description: 'Emergency task' },
  ];

  // Handle task assignment
  const handleAssignTask = async () => {
    if (!selectedAgent) {
      onShowSnackbar('Please select an agent first', 'error');
      return;
    }

    try {
      const response = await coordinateAgents(taskForm.taskType.value, taskForm.priority.value);
      
      if (response.status === 'success') {
        onShowSnackbar(
          `Task assigned successfully to ${selectedAgent}`,
          'success'
        );
        setShowTaskModal(false);
        setTaskForm({
          taskType: { value: 'document_processing' },
          priority: { value: 'medium' },
          description: '',
        });
        refresh();
      } else {
        throw new Error(response.error?.message || 'Task assignment failed');
      }
    } catch (error) {
      console.error('Task assignment error:', error);
      onShowSnackbar(
        error instanceof Error ? error.message : 'Failed to assign task',
        'error'
      );
    }
  };

  // Handle Strands processing
  const handleStrandsProcessing = async (message: string) => {
    try {
      const response = await processWithStrands(message);
      
      if (response.status === 'success') {
        onShowSnackbar('Strands processing completed successfully', 'success');
        refresh();
      } else {
        throw new Error(response.error?.message || 'Strands processing failed');
      }
    } catch (error) {
      console.error('Strands processing error:', error);
      onShowSnackbar(
        error instanceof Error ? error.message : 'Strands processing failed',
        'error'
      );
    }
  };

  // Calculate agent statistics
  const agentStats = React.useMemo(() => {
    if (!agentStatus?.agents) return null;

    const agents = agentStatus.agents;
    const totalLoad = agents.reduce((sum: number, agent: any) => sum + (agent.load_percentage || 0), 0);
    const avgLoad = totalLoad / agents.length;
    const busyAgents = agents.filter((agent: any) => (agent.load_percentage || 0) > 50).length;
    const idleAgents = agents.filter((agent: any) => (agent.load_percentage || 0) < 20).length;

    return {
      totalAgents: agents.length,
      activeAgents: agentStatus.active_agents,
      averageLoad: avgLoad.toFixed(1),
      busyAgents,
      idleAgents,
      totalLoad: totalLoad.toFixed(1),
    };
  }, [agentStatus]);

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

  if (loading && !agentStatus) {
    return (
      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Header variant="h1">Agent Dashboard</Header>
          <Box textAlign="center">
            <StatusIndicator type="loading">Loading agent data...</StatusIndicator>
          </Box>
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
          description="Real-time monitoring and coordination of multi-agent system"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => setShowTaskModal(true)}
                variant="primary"
                iconName="add-plus"
              >
                Assign Task
              </Button>
              <Button
                onClick={() => handleStrandsProcessing('System health check')}
                iconName="share"
              >
                Strands Process
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
        >
          Agent Dashboard
        </Header>

        {/* System Status Alert */}
        {error && (
          <Alert
            statusIconAriaLabel="Warning"
            type="warning"
            header="Connection Issues"
            dismissible
          >
            Some agent data may be outdated due to connectivity issues. Core monitoring remains functional.
          </Alert>
        )}

        {/* Agent Statistics Overview */}
        {agentStats && (
          <Grid
            gridDefinition={[
              { colspan: { default: 12, xs: 6, s: 2 } },
              { colspan: { default: 12, xs: 6, s: 2 } },
              { colspan: { default: 12, xs: 6, s: 2 } },
              { colspan: { default: 12, xs: 6, s: 2 } },
              { colspan: { default: 12, xs: 6, s: 2 } },
              { colspan: { default: 12, xs: 6, s: 2 } }
            ]}
          >
            <Box padding="l" className="metric-card">
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="awsui-key-label">Total Agents</Box>
                <Box fontSize="heading-xl">{agentStats.totalAgents}</Box>
                <StatusIndicator type="success">All systems</StatusIndicator>
              </SpaceBetween>
            </Box>
            
            <Box padding="l" className="metric-card">
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="awsui-key-label">Active Agents</Box>
                <Box fontSize="heading-xl">{agentStats.activeAgents}</Box>
                <StatusIndicator type="success">Operational</StatusIndicator>
              </SpaceBetween>
            </Box>
            
            <Box padding="l" className="metric-card">
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="awsui-key-label">Average Load</Box>
                <Box fontSize="heading-xl">{agentStats.averageLoad}%</Box>
                <StatusIndicator type={parseFloat(agentStats.averageLoad) < 70 ? 'success' : 'warning'}>
                  {parseFloat(agentStats.averageLoad) < 70 ? 'Optimal' : 'High'}
                </StatusIndicator>
              </SpaceBetween>
            </Box>
            
            <Box padding="l" className="metric-card">
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="awsui-key-label">Busy Agents</Box>
                <Box fontSize="heading-xl">{agentStats.busyAgents}</Box>
                <StatusIndicator type={agentStats.busyAgents < 3 ? 'success' : 'warning'}>
                  {agentStats.busyAgents < 3 ? 'Normal' : 'High load'}
                </StatusIndicator>
              </SpaceBetween>
            </Box>
            
            <Box padding="l" className="metric-card">
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="awsui-key-label">Idle Agents</Box>
                <Box fontSize="heading-xl">{agentStats.idleAgents}</Box>
                <StatusIndicator type="info">Available</StatusIndicator>
              </SpaceBetween>
            </Box>
            
            <Box padding="l" className="metric-card">
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="awsui-key-label">Strands Agents</Box>
                <Box fontSize="heading-xl">{strandsStatus?.total_agents || 0}</Box>
                <StatusIndicator type="success">Ready</StatusIndicator>
              </SpaceBetween>
            </Box>
          </Grid>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
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
                          `${datum.value}% of total load (${((datum.value / sum) * 100).toFixed(1)}% of agents)`
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
                        Performance History
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
              label: 'Agent Details',
              content: (
                <Cards
                  cardDefinition={{
                    header: (item: any) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Box fontSize="heading-m">{item.name}</Box>
                        <Badge color={item.status === 'active' ? 'green' : 'red'}>
                          {item.status}
                        </Badge>
                        <Badge color="blue">{item.agent_id}</Badge>
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
                        header: "Current Performance",
                        content: (item: any) => (
                          <SpaceBetween direction="vertical" size="s">
                            <div>
                              <Box variant="awsui-key-label">Load Percentage</Box>
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
                            {item.capabilities?.map((capability: string, idx: number) => (
                              <Badge key={idx} color="green">
                                {capability}
                              </Badge>
                            ))}
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
                              variant="link"
                              onClick={() => {
                                // Navigate to agent details
                                console.log('View agent details:', item.agent_id);
                              }}
                              iconName="view-full"
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
                    { minWidth: 600, cards: 2 },
                    { minWidth: 900, cards: 3 }
                  ]}
                  items={agentStatus?.agents || []}
                  loading={loading}
                  loadingText="Loading agent details..."
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No agents available</b>
                      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        No agents are currently configured or accessible.
                      </Box>
                    </Box>
                  }
                  header={
                    <Header
                      counter={`(${agentStatus?.total_agents || 0})`}
                      description="Detailed view of all agents in the system"
                    >
                      Agent Details
                    </Header>
                  }
                />
              )
            },
            {
              id: 'coordination',
              label: 'Coordination History',
              content: (
                <SpaceBetween direction="vertical" size="m">
                  {coordinationHistory.length > 0 ? (
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
                          cell: (item: any) => item.response?.assigned_agents?.length || 0
                        },
                        {
                          id: "status",
                          header: "Status",
                          cell: (item: any) => (
                            <StatusIndicator type="success">
                              Completed
                            </StatusIndicator>
                          )
                        }
                      ]}
                      items={coordinationHistory}
                      sortingDisabled={false}
                      header={
                        <Header
                          counter={`(${coordinationHistory.length})`}
                          description="Recent agent coordination activities"
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
                  ) : (
                    <Box textAlign="center" color="inherit">
                      <b>No coordination history</b>
                      <Box padding={{ bottom: "s" }} variant="p" color="inherit">
                        Start coordinating agents to see activity history here.
                      </Box>
                      <Button
                        variant="primary"
                        onClick={() => setShowTaskModal(true)}
                      >
                        Assign First Task
                      </Button>
                    </Box>
                  )}
                </SpaceBetween>
              )
            },
            {
              id: 'strands',
              label: 'Strands System',
              content: (
                <SpaceBetween direction="vertical" size="m">
                  {strandsStatus && (
                    <KeyValuePairs
                      columns={3}
                      items={[
                        {
                          label: "Total Strands Agents",
                          value: strandsStatus.total_agents || 0
                        },
                        {
                          label: "Framework Version",
                          value: strandsStatus.service_info?.version || 'N/A'
                        },
                        {
                          label: "SDK Framework",
                          value: strandsStatus.service_info?.framework || 'N/A'
                        }
                      ]}
                    />
                  )}

                  {strandsStatus?.agents && (
                    <Cards
                      cardDefinition={{
                        header: (item: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Box fontSize="heading-m">{item[0]}</Box>
                            <Badge color={item[1].status === 'available' ? 'green' : 'red'}>
                              {item[1].status}
                            </Badge>
                          </SpaceBetween>
                        ),
                        sections: [
                          {
                            id: "details",
                            content: (item: any) => (
                              <KeyValuePairs
                                columns={2}
                                items={[
                                  {
                                    label: "Type",
                                    value: item[1].type
                                  },
                                  {
                                    label: "Last Check",
                                    value: new Date(item[1].last_check).toLocaleString()
                                  }
                                ]}
                              />
                            )
                          }
                        ]
                      }}
                      cardsPerRow={[
                        { cards: 1 },
                        { minWidth: 500, cards: 2 },
                        { minWidth: 800, cards: 4 }
                      ]}
                      items={Object.entries(strandsStatus.agents)}
                      header={
                        <Header
                          counter={`(${Object.keys(strandsStatus.agents).length})`}
                          description="Strands multi-agent framework status"
                        >
                          Strands Agents
                        </Header>
                      }
                    />
                  )}
                </SpaceBetween>
              )
            }
          ]}
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
              <Input
                value={selectedAgent || 'No agent selected'}
                readOnly
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
      </SpaceBetween>
    </Container>
  );
};

export default EnhancedAgentDashboard;
