import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Fab,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Agent } from '../../types';
import { agentAPI } from '../../services/api';

interface AgentsPageProps {
  agents: Agent[];
  onAgentsChange: () => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const AgentsPage: React.FC<AgentsPageProps> = ({ agents, onAgentsChange, onShowSnackbar }) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    description: '',
    model: 'gpt-3.5-turbo',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2048,
    isActive: true,
    capabilities: [],
  });

  const availableModels = [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo',
    'claude-3-sonnet',
    'claude-3-opus',
    'gemini-pro',
  ];

  const availableCapabilities = [
    'text-generation',
    'code-analysis',
    'data-analysis',
    'creative-writing',
    'problem-solving',
    'research',
    'translation',
    'summarization',
  ];

  const handleOpenDialog = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData(agent);
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        description: '',
        model: 'gpt-3.5-turbo',
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 2048,
        isActive: true,
        capabilities: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAgent(null);
  };

  const handleSaveAgent = async () => {
    try {
      if (editingAgent) {
        await agentAPI.updateAgent(editingAgent.id, formData);
        onShowSnackbar('Agent updated successfully', 'success');
      } else {
        await agentAPI.createAgent(formData as Omit<Agent, 'id'>);
        onShowSnackbar('Agent created successfully', 'success');
      }
      onAgentsChange();
      handleCloseDialog();
    } catch (error) {
      onShowSnackbar('Failed to save agent', 'error');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await agentAPI.deleteAgent(agentId);
        onShowSnackbar('Agent deleted successfully', 'success');
        onAgentsChange();
      } catch (error) {
        onShowSnackbar('Failed to delete agent', 'error');
      }
    }
  };

  const handleCapabilityToggle = (capability: string) => {
    const currentCapabilities = formData.capabilities || [];
    const newCapabilities = currentCapabilities.includes(capability)
      ? currentCapabilities.filter(c => c !== capability)
      : [...currentCapabilities, capability];
    
    setFormData({ ...formData, capabilities: newCapabilities });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          AI Agents
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Agent
        </Button>
      </Box>

      {agents.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          No agents found. Create your first agent to get started!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {agents.map((agent) => (
            <Grid xs={12} sm={6} md={4} key={agent.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar 
                      src={agent.avatar} 
                      sx={{ mr: 2, bgcolor: agent.isActive ? 'success.main' : 'grey.400' }}
                    >
                      {agent.name[0]}
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h6" noWrap>
                        {agent.name}
                      </Typography>
                      <Chip 
                        label={agent.isActive ? 'Active' : 'Inactive'}
                        color={agent.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {agent.description}
                  </Typography>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Model: {agent.model}
                    </Typography>
                  </Box>

                  <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                    {agent.capabilities.slice(0, 3).map((capability) => (
                      <Chip
                        key={capability}
                        label={capability}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Chip
                        label={`+${agent.capabilities.length - 3}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Temperature: {agent.temperature} | Max Tokens: {agent.maxTokens}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ChatIcon />}
                    onClick={() => navigate(`/chat/${agent.id}`)}
                  >
                    Chat
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(agent)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteAgent(agent.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Agent Creation/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAgent ? 'Edit Agent' : 'Create New Agent'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Agent Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  >
                    {availableModels.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="System Prompt"
                  multiline
                  rows={4}
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  margin="normal"
                  helperText="Define the agent's role and behavior"
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography gutterBottom>
                  Temperature: {formData.temperature}
                </Typography>
                <Slider
                  value={formData.temperature}
                  onChange={(_, value) => setFormData({ ...formData, temperature: value as number })}
                  min={0}
                  max={2}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Tokens"
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  margin="normal"
                />
              </Grid>
              <Grid xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Capabilities
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {availableCapabilities.map((capability) => (
                    <Chip
                      key={capability}
                      label={capability}
                      clickable
                      color={formData.capabilities?.includes(capability) ? 'primary' : 'default'}
                      onClick={() => handleCapabilityToggle(capability)}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveAgent} 
            variant="contained"
            disabled={!formData.name || !formData.description}
          >
            {editingAgent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgentsPage;
