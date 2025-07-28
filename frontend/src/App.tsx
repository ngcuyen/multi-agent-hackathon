import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  AppLayout, 
  TopNavigation, 
  Flashbar,
  FlashbarProps,
  Alert,
  StatusIndicator,
  Badge
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

// Components
import Navigation from './components/Navigation/Navigation';

function App() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [flashbarItems, setFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');

  // Check system health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/mutil_agent/public/api/v1/health-check/health');
        if (response.ok) {
          const data = await response.json();
          setSystemHealth(data.status === 'healthy' ? 'healthy' : 'unhealthy');
        } else {
          setSystemHealth('unhealthy');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setSystemHealth('unhealthy');
      }
    };

    checkHealth();
    // Check health every 30 seconds
    const healthInterval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(healthInterval);
  }, []);

  // Mock agents data for VPBank K-MULT
  useEffect(() => {
    const mockAgents = [
      {
        id: 'supervisor',
        name: 'Supervisor Agent',
        description: 'Orchestrates workflow and coordinates other agents',
        status: 'active' as const,
        model: 'claude-3-sonnet',
        temperature: 0.7,
        maxTokens: 8192,
        capabilities: ['Workflow Management', 'Agent Coordination', 'Task Distribution'],
        systemPrompt: 'You are a supervisor agent responsible for coordinating multi-agent workflows.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'document-intelligence',
        name: 'Document Intelligence Agent',
        description: 'Advanced OCR with deep Vietnamese NLP capabilities',
        status: 'active' as const,
        model: 'claude-3-sonnet',
        temperature: 0.5,
        maxTokens: 8192,
        capabilities: ['OCR Processing', 'Vietnamese NLP', 'Document Classification'],
        systemPrompt: 'You are a document intelligence agent specialized in OCR and Vietnamese NLP.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'risk-assessment',
        name: 'Risk Assessment Agent',
        description: 'Automated financial analysis and predictive risk modeling',
        status: 'active' as const,
        model: 'claude-3-sonnet',
        temperature: 0.3,
        maxTokens: 8192,
        capabilities: ['Financial Analysis', 'Risk Modeling', 'Credit Scoring'],
        systemPrompt: 'You are a risk assessment agent specialized in financial analysis and risk modeling.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'compliance-validation',
        name: 'Compliance Validation Agent',
        description: 'Validates against UCP 600, ISBP 821, and SBV regulations',
        status: 'active' as const,
        model: 'claude-3-sonnet',
        temperature: 0.2,
        maxTokens: 8192,
        capabilities: ['UCP 600 Validation', 'ISBP 821 Compliance', 'SBV Regulations'],
        systemPrompt: 'You are a compliance validation agent specialized in banking regulations.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'decision-synthesis',
        name: 'Decision Synthesis Agent',
        description: 'Generates evidence-based recommendations with confidence scores',
        status: 'active' as const,
        model: 'claude-3-sonnet',
        temperature: 0.4,
        maxTokens: 8192,
        capabilities: ['Decision Making', 'Confidence Scoring', 'Report Generation'],
        systemPrompt: 'You are a decision synthesis agent that generates evidence-based recommendations.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    setTimeout(() => {
      setAgents(mockAgents);
      setLoading(false);
    }, 1000);
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

  // Get health status indicator
  const getHealthIndicator = () => {
    switch (systemHealth) {
      case 'healthy':
        return <StatusIndicator type="success">System Operational</StatusIndicator>;
      case 'unhealthy':
        return <StatusIndicator type="error">System Issues</StatusIndicator>;
      default:
        return <StatusIndicator type="loading">Checking Status</StatusIndicator>;
    }
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
              type: "menu-dropdown",
              text: getHealthIndicator(),
              items: [
                {
                  id: "health-check",
                  text: "System Health Check",
                  href: "/mutil_agent/public/api/v1/health-check/health",
                  external: true
                },
                {
                  id: "api-docs",
                  text: "API Documentation",
                  href: "/docs",
                  external: true
                },
                {
                  id: "github",
                  text: "Source Repository",
                  href: "https://github.com/ngcuyen/multi-agent-hackathon",
                  external: true
                }
              ]
            }
          ]}
        />
        
        <AppLayout
          navigationOpen={navigationOpen}
          onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
          navigation={<Navigation />}
          notifications={<Flashbar items={flashbarItems} />}
          toolsHide
          content={
            <>
              {/* System Health Alert */}
              {systemHealth === 'unhealthy' && (
                <Alert
                  statusIconAriaLabel="Error"
                  type="error"
                  header="System Warning"
                  dismissible
                  onDismiss={() => setSystemHealth('checking')}
                >
                  The backend system is experiencing issues. Some features may not work properly.
                  Please try again later or contact the system administrator.
                </Alert>
              )}
              
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <HomePage 
                      agents={agents} 
                      loading={loading} 
                    />
                  } 
                />
                <Route 
                  path="/text-summary" 
                  element={
                    <TextSummaryPage 
                      onShowSnackbar={showFlashbar}
                    />
                  } 
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
                      loading={loading}
                      onShowSnackbar={showFlashbar}
                    />
                  } 
                />
                <Route 
                  path="/lc-processing" 
                  element={
                    <LCProcessingPage 
                      onShowSnackbar={showFlashbar}
                    />
                  } 
                />
                <Route 
                  path="/credit-assessment" 
                  element={
                    <CreditAssessmentPage 
                      onShowSnackbar={showFlashbar}
                    />
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <SettingsPage 
                      onShowSnackbar={showFlashbar}
                    />
                  } 
                />
              </Routes>
            </>
          }
        />
      </div>
    </Router>
  );
}

export default App;
