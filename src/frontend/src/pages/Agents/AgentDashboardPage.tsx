import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  Box,
  Button,
  Alert,
  ProgressBar,
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
  Textarea,
  Toggle,
  PieChart,
  BarChart,
  LineChart
} from '@cloudscape-design/components';

interface AgentDashboardPageProps {
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

interface Agent {
  agent_id: string;
  name: string;
  status: 'active' | 'inactive' | 'busy' | 'error';
  current_task: string | null;
  load_percentage: number;
  last_activity: string;
  capabilities: string[];
  description: string;
}

interface AgentStats {
  total_agents: number;
  active_agents: number;
  coordination_engine: string;
  agents: Record<string, string>;
}

interface TaskAssignment {
  task_id: string;
  agent_id: string;
  task_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  estimated_duration: number;
}

const AgentDashboardPage: React.FC<AgentDashboardPageProps> = ({ onShowSnackbar }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [coordinationModalVisible, setCoordinationModalVisible] = useState(false);

  // Task Assignment Form
  const [taskForm, setTaskForm] = useState({
    agent_id: '',
    task_type: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    description: '',
    estimated_duration: 30
  });

  // Coordination Form
  const [coordinationForm, setCoordinationForm] = useState({
    task_type: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    agents_required: 1,
    description: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadAgents();
    loadAgentStats();
    loadTasks();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAgents();
      loadAgentStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/agents/list');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      onShowSnackbar('Lỗi khi tải danh sách agents', 'error');
    }
  };

  const loadAgentStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/agents/health');
      const data = await response.json();
      setAgentStats(data);
    } catch (error) {
      onShowSnackbar('Lỗi khi tải thống kê agents', 'error');
    }
  };

  const loadTasks = async () => {
    // Mock task data since API doesn't provide task history
    const mockTasks: TaskAssignment[] = [
      {
        task_id: 'task-001',
        agent_id: 'document-intelligence',
        task_type: 'OCR Processing',
        priority: 'high',
        status: 'running',
        created_at: new Date().toISOString(),
        estimated_duration: 45
      },
      {
        task_id: 'task-002',
        agent_id: 'compliance-validation',
        task_type: 'UCP 600 Validation',
        priority: 'medium',
        status: 'completed',
        created_at: new Date(Date.now() - 300000).toISOString(),
        estimated_duration: 30
      }
    ];
    setTasks(mockTasks);
  };

  const handleTaskAssignment = async () => {
    if (!taskForm.agent_id || !taskForm.task_type) {
      onShowSnackbar('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/agents/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: taskForm.agent_id,
          task_type: taskForm.task_type,
          priority: taskForm.priority,
          description: taskForm.description,
          estimated_duration: taskForm.estimated_duration
        }),
      });

      if (response.ok) {
        onShowSnackbar('Phân công task thành công', 'success');
        setTaskModalVisible(false);
        setTaskForm({ agent_id: '', task_type: '', priority: 'medium', description: '', estimated_duration: 30 });
        loadAgents(); // Refresh agent status
      } else {
        throw new Error('Task assignment failed');
      }
    } catch (error) {
      onShowSnackbar('Lỗi khi phân công task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCoordination = async () => {
    if (!coordinationForm.task_type) {
      onShowSnackbar('Vui lòng điền đầy đủ thông tin', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/mutil_agent/api/v1/agents/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_type: coordinationForm.task_type,
          priority: coordinationForm.priority,
          agents_required: coordinationForm.agents_required,
          description: coordinationForm.description
        }),
      });

      if (response.ok) {
        onShowSnackbar('Khởi tạo coordination thành công', 'success');
        setCoordinationModalVisible(false);
        setCoordinationForm({ task_type: '', priority: 'medium', agents_required: 1, description: '' });
        loadAgents(); // Refresh agent status
      } else {
        throw new Error('Coordination failed');
      }
    } catch (error) {
      onShowSnackbar('Lỗi khi khởi tạo coordination', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'busy': return 'warning';
      case 'inactive': return 'stopped';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getLoadColor = (load: number): "flash" | undefined => {
    if (load > 70) return 'flash';
    return undefined;
  };

  const agentTableColumns = [
    {
      id: 'name',
      header: 'Agent',
      cell: (item: Agent) => (
        <Box>
          <div><strong>{item.name}</strong></div>
          <div style={{ fontSize: '0.85em', color: '#666' }}>{item.agent_id}</div>
        </Box>
      ),
      isRowHeader: true
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (item: Agent) => (
        <StatusIndicator type={getStatusColor(item.status)}>
          {item.status === 'active' ? 'Hoạt động' : 
           item.status === 'busy' ? 'Bận' :
           item.status === 'inactive' ? 'Không hoạt động' : 'Lỗi'}
        </StatusIndicator>
      )
    },
    {
      id: 'load',
      header: 'Tải',
      cell: (item: Agent) => (
        <Box>
          <ProgressBar
            value={item.load_percentage}
            variant={getLoadColor(item.load_percentage)}
            description={`${item.load_percentage}%`}
          />
        </Box>
      )
    },
    {
      id: 'current_task',
      header: 'Task hiện tại',
      cell: (item: Agent) => item.current_task || 'Không có'
    },
    {
      id: 'capabilities',
      header: 'Khả năng',
      cell: (item: Agent) => (
        <SpaceBetween direction="horizontal" size="xs">
          {item.capabilities.slice(0, 2).map(cap => (
            <Badge key={cap} color="blue">{cap}</Badge>
          ))}
          {item.capabilities.length > 2 && (
            <Badge color="grey">+{item.capabilities.length - 2}</Badge>
          )}
        </SpaceBetween>
      )
    },
    {
      id: 'last_activity',
      header: 'Hoạt động cuối',
      cell: (item: Agent) => new Date(item.last_activity).toLocaleString('vi-VN')
    }
  ];

  const taskTableColumns = [
    {
      id: 'task_id',
      header: 'Task ID',
      cell: (item: TaskAssignment) => item.task_id,
      isRowHeader: true
    },
    {
      id: 'agent_id',
      header: 'Agent',
      cell: (item: TaskAssignment) => {
        const agent = agents.find(a => a.agent_id === item.agent_id);
        return agent ? agent.name : item.agent_id;
      }
    },
    {
      id: 'task_type',
      header: 'Loại task',
      cell: (item: TaskAssignment) => item.task_type
    },
    {
      id: 'priority',
      header: 'Ưu tiên',
      cell: (item: TaskAssignment) => (
        <Badge 
          color={
            item.priority === 'urgent' ? 'red' :
            item.priority === 'high' ? 'red' :
            item.priority === 'medium' ? 'blue' : 'grey'
          }
        >
          {item.priority === 'urgent' ? 'Khẩn cấp' :
           item.priority === 'high' ? 'Cao' :
           item.priority === 'medium' ? 'Trung bình' : 'Thấp'}
        </Badge>
      )
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (item: TaskAssignment) => (
        <StatusIndicator 
          type={
            item.status === 'completed' ? 'success' :
            item.status === 'running' ? 'in-progress' :
            item.status === 'failed' ? 'error' : 'pending'
          }
        >
          {item.status === 'completed' ? 'Hoàn thành' :
           item.status === 'running' ? 'Đang chạy' :
           item.status === 'failed' ? 'Thất bại' : 'Chờ xử lý'}
        </StatusIndicator>
      )
    },
    {
      id: 'created_at',
      header: 'Tạo lúc',
      cell: (item: TaskAssignment) => new Date(item.created_at).toLocaleString('vi-VN')
    }
  ];

  const loadChartData = agents.map(agent => ({
    x: agent.name,
    y: agent.load_percentage
  }));

  const agentStatusData = [
    { title: 'Hoạt động', value: agents.filter(a => a.status === 'active').length, color: '#1f77b4' },
    { title: 'Bận', value: agents.filter(a => a.status === 'busy').length, color: '#ff7f0e' },
    { title: 'Không hoạt động', value: agents.filter(a => a.status === 'inactive').length, color: '#d62728' }
  ];

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Quản lý và giám sát hệ thống Multi-Agent"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                iconName="add-plus"
                onClick={() => setTaskModalVisible(true)}
              >
                Phân công Task
              </Button>
              <Button
                iconName="settings"
                onClick={() => setCoordinationModalVisible(true)}
              >
                Coordination
              </Button>
              <Button
                iconName="refresh"
                onClick={() => {
                  loadAgents();
                  loadAgentStats();
                }}
              >
                Làm mới
              </Button>
            </SpaceBetween>
          }
        >
          🤖 Agent Management Dashboard
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Overview Statistics */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Tổng Agents</Box>
            <Box variant="awsui-value-large">{agentStats?.total_agents || agents.length}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Agents Hoạt động</Box>
            <Box variant="awsui-value-large" color="text-status-success">
              {agentStats?.active_agents || agents.filter(a => a.status === 'active').length}
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Coordination Engine</Box>
            <Box variant="awsui-value-large">{agentStats?.coordination_engine || 'LangChain'}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Tải trung bình</Box>
            <Box variant="awsui-value-large">
              {agents.length > 0 ? 
                `${(agents.reduce((sum, a) => sum + a.load_percentage, 0) / agents.length).toFixed(1)}%` : 
                '0%'
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
                    <Container header={<Header variant="h2">Trạng thái Agents</Header>}>
                      {agentStatusData.some(d => d.value > 0) && (
                        <PieChart
                          data={agentStatusData}
                          detailPopoverContent={(datum, sum) => [
                            { key: "Trạng thái", value: datum.title },
                            { key: "Số lượng", value: datum.value },
                            {
                              key: "Tỷ lệ",
                              value: `${((datum.value / sum) * 100).toFixed(1)}%`
                            }
                          ]}
                          ariaDescription="Biểu đồ trạng thái agents"
                          ariaLabel="Agent status pie chart"
                        />
                      )}
                    </Container>

                    <Container header={<Header variant="h2">Tải hệ thống</Header>}>
                      {loadChartData.length > 0 && (
                        <BarChart
                          series={[
                            {
                              title: "Tải (%)",
                              type: "bar",
                              data: loadChartData
                            }
                          ]}
                          xDomain={agents.map(a => a.name)}
                          yDomain={[0, 100]}
                          xTitle="Agents"
                          yTitle="Tải (%)"
                          ariaLabel="Agent load chart"
                          errorText="Error loading data."
                          loadingText="Loading chart"
                          recoveryText="Retry"
                        />
                      )}
                    </Container>
                  </ColumnLayout>

                  <Cards
                    cardDefinition={{
                      header: (item: Agent) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <span>{item.name}</span>
                          <StatusIndicator type={getStatusColor(item.status)}>
                            {item.status}
                          </StatusIndicator>
                        </SpaceBetween>
                      ),
                      sections: [
                        {
                          id: 'description',
                          content: (item: Agent) => item.description
                        },
                        {
                          id: 'load',
                          header: 'Tải hiện tại',
                          content: (item: Agent) => (
                            <ProgressBar
                              value={item.load_percentage}
                              variant={getLoadColor(item.load_percentage)}
                              description={`${item.load_percentage}%`}
                            />
                          )
                        },
                        {
                          id: 'task',
                          header: 'Task hiện tại',
                          content: (item: Agent) => item.current_task || 'Không có task'
                        },
                        {
                          id: 'capabilities',
                          header: 'Khả năng',
                          content: (item: Agent) => (
                            <SpaceBetween direction="horizontal" size="xs">
                              {item.capabilities.map(cap => (
                                <Badge key={cap} color="blue">{cap}</Badge>
                              ))}
                            </SpaceBetween>
                          )
                        }
                      ]
                    }}
                    cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
                    items={agents}
                    loading={loading}
                    loadingText="Đang tải agents..."
                    empty={
                      <Box textAlign="center" color="inherit">
                        <b>Không có agent nào</b>
                        <Box variant="p" color="inherit">
                          Hệ thống chưa có agent nào được khởi tạo.
                        </Box>
                      </Box>
                    }
                  />
                </SpaceBetween>
              )
            },
            {
              id: 'agents',
              label: 'Danh sách Agents',
              content: (
                <Table
                  columnDefinitions={agentTableColumns}
                  items={agents}
                  loading={loading}
                  loadingText="Đang tải agents..."
                  selectionType="single"
                  onSelectionChange={({ detail }) => 
                    setSelectedAgent(detail.selectedItems[0] || null)
                  }
                  header={
                    <Header
                      counter={`(${agents.length})`}
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            disabled={!selectedAgent}
                            onClick={() => {
                              if (selectedAgent) {
                                setTaskForm({ ...taskForm, agent_id: selectedAgent.agent_id });
                                setTaskModalVisible(true);
                              }
                            }}
                          >
                            Phân công Task
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      Danh sách Agents
                    </Header>
                  }
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>Không có agent nào</b>
                      <Box variant="p" color="inherit">
                        Hệ thống chưa có agent nào được khởi tạo.
                      </Box>
                    </Box>
                  }
                />
              )
            },
            {
              id: 'tasks',
              label: 'Quản lý Tasks',
              content: (
                <Table
                  columnDefinitions={taskTableColumns}
                  items={tasks}
                  loading={loading}
                  loadingText="Đang tải tasks..."
                  header={
                    <Header
                      counter={`(${tasks.length})`}
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            variant="primary"
                            onClick={() => setTaskModalVisible(true)}
                          >
                            Tạo Task mới
                          </Button>
                        </SpaceBetween>
                      }
                    >
                      Lịch sử Tasks
                    </Header>
                  }
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>Không có task nào</b>
                      <Box variant="p" color="inherit">
                        Chưa có task nào được tạo.
                      </Box>
                    </Box>
                  }
                />
              )
            }
          ]}
        />

        {/* Task Assignment Modal */}
        <Modal
          onDismiss={() => setTaskModalVisible(false)}
          visible={taskModalVisible}
          closeAriaLabel="Close modal"
          size="medium"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setTaskModalVisible(false)}>
                  Hủy
                </Button>
                <Button variant="primary" loading={loading} onClick={handleTaskAssignment}>
                  Phân công
                </Button>
              </SpaceBetween>
            </Box>
          }
          header="Phân công Task cho Agent"
        >
          <Form>
            <SpaceBetween size="m">
              <FormField label="Chọn Agent">
                <Select
                  selectedOption={
                    taskForm.agent_id
                      ? { label: agents.find(a => a.agent_id === taskForm.agent_id)?.name || '', value: taskForm.agent_id }
                      : null
                  }
                  onChange={({ detail }) =>
                    setTaskForm({ ...taskForm, agent_id: detail.selectedOption?.value || '' })
                  }
                  options={agents.map(agent => ({
                    label: `${agent.name} (${agent.load_percentage}% load)`,
                    value: agent.agent_id,
                    disabled: agent.status !== 'active'
                  }))}
                  placeholder="Chọn agent"
                />
              </FormField>

              <FormField label="Loại Task">
                <Select
                  selectedOption={
                    taskForm.task_type
                      ? { label: taskForm.task_type, value: taskForm.task_type }
                      : null
                  }
                  onChange={({ detail }) =>
                    setTaskForm({ ...taskForm, task_type: detail.selectedOption?.value || '' })
                  }
                  options={[
                    { label: 'OCR Processing', value: 'ocr_processing' },
                    { label: 'Document Analysis', value: 'document_analysis' },
                    { label: 'Risk Assessment', value: 'risk_assessment' },
                    { label: 'Compliance Check', value: 'compliance_check' },
                    { label: 'LC Validation', value: 'lc_validation' },
                    { label: 'Credit Analysis', value: 'credit_analysis' }
                  ]}
                  placeholder="Chọn loại task"
                />
              </FormField>

              <FormField label="Mức độ ưu tiên">
                <Select
                  selectedOption={{ label: taskForm.priority, value: taskForm.priority }}
                  onChange={({ detail }) =>
                    setTaskForm({ ...taskForm, priority: detail.selectedOption?.value as any || 'medium' })
                  }
                  options={[
                    { label: 'Thấp', value: 'low' },
                    { label: 'Trung bình', value: 'medium' },
                    { label: 'Cao', value: 'high' },
                    { label: 'Khẩn cấp', value: 'urgent' }
                  ]}
                />
              </FormField>

              <FormField label="Thời gian ước tính (phút)">
                <Input
                  type="number"
                  value={taskForm.estimated_duration.toString()}
                  onChange={({ detail }) =>
                    setTaskForm({ ...taskForm, estimated_duration: parseInt(detail.value) || 30 })
                  }
                />
              </FormField>

              <FormField label="Mô tả">
                <Textarea
                  value={taskForm.description}
                  onChange={({ detail }) =>
                    setTaskForm({ ...taskForm, description: detail.value })
                  }
                  placeholder="Mô tả chi tiết về task..."
                  rows={3}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>

        {/* Coordination Modal */}
        <Modal
          onDismiss={() => setCoordinationModalVisible(false)}
          visible={coordinationModalVisible}
          closeAriaLabel="Close modal"
          size="medium"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setCoordinationModalVisible(false)}>
                  Hủy
                </Button>
                <Button variant="primary" loading={loading} onClick={handleCoordination}>
                  Khởi tạo
                </Button>
              </SpaceBetween>
            </Box>
          }
          header="Multi-Agent Coordination"
        >
          <Form>
            <SpaceBetween size="m">
              <FormField label="Loại Task">
                <Select
                  selectedOption={
                    coordinationForm.task_type
                      ? { label: coordinationForm.task_type, value: coordinationForm.task_type }
                      : null
                  }
                  onChange={({ detail }) =>
                    setCoordinationForm({ ...coordinationForm, task_type: detail.selectedOption?.value || '' })
                  }
                  options={[
                    { label: 'LC Processing Workflow', value: 'lc_processing' },
                    { label: 'Credit Assessment Workflow', value: 'credit_assessment' },
                    { label: 'Document Intelligence Pipeline', value: 'document_pipeline' },
                    { label: 'Compliance Validation Chain', value: 'compliance_chain' },
                    { label: 'Risk Analysis Workflow', value: 'risk_workflow' }
                  ]}
                  placeholder="Chọn workflow"
                />
              </FormField>

              <FormField label="Số lượng Agents cần thiết">
                <Input
                  type="number"
                  value={coordinationForm.agents_required.toString()}
                  onChange={({ detail }) =>
                    setCoordinationForm({ ...coordinationForm, agents_required: parseInt(detail.value) || 1 })
                  }
                />
              </FormField>

              <FormField label="Mức độ ưu tiên">
                <Select
                  selectedOption={{ label: coordinationForm.priority, value: coordinationForm.priority }}
                  onChange={({ detail }) =>
                    setCoordinationForm({ ...coordinationForm, priority: detail.selectedOption?.value as any || 'medium' })
                  }
                  options={[
                    { label: 'Thấp', value: 'low' },
                    { label: 'Trung bình', value: 'medium' },
                    { label: 'Cao', value: 'high' },
                    { label: 'Khẩn cấp', value: 'urgent' }
                  ]}
                />
              </FormField>

              <FormField label="Mô tả">
                <Textarea
                  value={coordinationForm.description}
                  onChange={({ detail }) =>
                    setCoordinationForm({ ...coordinationForm, description: detail.value })
                  }
                  placeholder="Mô tả chi tiết về workflow coordination..."
                  rows={3}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </Modal>
      </SpaceBetween>
    </Container>
  );
};

export default AgentDashboardPage;
