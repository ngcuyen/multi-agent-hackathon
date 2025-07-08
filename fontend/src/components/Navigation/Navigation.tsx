import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SideNavigation, SideNavigationProps } from '@cloudscape-design/components';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: SideNavigationProps.Item[] = [
    {
      type: 'link',
      text: 'Trang chủ',
      href: '/'
    },
    {
      type: 'link', 
      text: 'Dashboard',
      href: '/dashboard'
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: 'AI Services',
      items: [
        {
          type: 'link',
          text: 'Tóm tắt văn bản',
          href: '/text-summary'
        },
        {
          type: 'link',
          text: 'Chat với AI',
          href: '/chat'
        }
      ]
    },
    {
      type: 'divider'
    },
    {
      type: 'link',
      text: 'Quản lý Agent',
      href: '/agents'
    },
    {
      type: 'divider'
    },
    {
      type: 'link',
      text: 'Cài đặt',
      href: '/settings'
    },
    {
      type: 'link',
      text: 'Kiểm tra hệ thống',
      href: '/health'
    }
  ];

  const handleFollow = (event: CustomEvent<SideNavigationProps.FollowDetail>) => {
    if (!event.detail.external) {
      event.preventDefault();
      navigate(event.detail.href);
    }
  };

  return (
    <div style={{ width: '280px', height: '100%', borderRight: '1px solid #e9ebed' }}>
      <SideNavigation
        activeHref={location.pathname}
        header={{
          href: '/',
          text: 'Multi-Agent AI'
        }}
        items={navigationItems}
        onFollow={handleFollow}
      />
    </div>
  );
};

export default Navigation;
