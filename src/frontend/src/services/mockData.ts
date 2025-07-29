import { Agent, Message, ChatSession, ModelConfig } from '../types';

// Mock Agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Code Assistant',
    description: 'Helps with programming and debugging tasks',
    model: 'claude-3-sonnet',
    systemPrompt: 'You are a helpful programming assistant...',
    temperature: 0.3,
    maxTokens: 2048,
    status: 'active',
    capabilities: ['code-analysis', 'debugging', 'programming'],
    avatar: '/avatars/code-assistant.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-2',
    name: 'Research Assistant',
    description: 'Specializes in research and information gathering',
    model: 'claude-3-sonnet',
    systemPrompt: 'You are a research specialist...',
    temperature: 0.7,
    maxTokens: 4096,
    status: 'active',
    capabilities: ['research', 'data-analysis', 'information-gathering'],
    avatar: '/avatars/research-assistant.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-3',
    name: 'Creative Writer',
    description: 'Assists with creative writing and content creation',
    model: 'claude-3-sonnet',
    systemPrompt: 'You are a creative writing assistant...',
    temperature: 0.9,
    maxTokens: 3000,
    status: 'active',
    capabilities: ['creative-writing', 'storytelling', 'content-creation'],
    avatar: '/avatars/creative-writer.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-4',
    name: 'Data Analyst',
    description: 'Analyzes data and provides insights',
    model: 'claude-3-sonnet',
    systemPrompt: 'You are a data analysis expert...',
    temperature: 0.2,
    maxTokens: 2048,
    status: 'inactive',
    capabilities: ['data-analysis', 'statistics', 'visualization'],
    avatar: '/avatars/data-analyst.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock Chat Sessions
export const mockChatSessions: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Code Review Discussion',
    agentId: 'agent-1',
    userId: 'user-1',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
    messageCount: 15,
    lastMessage: 'The code looks good now. Any other questions?',
  },
  {
    id: 'session-2',
    title: 'Market Research Project',
    agentId: 'agent-2',
    userId: 'user-1',
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 7200000), // 2 hours ago
    messageCount: 8,
    lastMessage: 'Here are the latest market trends I found...',
  },
  {
    id: 'session-3',
    title: 'Blog Post Ideas',
    agentId: 'agent-3',
    userId: 'user-1',
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(Date.now() - 10800000), // 3 hours ago
    messageCount: 12,
    lastMessage: 'I love the creative direction we\'re taking!',
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    content: 'Hello! How can I help you today?',
    sender: 'bot',
    timestamp: new Date(Date.now() - 60000),
    agentId: 'agent-1',
    metadata: {
      model: 'claude-3-sonnet',
      tokens: 12,
      cost: 0.001,
    },
  },
  {
    id: 'msg-2',
    content: 'I need help debugging a Python function.',
    sender: 'user',
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: 'msg-3',
    content: 'I\'d be happy to help you debug your Python function! Please share the code and describe what issue you\'re experiencing.',
    sender: 'bot',
    timestamp: new Date(),
    agentId: 'agent-1',
    metadata: {
      model: 'claude-3-sonnet',
      tokens: 28,
      cost: 0.002,
    },
  },
];

// Mock Model Configurations
export const mockModelConfigs: ModelConfig[] = [
  {
    name: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 8192,
    provider: 'anthropic',
  },
  {
    name: 'claude-3-haiku',
    temperature: 0.5,
    maxTokens: 4096,
    provider: 'anthropic',
  },
];

// Export functions to get mock data
export const getMockAgents = () => mockAgents;
export const getMockChatSessions = () => mockChatSessions;
export const getMockMessages = (sessionId?: string) => 
  sessionId ? mockMessages.filter(msg => msg.conversationId === sessionId) : mockMessages;
export const getMockModelConfigs = () => mockModelConfigs;
