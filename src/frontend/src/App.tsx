import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  AppLayout, 
  TopNavigation, 
  Flashbar,
  FlashbarProps
} from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';

// Pages
import HomePage from './pages/Home/HomePage';
import TextSummaryPage from './pages/TextSummary/TextSummaryPage';
import ChatPage from './pages/Chat/ChatPage';
import AgentsPage from './pages/Agents/AgentsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import LCProcessingPage from './pages/LC/LCProcessingPage';
import CreditAssessmentPage from './pages/Credit/CreditAssessmentPage';

// New Pages
import KnowledgeBasePage from './pages/Knowledge/KnowledgeBasePage';
import AgentDashboardPage from './pages/Agents/AgentDashboardPage';
import RiskAnalyticsDashboard from './pages/Risk/RiskAnalyticsDashboard';
import PureStrandsInterface from './pages/AI/PureStrandsInterface';
import SystemDashboard from './pages/System/SystemDashboard';

// Components
import Navigation from './components/Navigation/Navigation';
import { healthAPI } from './services/api';

function App() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [flashbarItems, setFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real agents data from backend API
  useEffect(() => {
    const loadRealAgents = async () => {
      try {
        setLoading(true);
        
        // Call real backend API
        const response = await fetch('/api/v1/agents/status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform backend agent data to frontend format
        const transformedAgents = data.agents?.map((agent: any) => ({
          id: agent.agent_id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
          model: 'claude-3.5-sonnet',
          temperature: 0.7,
          maxTokens: 8192,
          capabilities: agent.capabilities || [],
          systemPrompt: `You are ${agent.name.toLowerCase()} responsible for ${agent.description.toLowerCase()}.`,
          createdAt: new Date(),
          updatedAt: new Date(),
          loadPercentage: agent.load_percentage,
          currentTask: agent.current_task,
          lastActivity: agent.last_activity
        })) || [];
        
        setAgents(transformedAgents);
        console.log('✅ Loaded real agents from backend:', transformedAgents.length);
        
      } catch (error) {
        console.error('❌ Failed to load real agents, using fallback:', error);
        
        // Fallback to basic agent structure if API fails
        const fallbackAgents = [
          {
            id: 'supervisor',
            name: 'Supervisor Agent',
            description: 'Orchestrates workflow and coordinates other agents',
            status: 'active' as const,
            model: 'claude-3.5-sonnet',
            temperature: 0.7,
            maxTokens: 8192,
            capabilities: ['Workflow Management', 'Agent Coordination', 'Task Distribution'],
            systemPrompt: 'You are a supervisor agent responsible for coordinating multi-agent workflows.',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        setAgents(fallbackAgents);
      } finally {
        setLoading(false);
      }
    };

    loadRealAgents();
    
    // Set up periodic refresh of agent data every 30 seconds
    const interval = setInterval(loadRealAgents, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const showFlashbar = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    const newItem: FlashbarProps.MessageDefinition = {
      id,
      type,
      content: message,
      dismissible: true,
      onDismiss: () => setFlashbarItems(items => items.filter(item => item.id !== id))
    };
    
    setFlashbarItems(items => [...items, newItem]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setFlashbarItems(items => items.filter(item => item.id !== id));
    }, 5000);
  };

  return (
    <Router>
      <div id="app">
        <TopNavigation
          identity={{
            href: "/",
            title: "VPBank K-MULT Agent Studio",
            logo: {
              src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzIzMkYzRSIvPgo8cGF0aCBkPSJNOCAxMkgxNlYyMEg4VjEyWiIgZmlsbD0iIzAwN0RGRiIvPgo8cGF0aCBkPSJNMTggMTJIMjRWMjBIMThWMTJaIiBmaWxsPSIjMDBBM0ZGIi8+CjxwYXRoIGQ9Ik0xMCA4SDE0VjEwSDEwVjhaIiBmaWxsPSIjRkY5OTAwIi8+CjxwYXRoIGQ9Ik0xOCA4SDIyVjEwSDE4VjhaIiBmaWxsPSIjRkZCMzAwIi8+Cjwvc3ZnPgo=",
              alt: "VPBank K-MULT"
            }
          }}
          utilities={[
            {
              type: "button",
              text: "LC Processing",
              href: "/lc-processing"
            },
            {
              type: "button", 
              text: "Credit Assessment",
              href: "/credit-assessment"
            },
            {
              type: "button",
              text: "Document Intelligence",
              href: "/text-summary"
            },
            {
              type: "button",
              text: "System Health",
              href: "/health"
            }
          ]}
        />
        
        <AppLayout
          navigationOpen={navigationOpen}
          onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
          navigation={<Navigation />}
          notifications={<Flashbar items={flashbarItems} />}
          content={
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Routes>
                <Route path="/" element={<HomePage agents={agents} loading={loading} />} />
                <Route 
                  path="/text-summary" 
                  element={<TextSummaryPage onShowSnackbar={showFlashbar} />} 
                />
                <Route 
                  path="/lc-processing" 
                  element={<LCProcessingPage onShowSnackbar={showFlashbar} />} 
                />
                <Route 
                  path="/credit-assessment" 
                  element={<CreditAssessmentPage onShowSnackbar={showFlashbar} />} 
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
                  path="/agents" 
                  element={
                    <AgentsPage 
                      agents={agents}
                      setAgents={setAgents}
                      onShowSnackbar={showFlashbar}
                    />
                  } 
                />
                {/* New Routes */}
                <Route 
                  path="/knowledge" 
                  element={<KnowledgeBasePage onShowSnackbar={showFlashbar} />} 
                />
                <Route 
                  path="/agent-dashboard" 
                  element={<AgentDashboardPage onShowSnackbar={showFlashbar} />} 
                />
                <Route 
                  path="/risk-analytics" 
                  element={<RiskAnalyticsDashboard onShowSnackbar={showFlashbar} />} 
                />
                <Route 
                  path="/ai-assistant" 
                  element={<PureStrandsInterface onShowSnackbar={showFlashbar} />} 
                />
                <Route 
                  path="/system-dashboard" 
                  element={<SystemDashboard onShowSnackbar={showFlashbar} />} 
                />
                <Route 
                  path="/settings" 
                  element={<SettingsPage onShowSnackbar={showFlashbar} />} 
                />
              </Routes>
            </div>
          }
        />
      </div>
    </Router>
  );
}

export default App;
