import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid2 as Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Agent, ModelConfig } from '../../types';
import { agentAPI, modelAPI } from '../../services/api';

interface AgentSelectorProps {
  selectedAgent?: Agent;
  onAgentSelect: (agent: Agent) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentSelect,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: '',
    description: '',
    model: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2048,
    isActive: true,
    capabilities: [],
  });

  useEffect(() => {
    loadAgents();
    loadModels();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await agentAPI.getAgents();
      if (response.success && response.data) {
        setAgents(response.data);
        if (!selectedAgent && response.data.length > 0) {
          onAgentSelect(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadModels = async () => {
    try {
      const response = await modelAPI.getModels();
      if (response.success && response.data) {
        setModels(response.data);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleCreateAgent = async () => {
    try {
      const response = await agentAPI.createAgent(newAgent as Omit<Agent, 'id'>);
      if (response.success && response.data) {
        setAgents(prev => [...prev, response.data!]);
        setIsCreateDialogOpen(false);
        resetNewAgent();
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;
    
    try {
      const response = await agentAPI.updateAgent(editingAgent.id, newAgent);
      if (response.success && response.data) {
        setAgents(prev => prev.map(agent => 
          agent.id === editingAgent.id ? response.data! : agent
        ));
        setEditingAgent(null);
        resetNewAgent();
      }
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await agentAPI.deleteAgent(agentId);
      if (response.success) {
        setAgents(prev => prev.filter(agent => agent.id !== agentId));
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const resetNewAgent = () => {
    setNewAgent({
      name: '',
      description: '',
      model: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 2048,
      isActive: true,
      capabilities: [],
    });
  };

  const openCreateDialog = () => {
    resetNewAgent();
    setEditingAgent(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (agent: Agent) => {
    setNewAgent(agent);
    setEditingAgent(agent);
    setIsCreateDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">AI Agents</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={openCreateDialog}
        >
          Create Agent
        </Button>
      </Box>

      <Grid container spacing={2}>
        {agents.map((agent) => (
          <Grid xs={12} sm={6} md={4} key={agent.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedAgent?.id === agent.id ? 2 : 1,
                borderColor: selectedAgent?.id === agent.id ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 3,
                },
              }}
              onClick={() => onAgentSelect(agent)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <BotIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" noWrap>
                      {agent.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {agent.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={agent.model}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label={agent.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={agent.isActive ? 'success' : 'default'}
                    sx={{ mb: 1 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(agent);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAgent(agent.id);
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Agent Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAgent ? 'Edit Agent' : 'Create New Agent'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Agent Name"
              value={newAgent.name}
              onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            
            <TextField
              label="Description"
              value={newAgent.description}
              onChange={(e) => setNewAgent(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />

            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={newAgent.model}
                onChange={(e) => setNewAgent(prev => ({ ...prev, model: e.target.value }))}
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="System Prompt"
              value={newAgent.systemPrompt}
              onChange={(e) => setNewAgent(prev => ({ ...prev, systemPrompt: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              placeholder="You are a helpful AI assistant..."
            />

            <Box>
              <Typography gutterBottom>Temperature: {newAgent.temperature}</Typography>
              <Slider
                value={newAgent.temperature}
                onChange={(_, value) => setNewAgent(prev => ({ ...prev, temperature: value as number }))}
                min={0}
                max={2}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <TextField
              label="Max Tokens"
              type="number"
              value={newAgent.maxTokens}
              onChange={(e) => setNewAgent(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newAgent.isActive}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingAgent ? handleUpdateAgent : handleCreateAgent}
            variant="contained"
          >
            {editingAgent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentSelector;
