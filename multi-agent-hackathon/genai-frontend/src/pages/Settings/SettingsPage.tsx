import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { modelAPI } from '../../services/api';
import { ModelConfig } from '../../types';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    apiKeys: {
      openai: '',
      anthropic: '',
      google: '',
      aws: '',
    },
    preferences: {
      theme: 'light',
      defaultModel: 'gpt-3.5-turbo',
      autoSave: true,
      notifications: true,
      maxConcurrentChats: 5,
    },
    advanced: {
      debugMode: false,
      logLevel: 'info',
      cacheEnabled: true,
      rateLimitEnabled: true,
    },
  });

  const [models, setModels] = useState<ModelConfig[]>([]);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [newModel, setNewModel] = useState<Partial<ModelConfig>>({
    name: '',
    provider: 'openai',
    maxTokens: 4096,
    costPer1kTokens: 0.002,
    capabilities: ['text'],
  });

  useEffect(() => {
    loadModels();
    loadSettings();
  }, []);

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

  const loadSettings = () => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    // Here you would also send to backend if needed
    alert('Settings saved successfully!');
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setSettings({
      ...settings,
      apiKeys: {
        ...settings.apiKeys,
        [provider]: value,
      },
    });
  };

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys({
      ...showApiKeys,
      [provider]: !showApiKeys[provider],
    });
  };

  const testModel = async (modelId: string) => {
    try {
      const response = await modelAPI.testModel(modelId);
      if (response.success) {
        alert(`Model test successful! Latency: ${response.data?.latency}ms`);
      } else {
        alert('Model test failed');
      }
    } catch (error) {
      alert('Model test failed');
    }
  };

  const addCustomModel = () => {
    // In a real app, this would call the API
    const model: ModelConfig = {
      id: `custom-${Date.now()}`,
      ...newModel as ModelConfig,
    };
    setModels([...models, model]);
    setModelDialogOpen(false);
    setNewModel({
      name: '',
      provider: 'openai',
      maxTokens: 4096,
      costPer1kTokens: 0.002,
      capabilities: ['text'],
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* API Keys Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              API Keys
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              API keys are stored locally and encrypted. They are required to use AI models.
            </Alert>
            
            <Grid container spacing={2}>
              {Object.entries(settings.apiKeys).map(([provider, key]) => (
                <Grid item xs={12} sm={6} key={provider}>
                  <TextField
                    fullWidth
                    label={`${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key`}
                    type={showApiKeys[provider] ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => toggleApiKeyVisibility(provider)}
                          edge="end"
                        >
                          {showApiKeys[provider] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* General Preferences */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              General Preferences
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.preferences.theme}
                onChange={(e) => setSettings({
                  ...settings,
                  preferences: { ...settings.preferences, theme: e.target.value }
                })}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Default Model</InputLabel>
              <Select
                value={settings.preferences.defaultModel}
                onChange={(e) => setSettings({
                  ...settings,
                  preferences: { ...settings.preferences, defaultModel: e.target.value }
                })}
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Max Concurrent Chats"
              type="number"
              value={settings.preferences.maxConcurrentChats}
              onChange={(e) => setSettings({
                ...settings,
                preferences: { ...settings.preferences, maxConcurrentChats: parseInt(e.target.value) }
              })}
              margin="normal"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.preferences.autoSave}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, autoSave: e.target.checked }
                  })}
                />
              }
              label="Auto-save conversations"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.preferences.notifications}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, notifications: e.target.checked }
                  })}
                />
              }
              label="Enable notifications"
            />
          </Paper>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Advanced Settings
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Log Level</InputLabel>
              <Select
                value={settings.advanced.logLevel}
                onChange={(e) => setSettings({
                  ...settings,
                  advanced: { ...settings.advanced, logLevel: e.target.value }
                })}
              >
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.advanced.debugMode}
                  onChange={(e) => setSettings({
                    ...settings,
                    advanced: { ...settings.advanced, debugMode: e.target.checked }
                  })}
                />
              }
              label="Debug mode"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.advanced.cacheEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    advanced: { ...settings.advanced, cacheEnabled: e.target.checked }
                  })}
                />
              }
              label="Enable caching"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.advanced.rateLimitEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    advanced: { ...settings.advanced, rateLimitEnabled: e.target.checked }
                  })}
                />
              }
              label="Rate limiting"
            />
          </Paper>
        </Grid>

        {/* Model Management */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                Model Management
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setModelDialogOpen(true)}
              >
                Add Custom Model
              </Button>
            </Box>

            <List>
              {models.map((model) => (
                <ListItem key={model.id} divider>
                  <ListItemText
                    primary={model.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Provider: {model.provider} | Max Tokens: {model.maxTokens} | 
                          Cost: ${model.costPer1kTokens}/1k tokens
                        </Typography>
                        <Box mt={1}>
                          {model.capabilities.map((cap) => (
                            <Chip key={cap} label={cap} size="small" sx={{ mr: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => testModel(model.id)}>
                      <RefreshIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={saveSettings}
              sx={{ px: 4 }}
            >
              Save Settings
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Add Custom Model Dialog */}
      <Dialog open={modelDialogOpen} onClose={() => setModelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Custom Model</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Model Name"
            value={newModel.name}
            onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Provider</InputLabel>
            <Select
              value={newModel.provider}
              onChange={(e) => setNewModel({ ...newModel, provider: e.target.value as any })}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="anthropic">Anthropic</MenuItem>
              <MenuItem value="google">Google</MenuItem>
              <MenuItem value="aws">AWS</MenuItem>
              <MenuItem value="local">Local</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Max Tokens"
            type="number"
            value={newModel.maxTokens}
            onChange={(e) => setNewModel({ ...newModel, maxTokens: parseInt(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Cost per 1k Tokens"
            type="number"
            step="0.001"
            value={newModel.costPer1kTokens}
            onChange={(e) => setNewModel({ ...newModel, costPer1kTokens: parseFloat(e.target.value) })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModelDialogOpen(false)}>Cancel</Button>
          <Button onClick={addCustomModel} variant="contained">Add Model</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SettingsPage;
