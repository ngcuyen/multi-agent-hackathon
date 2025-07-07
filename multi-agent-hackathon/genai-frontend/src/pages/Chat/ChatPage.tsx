import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Add as AddIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import ChatInterface from '../../components/Chat/ChatInterface';
import AgentSelector from '../../components/Agent/AgentSelector';
import { Agent, ChatSession } from '../../types';
import { chatAPI } from '../../services/api';

const DRAWER_WIDTH = 300;

const ChatPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      const response = await chatAPI.getSessions();
      if (response.success && response.data) {
        setChatSessions(response.data);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNewChat = () => {
    setCurrentSession(null);
    setShowAgentSelector(true);
  };

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session);
    setShowAgentSelector(false);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentSelector(false);
  };

  const handleNewSession = async (sessionId: string) => {
    // Reload sessions to include the new one
    await loadChatSessions();
    
    // Find and select the new session
    const newSession = chatSessions.find(s => s.id === sessionId);
    if (newSession) {
      setCurrentSession(newSession);
    }
  };

  const formatSessionTitle = (session: ChatSession) => {
    return session.title || `Chat ${new Date(session.createdAt).toLocaleDateString()}`;
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          GenAI Chat
        </Typography>
      </Toolbar>
      <Divider />
      
      <List>
        <ListItem>
          <ListItemButton onClick={handleNewChat}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="New Chat" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Divider />
      
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Recent Chats
        </Typography>
      </Box>
      
      <List>
        {chatSessions.map((session) => (
          <ListItem key={session.id} disablePadding>
            <ListItemButton
              selected={currentSession?.id === session.id}
              onClick={() => handleSessionSelect(session)}
            >
              <ListItemIcon>
                <ChatIcon />
              </ListItemIcon>
              <ListItemText
                primary={formatSessionTitle(session)}
                secondary={new Date(session.updatedAt).toLocaleDateString()}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {chatSessions.length === 0 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No chat history yet
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {showAgentSelector
              ? 'Select an Agent'
              : selectedAgent
              ? `Chat with ${selectedAgent.name}`
              : 'GenAI Chat'
            }
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {showAgentSelector ? (
            <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
              <AgentSelector
                selectedAgent={selectedAgent || undefined}
                onAgentSelect={handleAgentSelect}
              />
            </Box>
          ) : selectedAgent ? (
            <ChatInterface
              agent={selectedAgent}
              sessionId={currentSession?.id}
              onNewSession={handleNewSession}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                p: 3,
              }}
            >
              <Typography variant="h4" gutterBottom>
                Welcome to GenAI Chat
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Select an agent to start chatting or create a new conversation
              </Typography>
              <Fab
                color="primary"
                aria-label="new chat"
                onClick={handleNewChat}
              >
                <AddIcon />
              </Fab>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPage;
