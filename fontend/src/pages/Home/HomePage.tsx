import React from 'react';
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
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Chat as ChatIcon,
  SmartToy as AgentIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Agent } from '../../types';

interface HomePageProps {
  agents: Agent[];
  loading: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ agents, loading }) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <ChatIcon color="primary" />,
      title: 'Multi-Agent Chat',
      description: 'Interact with multiple AI agents simultaneously for complex problem solving.',
      action: () => navigate('/chat'),
    },
    {
      icon: <AgentIcon color="secondary" />,
      title: 'Agent Management',
      description: 'Create, configure, and manage your AI agents with custom capabilities.',
      action: () => navigate('/agents'),
    },
    {
      icon: <DashboardIcon color="success" />,
      title: 'Analytics Dashboard',
      description: 'Monitor usage, performance, and costs across all your AI interactions.',
      action: () => navigate('/dashboard'),
    },
    {
      icon: <SettingsIcon color="warning" />,
      title: 'Configuration',
      description: 'Customize models, API keys, and system preferences.',
      action: () => navigate('/settings'),
    },
  ];

  const capabilities = [
    { icon: <TrendingUpIcon />, text: 'Real-time Analytics' },
    { icon: <SpeedIcon />, text: 'High Performance' },
    { icon: <SecurityIcon />, text: 'Secure & Private' },
    { icon: <CloudUploadIcon />, text: 'File Processing' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom color="primary">
          GenAI Multi-Agent Platform
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Harness the power of multiple AI agents working together to solve complex problems
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<ChatIcon />}
          onClick={() => navigate('/chat')}
          sx={{ mt: 2, px: 4, py: 1.5 }}
        >
          Start Chatting
        </Button>
      </Box>

      {/* Agent Status */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Agent Status
        </Typography>
        {loading ? (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Loading agents...
            </Typography>
            <LinearProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" gutterBottom>
              <strong>{agents.length}</strong> agents available
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
              {agents.slice(0, 6).map((agent) => (
                <Chip
                  key={agent.id}
                  avatar={<Avatar src={agent.avatar}>{agent.name[0]}</Avatar>}
                  label={agent.name}
                  color={agent.isActive ? 'success' : 'default'}
                  variant={agent.isActive ? 'filled' : 'outlined'}
                  onClick={() => navigate(`/chat/${agent.id}`)}
                />
              ))}
              {agents.length > 6 && (
                <Chip
                  label={`+${agents.length - 6} more`}
                  variant="outlined"
                  onClick={() => navigate('/agents')}
                />
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Features Grid */}
      <Typography variant="h4" gutterBottom mb={3}>
        Platform Features
      </Typography>
      <Grid container spacing={3} mb={6}>
        {features.map((feature, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={feature.action}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box mb={2}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button size="small" color="primary">
                  Explore
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Capabilities */}
      <Grid container spacing={4}>
        <Grid xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Platform Capabilities
            </Typography>
            <List>
              {capabilities.map((capability, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {capability.icon}
                  </ListItemIcon>
                  <ListItemText primary={capability.text} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Quick Start
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="1. Configure your AI models"
                  secondary="Set up API keys and model preferences in Settings"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Create or select agents"
                  secondary="Choose from pre-built agents or create custom ones"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Start chatting"
                  secondary="Begin conversations with single or multiple agents"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Monitor performance"
                  secondary="Track usage and optimize your AI interactions"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;
