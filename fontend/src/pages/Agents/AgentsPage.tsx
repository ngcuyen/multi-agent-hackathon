import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Button,
  Table,
  Badge,
  Box,
  Modal,
  Form,
  FormField,
  Input,
  Textarea,
  Select,
  Toggle,
  ColumnLayout,
  ButtonDropdown,
  StatusIndicator
} from "@cloudscape-design/components";
import { useNavigate } from 'react-router-dom';
import { Agent } from '../../types';
import { agentAPI } from '../../services/api';

interface AgentsPageProps {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const AgentsPage: React.FC<AgentsPageProps> = ({ agents, setAgents, onShowSnackbar }) => {
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 8192,
    status: 'active' as 'active' | 'inactive',
    systemPrompt: '',
    capabilities: [] as string[]
  });
  const [selectedItems, setSelectedItems] = useState<typeof tableItems>([]);

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      description: '',
      model: 'claude-3-sonnet',
      temperature: 0.7,
      maxTokens: 8192,
      status: 'active',
      systemPrompt: '',
      capabilities: []
    });
    setModalVisible(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      model: agent.model || 'claude-3-sonnet',
      temperature: agent.temperature || 0.7,
      maxTokens: agent.maxTokens || 8192,
      status: agent.status,
      systemPrompt: agent.systemPrompt || '',
      capabilities: agent.capabilities || []
    });
    setModalVisible(true);
  };

  const handleSaveAgent = async () => {
    try {
      if (editingAgent) {
        // Update existing agent
        const response = await agentAPI.updateAgent(editingAgent.id, formData);
        if (response.success) {
          onShowSnackbar('Agent updated successfully', 'success');
        } else {
          throw new Error('Update failed');
        }
      } else {
        // Create new agent
        const response = await agentAPI.createAgent(formData);
        if (response.success) {
          onShowSnackbar('Agent created successfully', 'success');
        } else {
          throw new Error('Creation failed');
        }
      }
      
      setModalVisible(false);
      onAgentsChange();
    } catch (error) {
      console.error('Failed to save agent:', error);
      onShowSnackbar('Failed to save agent', 'error');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await agentAPI.deleteAgent(agentId);
      if (response.success) {
        onShowSnackbar('Agent deleted successfully', 'success');
        onAgentsChange();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
      onShowSnackbar('Failed to delete agent', 'error');
    }
  };

  const handleChatWithAgent = (agent: Agent) => {
    navigate(`/chat/${agent.id}`);
  };

  const modelOptions = [
    { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
    { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
    { label: 'Claude 3 Opus', value: 'claude-3-opus' }
  ];

  const tableItems = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    model: agent.model || 'claude-3-sonnet',
    status: agent.status,
    temperature: agent.temperature || 0.7,
    maxTokens: agent.maxTokens || 8192,
    capabilities: agent.capabilities || [],
    createdAt: agent.createdAt || new Date(),
    agent: agent
  }));

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h1"
          description="Manage your AI agents, configure their capabilities, and monitor their performance."
          actions={
            <Button variant="primary" iconName="add-plus" onClick={handleCreateAgent}>
              Create Agent
            </Button>
          }
        >
          AI Agents
        </Header>

        <Table
          items={tableItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
          columnDefinitions={[
            {
              id: 'name',
              header: 'Name',
              cell: item => (
                <SpaceBetween direction="horizontal" size="s">
                  <span>🤖</span>
                  <strong>{item.name}</strong>
                </SpaceBetween>
              ),
              sortingField: 'name'
            },
            {
              id: 'description',
              header: 'Description',
              cell: item => item.description,
              sortingField: 'description'
            },
            {
              id: 'model',
              header: 'Model',
              cell: item => (
                <Badge color="blue">{item.model}</Badge>
              ),
              sortingField: 'model'
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
            },
            {
              id: 'capabilities',
              header: 'Capabilities',
              cell: item => (
                <SpaceBetween direction="horizontal" size="xs">
                  {item.capabilities.slice(0, 2).map((cap: string, index: number) => (
                    <Badge key={index} color="green">{cap}</Badge>
                  ))}
                  {item.capabilities.length > 2 && (
                    <Badge color="grey">+{item.capabilities.length - 2} more</Badge>
                  )}
                </SpaceBetween>
              )
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: item => (
                <ButtonDropdown
                  items={[
                    {
                      text: 'Chat',
                      id: 'chat',
                      iconName: 'contact'
                    },
                    {
                      text: 'Edit',
                      id: 'edit',
                      iconName: 'edit'
                    },
                    {
                      text: 'Delete',
                      id: 'delete',
                      iconName: 'remove'
                    }
                  ]}
                  onItemClick={({ detail }) => {
                    switch (detail.id) {
                      case 'chat':
                        handleChatWithAgent(item.agent);
                        break;
                      case 'edit':
                        handleEditAgent(item.agent);
                        break;
                      case 'delete':
                        handleDeleteAgent(item.id);
                        break;
                    }
                  }}
                >
                  Actions
                </ButtonDropdown>
              )
            }
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <SpaceBetween direction="vertical" size="m">
                <b>No agents</b>
                <span>Create your first AI agent to get started.</span>
                <Button variant="primary" onClick={handleCreateAgent}>
                  Create Agent
                </Button>
              </SpaceBetween>
            </Box>
          }
          header={
            <Header
              counter={`(${agents.length})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    disabled={selectedItems.length === 0}
                    onClick={() => {
                      selectedItems.forEach(item => handleDeleteAgent(item.agent.id));
                    }}
                  >
                    Delete Selected
                  </Button>
                </SpaceBetween>
              }
            >
              Agents
            </Header>
          }
        />

        {/* Create/Edit Agent Modal */}
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          header={editingAgent ? 'Edit Agent' : 'Create New Agent'}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setModalVisible(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveAgent}>
                  {editingAgent ? 'Update' : 'Create'}
                </Button>
              </SpaceBetween>
            </Box>
          }
          size="large"
        >
          <Form>
            <SpaceBetween direction="vertical" size="l">
              <ColumnLayout columns={2}>
                <FormField label="Agent Name" constraintText="Enter a unique name for your agent">
                  <Input
                    value={formData.name}
                    onChange={({ detail }) => setFormData({ ...formData, name: detail.value })}
                    placeholder="e.g., Risk Assessment Agent"
                  />
                </FormField>

                <FormField label="Model">
                  <Select
                    selectedOption={modelOptions.find(opt => opt.value === formData.model)}
                    onChange={({ detail }) => setFormData({ ...formData, model: detail.selectedOption.value! })}
                    options={modelOptions}
                  />
                </FormField>
              </ColumnLayout>

              <FormField label="Description" constraintText="Describe what this agent does">
                <Textarea
                  value={formData.description}
                  onChange={({ detail }) => setFormData({ ...formData, description: detail.value })}
                  placeholder="This agent specializes in..."
                  rows={3}
                />
              </FormField>

              <FormField label="System Prompt" constraintText="Instructions that define the agent's behavior">
                <Textarea
                  value={formData.systemPrompt}
                  onChange={({ detail }) => setFormData({ ...formData, systemPrompt: detail.value })}
                  placeholder="You are an AI assistant that..."
                  rows={4}
                />
              </FormField>

              <ColumnLayout columns={3}>
                <FormField label="Temperature" constraintText="0.0 = deterministic, 1.0 = creative">
                  <Input
                    type="number"
                    value={formData.temperature.toString()}
                    onChange={({ detail }) => setFormData({ ...formData, temperature: parseFloat(detail.value) || 0.7 })}
                    step={0.1}
                  />
                </FormField>

                <FormField label="Max Tokens" constraintText="Maximum response length">
                  <Input
                    type="number"
                    value={formData.maxTokens.toString()}
                    onChange={({ detail }) => setFormData({ ...formData, maxTokens: parseInt(detail.value) || 8192 })}
                  />
                </FormField>

                <FormField label="Status">
                  <Toggle
                    checked={formData.status === 'active'}
                    onChange={({ detail }) => setFormData({ ...formData, status: detail.checked ? 'active' : 'inactive' })}
                  >
                    {formData.status === 'active' ? 'Active' : 'Inactive'}
                  </Toggle>
                </FormField>
              </ColumnLayout>
            </SpaceBetween>
          </Form>
        </Modal>
      </SpaceBetween>
    </Container>
  );
};

export default AgentsPage;
