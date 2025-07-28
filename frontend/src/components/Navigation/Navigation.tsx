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
          info: "System overview and analytics"
        },
        {
          type: "link" as const, 
          text: "AI Agents",
          href: "/agents",
          info: "Multi-agent system management"
        }
      ]
    },
    {
      type: "section" as const,
      text: "Banking Operations",
      items: [
        {
          type: "link" as const,
          text: "Letter of Credit Processing",
          href: "/lc-processing",
          info: "LC document processing and validation"
        },
        {
          type: "link" as const,
          text: "Credit Risk Assessment", 
          href: "/credit-assessment",
          info: "Credit scoring and risk analysis"
        },
        {
          type: "link" as const,
          text: "Document Intelligence",
          href: "/text-summary",
          info: "Document analysis and summarization"
        }
      ]
    },
    {
      type: "section" as const,
      text: "AI Services",
      items: [
        {
          type: "link" as const,
          text: "AI Assistant",
          href: "/chat",
          info: "Interactive AI consultation"
        }
      ]
    },
    {
      type: "divider" as const
    },
    {
      type: "section" as const,
      text: "System Administration",
      items: [
        {
          type: "link" as const,
          text: "Settings",
          href: "/settings",
          info: "System configuration"
        },
        {
          type: "link" as const,
          text: "Analytics & Reports",
          href: "/analytics",
          info: "Performance analytics and reporting"
        },
        {
          type: "link" as const,
          text: "Documentation",
          href: "/documentation",
          info: "User guides and technical documentation"
        }
      ]
    },
    {
      type: "section" as const,
      text: "External Resources",
      items: [
        {
          type: "link" as const,
          text: "API Documentation",
          href: "http://localhost:8080/docs",
          external: true,
          info: "REST API documentation"
        },
        {
          type: "link" as const,
          text: "System Health",
          href: "http://localhost:8080/mutil_agent/public/api/v1/health-check/health",
          external: true,
          info: "Real-time system monitoring"
        },
        {
          type: "link" as const,
          text: "Source Repository",
          href: "https://github.com/ngcuyen/multi-agent-hackathon",
          external: true,
          info: "Project source code and documentation"
        }
      ]
    }
  ];

  const handleFollow = (event: any) => {
    if (!event.detail.external) {
      event.preventDefault();
      navigate(event.detail.href);
    }
  };

  return (
    <SideNavigation
      activeHref={location.pathname}
      header={{
        href: "/",
        text: "VPBank K-MULT"
      }}
      items={navigationItems}
      onFollow={handleFollow}
    />
  );
};

export default Navigation;
