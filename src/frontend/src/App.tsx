import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  AppLayout, 
  TopNavigation, 
  Flashbar,
  FlashbarProps
} from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';

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
    // Use mock data directly
    setAgents(mockData.agents);
    setLoading(false);
    
    // Show welcome message
    showFlashbar('VPBank K-MULT Agent Studio loaded with comprehensive mock data', 'success');
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
              src: "/logo.png",
              alt: "VPBank K-MULT"
            }
          }}
          utilities={[
            {
              type: "button",
              text: "Mock Demo Mode",
              variant: "primary-button",
              iconName: "status-positive"
            },
            {
              type: "menu-dropdown",
              text: "Settings",
              iconName: "settings",
              items: [
                { id: "settings", text: "Preferences" },
                { id: "support", text: "Support" },
                { id: "signout", text: "Sign out" }
              ]
            }
          ]}
        />
        
        <AppLayout
          navigationOpen={navigationOpen}
          onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
          navigation={<Navigation />}
          notifications={<Flashbar items={flashbarItems} />}
          content={
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
                element={<ChatPage onShowSnackbar={showFlashbar} />} 
              />
              <Route 
                path="/agents" 
                element={<AgentsPage agents={agents} loading={loading} onShowSnackbar={showFlashbar} />} 
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
          }
          toolsHide
        />
      </div>
    </Router>
  );
}

export default App;
