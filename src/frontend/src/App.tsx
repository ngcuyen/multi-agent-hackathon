import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  AppLayout, 
  TopNavigation, 
  Flashbar,
  FlashbarProps
} from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Mock Pages
import MockHomePage from './pages/Home/MockHomePage';
import MockTextSummaryPage from './pages/TextSummary/MockTextSummaryPage';
import ChatPage from './pages/Chat/ChatPage';
import AgentsPage from './pages/Agents/AgentsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import LCProcessingPage from './pages/LC/LCProcessingPage';
import CreditAssessmentPage from './pages/Credit/CreditAssessmentPage';

// Enhanced Pages (keep as alternatives)
import KnowledgeBasePage from './pages/Knowledge/KnowledgeBasePage';
import AgentDashboardPage from './pages/Agents/AgentDashboardPage';
import RiskAnalyticsDashboard from './pages/Risk/RiskAnalyticsDashboard';
import PureStrandsInterface from './pages/AI/PureStrandsInterface';
import SystemDashboard from './pages/System/SystemDashboard';

// Components
import Navigation from './components/Navigation/Navigation';
import { mockData } from './data/mockData';

function App() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [flashbarItems, setFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load mock agents data
  useEffect(() => {
    try {
      // Use mock data directly
      setAgents(mockData.agents);
      setLoading(false);
      
      // Show welcome message
      showFlashbar('🎉 VPBank K-MULT Agent Studio loaded successfully with comprehensive mock data', 'success');
    } catch (error) {
      console.error('Failed to load mock data:', error);
      showFlashbar('⚠️ Error loading mock data, using fallback', 'warning');
      setAgents([]);
      setLoading(false);
    }
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
    <ErrorBoundary>
      <Router>
        <div id="app">
          <TopNavigation
            identity={{
              href: "/",
              title: "VPBank K-MULT Agent Studio",
              logo: {
                src: "/logo.png",
                alt: "VPBank K-MULT"
              }
            }}
            utilities={[
              {
                type: "button",
                text: "🎭 Mock Demo Mode",
                variant: "primary-button",
                iconName: "status-positive"
              },
              {
                type: "menu-dropdown",
                text: "Help & Settings",
                iconName: "settings",
                items: [
                  { id: "demo", text: "🎪 Demo Guide" },
                  { id: "features", text: "✨ Features" },
                  { id: "settings", text: "⚙️ Settings" },
                  { id: "support", text: "🆘 Support" }
                ],
                onItemClick: ({ detail }) => {
                  switch (detail.id) {
                    case 'demo':
                      showFlashbar('🎪 Demo Guide: Navigate through all sections to see the complete multi-agent banking platform', 'info');
                      break;
                    case 'features':
                      showFlashbar('✨ Features: 6 Banking Agents, Vietnamese Processing, Real-time Monitoring, Export Capabilities', 'info');
                      break;
                    case 'settings':
                      window.location.href = '/settings';
                      break;
                    case 'support':
                      showFlashbar('🆘 Support: Multi-Agent Hackathon 2025 - Group 181', 'info');
                      break;
                  }
                }
              }
            ]}
          />
          
          <AppLayout
            navigationOpen={navigationOpen}
            onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
            navigation={<Navigation />}
            notifications={<Flashbar items={flashbarItems} />}
            content={
              <ErrorBoundary>
                <Routes>
                  <Route 
                    path="/" 
                    element={<MockHomePage onShowSnackbar={showFlashbar} />} 
                  />
                  <Route 
                    path="/text-summary" 
                    element={<MockTextSummaryPage onShowSnackbar={showFlashbar} />} 
                  />
                  <Route 
                    path="/chat" 
                    element={<ChatPage agents={agents} loading={loading} onShowSnackbar={showFlashbar} />} 
                  />
                  <Route 
                    path="/agents" 
                    element={<AgentsPage agents={agents} setAgents={setAgents} onShowSnackbar={showFlashbar} />} 
                  />
                  <Route 
                    path="/settings" 
                    element={<SettingsPage onShowSnackbar={showFlashbar} />} 
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
                    path="/pure-strands" 
                    element={<PureStrandsInterface onShowSnackbar={showFlashbar} />} 
                  />
                  <Route 
                    path="/system" 
                    element={<SystemDashboard onShowSnackbar={showFlashbar} />} 
                  />
                </Routes>
              </ErrorBoundary>
            }
            toolsHide
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
