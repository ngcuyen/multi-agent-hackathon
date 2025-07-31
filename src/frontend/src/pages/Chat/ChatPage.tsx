import React, { useState, useEffect, useCallback } from 'react';
import {
  AppLayout,
  SideNavigation,
  Header,
  Button,
  SpaceBetween,
  Box,
  Container
} from '@cloudscape-design/components';
import ChatInterface from '../../components/Chat/ChatInterface';
import AgentSelector from '../../components/Agent/AgentSelector';
import { Agent, ChatSession } from '../../types';
import { chatAPI } from '../../services/api';

interface ChatPageProps {
  agents: Agent[];
  loading: boolean;
  onShowSnackbar: (message: string, severity: 'error' | 'success' | 'info' | 'warning') => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ agents, loading, onShowSnackbar }) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const loadChatSessions = useCallback(async () => {
    try {
      const response = await chatAPI.getChatSessions('current-user');
      if (response.success && response.data) {
        setChatSessions(response.data);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      onShowSnackbar('Failed to load chat sessions', 'error');
    }
  }, [onShowSnackbar]);

  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  const handleNewChat = () => {
    setShowAgentSelector(true);
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setCurrentSession(null);
    setShowAgentSelector(false);
  };

  const handleSessionSelect = (session: ChatSession) => {
    setCurrentSession(session);
    const agent = agents.find(a => a.id === session.agentId);
    if (agent) {
      setSelectedAgent(agent);
    }
  };

  const navigationItems = [
    {
      type: 'section' as const,
      text: 'Chat Sessions',
      items: [
        {
          type: 'link' as const,
          text: 'New Chat',
          href: '#new-chat',
          info: <Button variant="icon" iconName="add-plus" onClick={handleNewChat} />
        },
        ...chatSessions.map(session => ({
          type: 'link' as const,
          text: session.title || `Chat ${session.id.slice(0, 8)}`,
          href: `#session-${session.id}`,
          info: session.agentId ? agents.find(a => a.id === session.agentId)?.name : 'Unknown Agent'
        }))
      ]
    }
  ];

  const handleNavigationChange = (event: any) => {
    const href = event.detail.href;
    if (href === '#new-chat') {
      handleNewChat();
    } else if (href.startsWith('#session-')) {
      const sessionId = href.replace('#session-', '');
      const session = chatSessions.find(s => s.id === sessionId);
      if (session) {
        handleSessionSelect(session);
      }
    }
  };

  return (
    <>
      <AppLayout
        navigation={
          <SideNavigation
            header={{
              href: '#',
              text: 'Chat Sessions'
            }}
            items={navigationItems}
            onFollow={handleNavigationChange}
          />
        }
        content={
          <Container>
            <SpaceBetween direction="vertical" size="l">
              <Header
                variant="h1"
                actions={
                  <Button variant="primary" iconName="add-plus" onClick={handleNewChat}>
                    New Chat
                  </Button>
                }
              >
                Multi-Agent Chat
              </Header>

              {selectedAgent ? (
                <ChatInterface
                  agent={selectedAgent}
                  session={currentSession}
                  onShowSnackbar={onShowSnackbar}
                  onSessionUpdate={loadChatSessions}
                />
              ) : (
                <Box textAlign="center" padding="xxl">
                  <SpaceBetween direction="vertical" size="m">
                    <Header variant="h2">Welcome to Multi-Agent Chat</Header>
                    <p>Select an agent to start a conversation or create a new chat session.</p>
                    <Button variant="primary" onClick={handleNewChat}>
                      Choose an Agent
                    </Button>
                  </SpaceBetween>
                </Box>
              )}
            </SpaceBetween>
          </Container>
        }
        toolsHide
        navigationHide={false}
      />

      {/* Agent Selector Modal */}
      <AgentSelector
        agents={agents}
        open={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        onSelect={handleAgentSelect}
      />
    </>
  );
};

export default ChatPage;
