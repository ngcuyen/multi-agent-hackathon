import React from 'react';
import { SideNavigation } from '@cloudscape-design/components';
import { useLocation, useNavigate } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      type: "section" as const,
      text: "VPBank K-MULT Studio",
      items: [
        {
          type: "link" as const,
          text: "Dashboard",
          href: "/",
          info: <span>🏠</span>
        },
        {
          type: "link" as const, 
          text: "System Monitor",
          href: "/system",
          info: <span>🖥️</span>
        }
      ]
    },
    {
      type: "section" as const,
      text: "Banking Operations",
      items: [
        {
          type: "link" as const,
          text: "Document Processing",
          href: "/text-summary",
          info: <span>📄</span>
        },
        {
          type: "link" as const,
          text: "LC Processing",
          href: "/lc-processing",
          info: <span>💳</span>
        },
        {
          type: "link" as const,
          text: "Credit Assessment", 
          href: "/credit-assessment",
          info: <span>💰</span>
        }
      ]
    },
    {
      type: "section" as const,
      text: "AI & Analytics",
      items: [
        {
          type: "link" as const,
          text: "Agent Dashboard",
          href: "/agent-dashboard",
          info: <span>🤖</span>
        },
        {
          type: "link" as const,
          text: "Pure Strands AI",
          href: "/pure-strands",
          info: <span>⚡</span>
        },
        {
          type: "link" as const,
          text: "Risk Analytics",
          href: "/risk-analytics",
          info: <span>📊</span>
        },
        {
          type: "link" as const,
          text: "Knowledge Base",
          href: "/knowledge",
          info: <span>🧠</span>
        }
      ]
    },
    {
      type: "section" as const,
      text: "Management",
      items: [
        {
          type: "link" as const,
          text: "Agent Management",
          href: "/agents",
          info: <span>🔧</span>
        },
        {
          type: "link" as const,
          text: "Chat Interface",
          href: "/chat",
          info: <span>💬</span>
        },
        {
          type: "link" as const,
          text: "Settings",
          href: "/settings",
          info: <span>⚙️</span>
        }
      ]
    }
  ];

  return (
    <SideNavigation
      activeHref={location.pathname}
      header={{
        href: "/",
        text: "VPBank K-MULT"
      }}
      onFollow={(event) => {
        if (!event.detail.external) {
          event.preventDefault();
          navigate(event.detail.href);
        }
      }}
      items={navigationItems}
    />
  );
};

export default Navigation;
