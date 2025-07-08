import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Form,
  FormField,
  Input,
  Select,
  Toggle,
  Button,
  Tabs,
  ColumnLayout,
  Alert,
  Cards,
  Badge,
  TextContent
} from '@cloudscape-design/components';

interface Settings {
  apiKey: string;
  region: string;
  model: string;
  temperature: number;
  maxTokens: number;
  theme: string;
  notifications: boolean;
  autoSave: boolean;
  language: string;
}

interface SettingsPageProps {
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onShowSnackbar }) => {
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    region: 'us-east-1',
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 8192,
    theme: 'light',
    notifications: true,
    autoSave: true,
    language: 'english'
  });
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (in real app, save to backend)
      localStorage.setItem('appSettings', JSON.stringify(settings));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      apiKey: '',
      region: 'us-east-1',
      model: 'claude-3-sonnet',
      temperature: 0.7,
      maxTokens: 8192,
      theme: 'light',
      notifications: true,
      autoSave: true,
      language: 'english'
    });
  };

  const regionOptions = [
    { label: 'US East (N. Virginia)', value: 'us-east-1' },
    { label: 'US West (Oregon)', value: 'us-west-2' },
    { label: 'Europe (Ireland)', value: 'eu-west-1' },
    { label: 'Asia Pacific (Singapore)', value: 'ap-southeast-1' }
  ];

  const modelOptions = [
    { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
    { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
    { label: 'Claude 3 Opus', value: 'claude-3-opus' }
  ];

  const languageOptions = [
    { label: 'English', value: 'english' },
    { label: 'Vietnamese', value: 'vietnamese' }
  ];

  const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Auto', value: 'auto' }
  ];

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h1"
          description="Configure system preferences, API settings, and application behavior."
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={handleResetSettings}>
                Reset to Defaults
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveSettings}
                loading={isSaving}
              >
                Save Settings
              </Button>
            </SpaceBetween>
          }
        >
          Settings
        </Header>

        {showSuccess && (
          <Alert type="success" dismissible onDismiss={() => setShowSuccess(false)}>
            Settings saved successfully!
          </Alert>
        )}

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'general',
              label: 'General',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Box>
                    <Header variant="h2">Application Settings</Header>
                    <Form>
                      <SpaceBetween direction="vertical" size="l">
                        <ColumnLayout columns={2}>
                          <FormField label="Theme" description="Choose your preferred theme">
                            <Select
                              selectedOption={themeOptions.find(opt => opt.value === settings.theme)}
                              onChange={({ detail }) => setSettings({ ...settings, theme: detail.selectedOption.value! })}
                              options={themeOptions}
                            />
                          </FormField>

                          <FormField label="Language" description="Default language for responses">
                            <Select
                              selectedOption={languageOptions.find(opt => opt.value === settings.language)}
                              onChange={({ detail }) => setSettings({ ...settings, language: detail.selectedOption.value! })}
                              options={languageOptions}
                            />
                          </FormField>
                        </ColumnLayout>

                        <ColumnLayout columns={2}>
                          <FormField label="Notifications">
                            <Toggle
                              checked={settings.notifications}
                              onChange={({ detail }) => setSettings({ ...settings, notifications: detail.checked })}
                            >
                              Enable notifications
                            </Toggle>
                          </FormField>

                          <FormField label="Auto Save">
                            <Toggle
                              checked={settings.autoSave}
                              onChange={({ detail }) => setSettings({ ...settings, autoSave: detail.checked })}
                            >
                              Auto-save conversations
                            </Toggle>
                          </FormField>
                        </ColumnLayout>
                      </SpaceBetween>
                    </Form>
                  </Box>
                </SpaceBetween>
              )
            },
            {
              id: 'aws',
              label: 'AWS Configuration',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Alert type="info">
                    Configure your AWS credentials and Bedrock settings. These settings are stored locally and used for API calls.
                  </Alert>

                  <Box>
                    <Header variant="h2">AWS Bedrock Settings</Header>
                    <Form>
                      <SpaceBetween direction="vertical" size="l">
                        <FormField 
                          label="AWS Region" 
                          description="Select the AWS region for Bedrock API calls"
                        >
                          <Select
                            selectedOption={regionOptions.find(opt => opt.value === settings.region)}
                            onChange={({ detail }) => setSettings({ ...settings, region: detail.selectedOption.value! })}
                            options={regionOptions}
                          />
                        </FormField>

                        <FormField 
                          label="API Key" 
                          description="Your AWS access key (stored locally)"
                          constraintText="This will be stored in your browser's local storage"
                        >
                          <Input
                            type="password"
                            value={settings.apiKey}
                            onChange={({ detail }) => setSettings({ ...settings, apiKey: detail.value })}
                            placeholder="Enter your AWS access key"
                          />
                        </FormField>
                      </SpaceBetween>
                    </Form>
                  </Box>
                </SpaceBetween>
              )
            },
            {
              id: 'model',
              label: 'Model Configuration',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Box>
                    <Header variant="h2">Default Model Settings</Header>
                    <Form>
                      <SpaceBetween direction="vertical" size="l">
                        <FormField label="Default Model" description="Choose the default AI model for new agents">
                          <Select
                            selectedOption={modelOptions.find(opt => opt.value === settings.model)}
                            onChange={({ detail }) => setSettings({ ...settings, model: detail.selectedOption.value! })}
                            options={modelOptions}
                          />
                        </FormField>

                        <ColumnLayout columns={2}>
                          <FormField 
                            label="Temperature" 
                            description="Controls randomness (0.0 = deterministic, 1.0 = creative)"
                          >
                            <Input
                              type="number"
                              value={settings.temperature.toString()}
                              onChange={({ detail }) => setSettings({ ...settings, temperature: parseFloat(detail.value) || 0.7 })}
                              step={0.1}
                            />
                          </FormField>

                          <FormField 
                            label="Max Tokens" 
                            description="Maximum length of model responses"
                          >
                            <Input
                              type="number"
                              value={settings.maxTokens.toString()}
                              onChange={({ detail }) => setSettings({ ...settings, maxTokens: parseInt(detail.value) || 8192 })}
                            />
                          </FormField>
                        </ColumnLayout>
                      </SpaceBetween>
                    </Form>
                  </Box>
                </SpaceBetween>
              )
            },
            {
              id: 'about',
              label: 'About',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Box>
                    <Header variant="h2">🤖 Multi-Agent AI Risk Assessment System</Header>
                    <TextContent>
                      <p>
                        AI-powered risk assessment system with document summarization, 
                        conversational AI, and multi-agent architecture using AWS Bedrock (Claude 3.7).
                      </p>
                    </TextContent>
                  </Box>

                  <ColumnLayout columns={2}>
                    <Box>
                      <Header variant="h3">System Information</Header>
                      <SpaceBetween direction="vertical" size="s">
                        <div>
                          <Box variant="awsui-key-label">Version</Box>
                          <div>1.0.0</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Backend API</Box>
                          <div>FastAPI 0.115.2</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Frontend</Box>
                          <div>React 18.2.0</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">UI Framework</Box>
                          <div>AWS CloudScape</div>
                        </div>
                      </SpaceBetween>
                    </Box>

                    <Box>
                      <Header variant="h3">Features</Header>
                      <SpaceBetween direction="vertical" size="xs">
                        <Badge color="green">Multi-Agent System</Badge>
                        <Badge color="blue">Document Processing</Badge>
                        <Badge color="blue">Conversational AI</Badge>
                        <Badge color="red">Real-time Chat</Badge>
                        <Badge color="red">AWS Bedrock Integration</Badge>
                      </SpaceBetween>
                    </Box>
                  </ColumnLayout>

                  <Box>
                    <Header variant="h3">Links</Header>
                    <SpaceBetween direction="horizontal" size="s">
                      <Button href="/health" iconName="status-positive">
                        Health Check
                      </Button>
                      <Button href="http://localhost:8080/docs" iconName="external" target="_blank">
                        API Documentation
                      </Button>
                      <Button href="https://github.com/ngcuyen/multi-agent-hackathon" iconName="external" target="_blank">
                        GitHub Repository
                      </Button>
                    </SpaceBetween>
                  </Box>
                </SpaceBetween>
              )
            }
          ]}
        />
      </SpaceBetween>
    </Container>
  );
};

export default SettingsPage;
