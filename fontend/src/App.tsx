import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import '@cloudscape-design/global-styles/index.css';
import { TopNavigation, Flashbar, FlashbarProps } from '@cloudscape-design/components';
import ChatPage from './pages/Chat/ChatPage';
import Dashboard from './components/Dashboard/Dashboard';
import Navigation from './components/Navigation/Navigation';
import HomePage from './pages/Home/HomePage';
import AgentsPage from './pages/Agents/AgentsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import TextSummaryPage from './pages/TextSummary/TextSummaryPage';
import HealthCheck from './components/HealthCheck';
import { agentAPI } from './services/api';
import { Agent } from './types';

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashbarItems, setFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>([]);

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await agentAPI.getAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      } else {
        throw new Error('Failed to load agents');
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
      setError('Failed to connect to backend. Please ensure the API server is running.');
      showFlashbar('Failed to load agents. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load agents on app start
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const showFlashbar = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    const newItem: FlashbarProps.MessageDefinition = {
      id,
      type,
      content: message,
      dismissible: true,
      onDismiss: () => {
        setFlashbarItems(items => items.filter(item => item.id !== id));
      }
    };
    setFlashbarItems(items => [...items, newItem]);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setFlashbarItems(items => items.filter(item => item.id !== id));
    }, 6000);
  };

  return (
    <Router>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopNavigation
          identity={{
            href: "/",
            title: "🤖 Multi-Agent AI Risk Assessment"
          }}
          utilities={[
            {
              type: "button",
              text: "Tóm tắt văn bản",
              href: "/text-summary"
            },
            {
              type: "button",
              text: "Kiểm tra hệ thống",
              href: "/health"
            },
            {
              type: "button", 
              text: "Cài đặt",
              href: "/settings"
            }
          ]}
        />
        
        <div style={{ flex: 1, display: 'flex' }}>
          <Navigation />
          
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<HomePage agents={agents} loading={loading} />} />
              <Route 
                path="/text-summary" 
                element={<TextSummaryPage onShowSnackbar={showFlashbar} />} 
              />
              <Route 
                path="/chat" 
                element={
                  <ChatPage 
                    agents={agents} 
                    loading={loading} 
                    onShowSnackbar={showFlashbar}
                  />
                } 
              />
              <Route 
                path="/chat/:agentId" 
                element={
                  <ChatPage 
                    agents={agents} 
                    loading={loading} 
                    onShowSnackbar={showFlashbar}
                  />
                } 
              />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route 
                path="/agents" 
                element={
                  <AgentsPage 
                    agents={agents} 
                    onAgentsChange={loadAgents}
                    onShowSnackbar={showFlashbar}
                  />
                } 
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/health" element={<HealthCheck />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>

        {/* Global Flashbar for notifications */}
        <Flashbar items={flashbarItems} />

        {/* Connection Error Display */}
        {error && (
          <Flashbar 
            items={[{
              id: 'connection-error',
              type: 'error',
              content: error,
              dismissible: true,
              onDismiss: () => setError(null)
            }]}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
