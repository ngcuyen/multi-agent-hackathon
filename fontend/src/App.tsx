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

// Components
import Navigation from './components/Navigation/Navigation';
import { healthAPI } from './services/api';

function App() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [flashbarItems, setFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock agents data for VPBank K-MULT
  useEffect(() => {
    const mockAgents = [
      {
        id: 'supervisor',
        name: 'Supervisor Agent',
        description: 'Orchestrates workflow and coordinates other agents',
        status: 'active',
        model: 'claude-3-sonnet',
        capabilities: ['Workflow Management', 'Agent Coordination', 'Task Distribution']
      },
      {
        id: 'document-intelligence',
        name: 'Document Intelligence Agent',
        description: 'Advanced OCR with deep Vietnamese NLP capabilities',
        status: 'active',
        model: 'claude-3-sonnet',
        capabilities: ['OCR Processing', 'Vietnamese NLP', 'Document Classification']
      },
      {
        id: 'risk-assessment',
        name: 'Risk Assessment Agent',
        description: 'Automated financial analysis and predictive risk modeling',
        status: 'active',
        model: 'claude-3-sonnet',
        capabilities: ['Financial Analysis', 'Risk Modeling', 'Credit Scoring']
      },
      {
        id: 'compliance-validation',
        name: 'Compliance Validation Agent',
        description: 'Validates against UCP 600, ISBP 821, and SBV regulations',
        status: 'active',
        model: 'claude-3-sonnet',
        capabilities: ['UCP 600 Validation', 'ISBP 821 Compliance', 'SBV Regulations']
      },
      {
        id: 'decision-synthesis',
        name: 'Decision Synthesis Agent',
        description: 'Generates evidence-based recommendations with confidence scores',
        status: 'active',
        model: 'claude-3-sonnet',
        capabilities: ['Decision Making', 'Confidence Scoring', 'Report Generation']
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
