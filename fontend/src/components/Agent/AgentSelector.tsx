import React, { useState } from 'react';
import {
  Modal,
  Box,
  Header,
  SpaceBetween,
  Button,
  Badge,
  TextContent,
  ColumnLayout
} from '@cloudscape-design/components';
import { Agent } from '../../types';

interface AgentSelectorProps {
  agents: Agent[];
  open: boolean;
  onClose: () => void;
  onSelect: (agent: Agent) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  open,
  onClose,
  onSelect,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleConfirmSelect = () => {
    if (selectedAgent) {
      onSelect(selectedAgent);
      onClose();
    }
  };

  return (
    <Modal
      visible={open}
      onDismiss={onClose}
      header="Select an Agent"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirmSelect}
              disabled={!selectedAgent}
            >
              Start Chat
            </Button>
          </SpaceBetween>
        </Box>
      }
      size="large"
    >
      <SpaceBetween direction="vertical" size="l">
        <TextContent>
          <p>Choose an AI agent to start your conversation. Each agent has different capabilities and specializations.</p>
        </TextContent>

        {agents.length === 0 ? (
          <Box textAlign="center" padding="l">
            <TextContent>
              <p>No agents available. Please create an agent first.</p>
            </TextContent>
            <Button variant="primary" href="/agents">
              Create Agent
            </Button>
          </Box>
        ) : (
          <ColumnLayout columns={1}>
            {agents.map(agent => (
              <div
                key={agent.id}
                style={{
                  padding: '16px',
                  border: selectedAgent?.id === agent.id ? '2px solid #0073bb' : '1px solid #e9ebed',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedAgent?.id === agent.id ? '#f0f8ff' : 'white',
                  marginBottom: '8px'
                }}
                onClick={() => handleAgentSelect(agent)}
              >
                <SpaceBetween direction="vertical" size="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Header variant="h3">🤖 {agent.name}</Header>
                    <Badge color={agent.status === 'active' ? 'green' : 'grey'}>
                      {agent.status}
                    </Badge>
                  </SpaceBetween>
                  
                  <TextContent>
                    <p>{agent.description}</p>
                  </TextContent>

                  <ColumnLayout columns={3} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Model</Box>
                      <div>{agent.model || 'Claude 3.7 Sonnet'}</div>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Temperature</Box>
                      <div>{agent.temperature || '0.7'}</div>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Max Tokens</Box>
                      <div>{agent.maxTokens || '8192'}</div>
                    </div>
                  </ColumnLayout>

                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <SpaceBetween direction="horizontal" size="xs">
                      {agent.capabilities.map((capability, index) => (
                        <Badge key={index} color="blue">
                          {capability}
                        </Badge>
                      ))}
                    </SpaceBetween>
                  )}
                </SpaceBetween>
              </div>
            ))}
          </ColumnLayout>
        )}
      </SpaceBetween>
    </Modal>
  );
};

export default AgentSelector;
