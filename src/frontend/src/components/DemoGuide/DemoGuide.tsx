import React, { useState } from 'react';
import {
  Modal,
  Header,
  SpaceBetween,
  Box,
  Button,
  Steps,
  Alert,
  KeyValuePairs,
  Badge,
  Link
} from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';

interface DemoGuideProps {
  visible: boolean;
  onDismiss: () => void;
}

const DemoGuide: React.FC<DemoGuideProps> = ({ visible, onDismiss }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const demoSteps = [
    {
      title: "🏠 Dashboard Overview",
      description: "Start with the main dashboard to see the complete system overview",
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Box>
            The main dashboard showcases the complete VPBank K-MULT Agent Studio with:
          </Box>
          <KeyValuePairs
            columns={1}
            items={[
              { label: "Real-time Agent Monitoring", value: "6 specialized banking agents with live performance metrics" },
              { label: "System Health", value: "8 services monitored with detailed health checks" },
              { label: "Performance Charts", value: "Live data visualization with agent load distribution" },
              { label: "Task Coordination", value: "Real-time task assignment and coordination history" }
            ]}
          />
          <Button
            variant="primary"
            onClick={() => {
              navigate('/');
              onDismiss();
            }}
          >
            Go to Dashboard
          </Button>
        </SpaceBetween>
      )
    },
    {
      title: "📄 Vietnamese Document Processing",
      description: "Experience advanced Vietnamese text and document processing",
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Box>
            Our Vietnamese text processing system demonstrates:
          </Box>
          <KeyValuePairs
            columns={1}
            items={[
              { label: "Vietnamese NLP", value: "Advanced language processing with banking terminology" },
              { label: "Document Upload", value: "Support for .txt, .pdf, .docx, .doc files" },
              { label: "Summary Types", value: "5 different summary types for various use cases" },
              { label: "Export Features", value: "Export results in TXT and JSON formats" }
            ]}
          />
          <Button
            variant="primary"
            onClick={() => {
              navigate('/text-summary');
              onDismiss();
            }}
          >
            Try Text Processing
          </Button>
        </SpaceBetween>
      )
    },
    {
      title: "🤖 Multi-Agent Coordination",
      description: "See advanced AI agent coordination in action",
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Box>
            The agent dashboard shows our multi-agent system:
          </Box>
          <KeyValuePairs
            columns={1}
            items={[
              { label: "6 Specialized Agents", value: "Supervisor, Document Intelligence, Risk Assessment, Compliance, Decision Synthesis, Process Automation" },
              { label: "Real-time Coordination", value: "Live task assignment and load balancing" },
              { label: "Performance Monitoring", value: "Detailed metrics and health tracking" },
              { label: "Task History", value: "Complete coordination history with status tracking" }
            ]}
          />
          <Button
            variant="primary"
            onClick={() => {
              navigate('/agent-dashboard');
              onDismiss();
            }}
          >
            View Agent Dashboard
          </Button>
        </SpaceBetween>
      )
    },
    {
      title: "🖥️ System Monitoring",
      description: "Enterprise-grade system health monitoring",
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Box>
            Professional system monitoring includes:
          </Box>
          <KeyValuePairs
            columns={1}
            items={[
              { label: "8 Services Monitored", value: "Document Intelligence, Risk Assessment, Compliance, Text Processing, Agent Coordination, Knowledge Base, Database, AI Models" },
              { label: "Health Checks", value: "Real-time health status with response times" },
              { label: "Performance Metrics", value: "Detailed service capabilities and features" },
              { label: "Enterprise Monitoring", value: "Production-ready monitoring interface" }
            ]}
          />
          <Button
            variant="primary"
            onClick={() => {
              navigate('/system');
              onDismiss();
            }}
          >
            View System Monitor
          </Button>
        </SpaceBetween>
      )
    },
    {
      title: "🏦 Banking Operations",
      description: "Complete banking process automation",
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Box>
            Explore our banking-specific features:
          </Box>
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Badge color="blue">LC Processing</Badge> - Letter of Credit processing with UCP 600 compliance
            </Box>
            <Box>
              <Badge color="green">Credit Assessment</Badge> - Automated risk analysis and scoring
            </Box>
            <Box>
              <Badge color="orange">Knowledge Base</Badge> - 1,250 banking documents with semantic search
            </Box>
            <Box>
              <Badge color="red">Risk Analytics</Badge> - Market data and risk assessment dashboard
            </Box>
          </SpaceBetween>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => { navigate('/lc-processing'); onDismiss(); }}>
              LC Processing
            </Button>
            <Button onClick={() => { navigate('/credit-assessment'); onDismiss(); }}>
              Credit Assessment
            </Button>
            <Button onClick={() => { navigate('/knowledge'); onDismiss(); }}>
              Knowledge Base
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      )
    }
  ];

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header="🎪 VPBank K-MULT Agent Studio - Demo Guide"
      size="large"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss}>
              Close Guide
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                navigate('/');
                onDismiss();
              }}
            >
              Start Demo
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        <Alert
          statusIconAriaLabel="Info"
          type="info"
          header="Multi-Agent Hackathon 2025 - Group 181"
        >
          Welcome to the VPBank K-MULT Agent Studio demonstration! This guide will walk you through 
          all the key features of our multi-agent banking platform with comprehensive mock data.
        </Alert>

        <Steps
          activeStepIndex={activeStep}
          onChange={({ detail }) => setActiveStep(detail.stepIndex)}
          items={demoSteps.map((step, index) => ({
            title: step.title,
            description: step.description,
            content: step.content
          }))}
        />

        <Box>
          <Header variant="h3">Key Features Highlights</Header>
          <KeyValuePairs
            columns={2}
            items={[
              { label: "🎯 Vietnamese Specialization", value: "Advanced Vietnamese NLP with banking terminology" },
              { label: "🤖 Multi-Agent System", value: "6 specialized agents with real-time coordination" },
              { label: "🏦 Banking Compliance", value: "UCP 600, ISBP 821, SBV regulatory compliance" },
              { label: "📊 Real-time Monitoring", value: "Live performance charts and system health" },
              { label: "📄 Document Processing", value: "OCR and NLP for Vietnamese banking documents" },
              { label: "💾 Export Capabilities", value: "TXT and JSON export for all results" },
              { label: "🔍 Knowledge Base", value: "1,250 documents with semantic search" },
              { label: "⚡ Performance", value: "Sub-3-second response times with professional UX" }
            ]}
          />
        </Box>

        <Box textAlign="center">
          <SpaceBetween direction="vertical" size="s">
            <Box variant="h3">🏆 Ready for Hackathon Victory!</Box>
            <Box variant="p">
              This complete multi-agent banking platform demonstrates advanced AI coordination, 
              Vietnamese language specialization, and enterprise-grade features.
            </Box>
            <Box variant="small" color="text-status-inactive">
              VPBank K-MULT Agent Studio - Multi-Agent Hackathon 2025 - Group 181
            </Box>
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </Modal>
  );
};

export default DemoGuide;
