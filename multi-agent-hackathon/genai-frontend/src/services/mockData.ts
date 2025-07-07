import { Agent, Message, ChatSession, ModelConfig } from '../types';

// Mock Agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Code Assistant',
    description: 'Specialized in code analysis, debugging, and programming help',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful coding assistant. Help users with programming questions, code review, and debugging.',
    temperature: 0.3,
    maxTokens: 2048,
    isActive: true,
    capabilities: ['code-analysis', 'debugging', 'programming'],
    avatar: '/avatars/code-assistant.png',
  },
  {
    id: 'agent-2',
    name: 'Research Assistant',
    description: 'Expert in research, data analysis, and information gathering',
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are a research assistant. Help users find information, analyze data, and provide insights.',
    temperature: 0.7,
    maxTokens: 4096,
    isActive: true,
    capabilities: ['research', 'data-analysis', 'information-gathering'],
    avatar: '/avatars/research-assistant.png',
  },
  {
    id: 'agent-3',
    name: 'Creative Writer',
    description: 'Specialized in creative writing, storytelling, and content creation',
    model: 'claude-3-sonnet',
    systemPrompt: 'You are a creative writing assistant. Help users with storytelling, creative content, and writing improvement.',
    temperature: 0.9,
    maxTokens: 3000,
    isActive: true,
    capabilities: ['creative-writing', 'storytelling', 'content-creation'],
    avatar: '/avatars/creative-writer.png',
  },
  {
    id: 'agent-4',
    name: 'Data Analyst',
    description: 'Expert in data analysis, statistics, and visualization',
    model: 'gpt-4-turbo',
    systemPrompt: 'You are a data analysis expert. Help users analyze data, create visualizations, and derive insights.',
    temperature: 0.2,
    maxTokens: 2048,
    isActive: false,
    capabilities: ['data-analysis', 'statistics', 'visualization'],
    avatar: '/avatars/data-analyst.png',
  },
];

// Mock Models
export const mockModels: ModelConfig[] = [
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 4096,
    costPer1kTokens: 0.002,
    capabilities: ['text', 'code'],
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    maxTokens: 8192,
    costPer1kTokens: 0.03,
    capabilities: ['text', 'code', 'image'],
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    maxTokens: 128000,
    costPer1kTokens: 0.01,
    capabilities: ['text', 'code', 'image', 'function-calling'],
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    capabilities: ['text', 'code', 'image'],
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    maxTokens: 200000,
    costPer1kTokens: 0.075,
    capabilities: ['text', 'code', 'image'],
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    maxTokens: 32768,
    costPer1kTokens: 0.0005,
    capabilities: ['text', 'code', 'image'],
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    content: 'Hello! How can I help you today?',
    role: 'assistant',
    timestamp: new Date(Date.now() - 60000),
    agentId: 'agent-1',
    metadata: {
      model: 'gpt-4',
      tokens: 12,
      cost: 0.00036,
    },
  },
  {
    id: 'msg-2',
    content: 'I need help debugging a Python function.',
    role: 'user',
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: 'msg-3',
    content: 'I\'d be happy to help you debug your Python function! Please share the code and describe what issue you\'re experiencing.',
    role: 'assistant',
    timestamp: new Date(),
    agentId: 'agent-1',
    metadata: {
      model: 'gpt-4',
      tokens: 28,
      cost: 0.00084,
    },
  },
];

// Mock Chat Sessions
export const mockChatSessions: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Python Debugging Help',
    messages: mockMessages,
    agentId: 'agent-1',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(),
  },
  {
    id: 'session-2',
    title: 'Research on AI Ethics',
    messages: [],
    agentId: 'agent-2',
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 7200000),
  },
];

// Mock Usage Statistics
export const mockUsageStats = {
  totalMessages: 1247,
  totalTokens: 45623,
  totalCost: 12.34,
  agentUsage: {
    'agent-1': 456,
    'agent-2': 321,
    'agent-3': 234,
    'agent-4': 236,
  },
};

// Mock Agent Metrics
export const mockAgentMetrics = {
  responseTime: [120, 150, 98, 200, 175, 145, 132],
  successRate: 0.97,
  tokenUsage: [1200, 1500, 980, 2000, 1750, 1450, 1320],
};
