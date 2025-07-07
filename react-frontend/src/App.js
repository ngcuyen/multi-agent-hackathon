import React, { useState, useEffect } from 'react';
import {
  AppLayout,
  TopNavigation,
  SideNavigation,
  Flashbar,
  Spinner
} from '@cloudscape-design/components';

// Import pages
import TextSummarization from './pages/TextSummarization';
import ChatInterface from './pages/ChatInterface';
import DocumentUpload from './pages/DocumentUpload';
import SystemStatus from './pages/SystemStatus';

// Import services
import { checkSystemHealth } from './services/api';

// Import hooks
import { useNotifications } from './hooks/useNotifications';

function App() {
  const [activeNavItem, setActiveNavItem] = useState('summarize');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState('unknown');
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Check system health on app load
  useEffect(() => {
    const performHealthCheck = async () => {
      try {
        const response = await checkSystemHealth();
        if (response.status === 'healthy') {
          setSystemStatus('healthy');
          addNotification({
            type: 'success',
            content: 'Hệ thống hoạt động bình thường!',
            dismissible: true,
            id: 'health-check-success'
          });
        }
      } catch (error) {
        setSystemStatus('error');
        addNotification({
          type: 'error',
          content: 'Không thể kết nối đến hệ thống backend!',
          dismissible: true,
          id: 'health-check-error'
        });
      }
    };

    performHealthCheck();
  }, [addNotification]);

  // Navigation items
  const navigationItems = [
    {
      type: 'link',
      text: 'Tóm tắt văn bản',
      href: '#summarize',
      info: 'Tóm tắt văn bản thông minh'
    },
    {
      type: 'link',
      text: 'Trò chuyện AI',
      href: '#chat',
      info: 'Chat với AI Assistant'
    },
    {
      type: 'link',
      text: 'Upload tài liệu',
      href: '#upload',
      info: 'Xử lý tài liệu'
    },
    {
      type: 'divider'
    },
    {
      type: 'link',
      text: 'Trạng thái hệ thống',
      href: '#status',
      info: 'Giám sát hệ thống'
    }
  ];

  // Handle navigation
  const handleNavigationChange = ({ detail }) => {
    const href = detail.href;
    const navItem = href.replace('#', '');
    setActiveNavItem(navItem);
  };

  // Handle health check
  const handleHealthCheck = async () => {
    setIsLoading(true);
    try {
      const response = await checkSystemHealth();
      if (response.status === 'healthy') {
        setSystemStatus('healthy');
        addNotification({
          type: 'success',
          content: 'Hệ thống hoạt động bình thường!',
          dismissible: true,
          id: 'manual-health-check'
        });
      }
    } catch (error) {
      setSystemStatus('error');
      addNotification({
        type: 'error',
        content: 'Lỗi kết nối hệ thống!',
        dismissible: true,
        id: 'manual-health-error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render current page
  const renderCurrentPage = () => {
    switch (activeNavItem) {
      case 'summarize':
        return <TextSummarization onNotification={addNotification} />;
      case 'chat':
        return <ChatInterface onNotification={addNotification} />;
      case 'upload':
        return <DocumentUpload onNotification={addNotification} />;
      case 'status':
        return <SystemStatus onNotification={addNotification} systemStatus={systemStatus} />;
      default:
        return <TextSummarization onNotification={addNotification} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Flash Messages */}
      <div className="flash-messages">
        <Flashbar items={notifications} onDismiss={removeNotification} />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <Spinner size="large" />
            <h3>Đang kiểm tra hệ thống...</h3>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <TopNavigation
        identity={{
          href: '#',
          title: 'AI Risk Assessment System',
          logo: {
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzAwNzNiYiIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYzIDggMTAgMTAuNjg2MyAxMCAxNEMxMCAxNy4zMTM3IDEyLjY4NjMgMjAgMTYgMjBDMTkuMzEzNyAyMCAyMiAxNy4zMTM3IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
            alt: 'AI Risk Assessment'
          }
        }}
        utilities={[
          {
            type: 'button',
            text: 'Health Check',
            onClick: handleHealthCheck,
            iconName: systemStatus === 'healthy' ? 'status-positive' : 
                     systemStatus === 'error' ? 'status-negative' : 'status-pending'
          },
          {
            type: 'menu-dropdown',
            text: 'Trợ giúp',
            items: [
              {
                id: 'api-docs',
                text: 'API Documentation',
                href: 'http://localhost:8080/docs',
                external: true
              },
              {
                id: 'about',
                text: 'Về hệ thống'
              }
            ]
          }
        ]}
      />

      {/* Main App Layout */}
      <AppLayout
        navigation={
          <SideNavigation
            activeHref={`#${activeNavItem}`}
            header={{
              href: '#',
              text: 'Multi-Agent System'
            }}
            items={navigationItems}
            onFollow={handleNavigationChange}
          />
        }
        content={
          <div className="main-content">
            {renderCurrentPage()}
          </div>
        }
        toolsHide
        navigationHide={false}
      />
    </div>
  );
}

export default App;
