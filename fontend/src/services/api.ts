import axios from 'axios';
import { Message, Agent, ChatSession, ModelConfig, APIResponse } from '../types';
import { mockAgents, mockModels, mockMessages, mockChatSessions, mockUsageStats, mockAgentMetrics } from './mockData';

// API Base Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true' || false;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create mock response
const createMockResponse = <T>(data: T): APIResponse<T> => ({
  success: true,
  data,
  message: 'Success',
});

// Helper function to handle API calls with fallback to mock data
const apiCallWithFallback = async <T>(
  apiCall: () => Promise<any>,
  mockData: T,
  errorMessage: string = 'API call failed'
): Promise<APIResponse<T>> => {
  if (USE_MOCK_DATA) {
    await delay(300 + Math.random() * 700); // Simulate network delay
    return createMockResponse(mockData);
  }

  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.warn(`${errorMessage}, falling back to mock data:`, error);
    await delay(300 + Math.random() * 700); // Simulate network delay
    return createMockResponse(mockData);
  }
};

// Chat API
export const chatAPI = {
  // Send message to agent
  sendMessage: async (agentId: string, message: string, sessionId?: string): Promise<APIResponse<Message>> => {
    const mockMessage: Message = {
      id: `msg-${Date.now()}`,
      content: `This is a mock response to: "${message}". In a real implementation, this would be processed by agent ${agentId}.`,
      role: 'assistant',
      timestamp: new Date(),
      agentId,
      metadata: {
        model: 'gpt-3.5-turbo',
        tokens: Math.floor(Math.random() * 100) + 20,
        cost: Math.random() * 0.01,
      },
    };

    return apiCallWithFallback(
      () => apiClient.post('/riskassessment/api/v1/conversation/chat', { 
        message, 
        conversation_id: sessionId,
        agent_id: agentId 
      }),
      mockMessage,
      'Failed to send message'
    );
  },

  // Get chat history
  getChatHistory: async (sessionId: string): Promise<APIResponse<Message[]>> => {
    return apiCallWithFallback(
      () => apiClient.get(`/chat/history/${sessionId}`),
      mockMessages,
      'Failed to get chat history'
    );
  },

  // Create new chat session
  createSession: async (agentId: string, title?: string): Promise<APIResponse<ChatSession>> => {
    const mockSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: title || 'New Chat',
      messages: [],
      agentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return apiCallWithFallback(
      () => apiClient.post('/chat/session', { agentId, title }),
      mockSession,
      'Failed to create session'
    );
  },

  // Get all chat sessions
  getSessions: async (): Promise<APIResponse<ChatSession[]>> => {
    return apiCallWithFallback(
      () => apiClient.get('/chat/sessions'),
      mockChatSessions,
      'Failed to get sessions'
    );
  },
};

// Agent API
export const agentAPI = {
  // Get all agents
  getAgents: async (): Promise<APIResponse<Agent[]>> => {
    return apiCallWithFallback(
      () => apiClient.get('/agents'),
      mockAgents,
      'Failed to get agents'
    );
  },

  // Get agent by ID
  getAgent: async (id: string): Promise<APIResponse<Agent>> => {
    const mockAgent = mockAgents.find(agent => agent.id === id) || mockAgents[0];
    
    return apiCallWithFallback(
      () => apiClient.get(`/agents/${id}`),
      mockAgent,
      'Failed to get agent'
    );
  },

  // Create new agent
  createAgent: async (agent: Omit<Agent, 'id'>): Promise<APIResponse<Agent>> => {
    const mockAgent: Agent = {
      ...agent,
      id: `agent-${Date.now()}`,
    };

    return apiCallWithFallback(
      () => apiClient.post('/agents', agent),
      mockAgent,
      'Failed to create agent'
    );
  },

  // Update agent
  updateAgent: async (id: string, agent: Partial<Agent>): Promise<APIResponse<Agent>> => {
    const existingAgent = mockAgents.find(a => a.id === id) || mockAgents[0];
    const mockAgent: Agent = { ...existingAgent, ...agent };

    return apiCallWithFallback(
      () => apiClient.put(`/agents/${id}`, agent),
      mockAgent,
      'Failed to update agent'
    );
  },

  // Delete agent
  deleteAgent: async (id: string): Promise<APIResponse<void>> => {
    return apiCallWithFallback(
      () => apiClient.delete(`/agents/${id}`),
      undefined,
      'Failed to delete agent'
    );
  },
};

// Model API
export const modelAPI = {
  // Get available models
  getModels: async (): Promise<APIResponse<ModelConfig[]>> => {
    return apiCallWithFallback(
      () => apiClient.get('/models'),
      mockModels,
      'Failed to get models'
    );
  },

  // Test model connection
  testModel: async (modelId: string): Promise<APIResponse<{ status: string; latency: number }>> => {
    const mockTestResult = {
      status: 'success',
      latency: Math.floor(Math.random() * 500) + 100,
    };

    return apiCallWithFallback(
      () => apiClient.post(`/models/${modelId}/test`),
      mockTestResult,
      'Failed to test model'
    );
  },
};

// File API
export const fileAPI = {
  // Upload file
  uploadFile: async (file: File): Promise<APIResponse<{ id: string; extractedText?: string }>> => {
    const mockUploadResult = {
      id: `file-${Date.now()}`,
      extractedText: `Mock extracted text from ${file.name}`,
    };

    return apiCallWithFallback(
      () => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      },
      mockUploadResult,
      'Failed to upload file'
    );
  },

  // Process document
  processDocument: async (fileId: string, options?: { extractText?: boolean; summarize?: boolean }): Promise<APIResponse<{ extractedText?: string; summary?: string }>> => {
    const mockProcessResult = {
      extractedText: options?.extractText ? 'Mock extracted text content...' : undefined,
      summary: options?.summarize ? 'Mock document summary...' : undefined,
    };

    return apiCallWithFallback(
      () => apiClient.post(`/files/${fileId}/process`, options),
      mockProcessResult,
      'Failed to process document'
    );
  },
};

// Analytics API
export const analyticsAPI = {
  // Get usage statistics
  getUsageStats: async (timeRange?: string): Promise<APIResponse<{
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    agentUsage: Record<string, number>;
  }>> => {
    return apiCallWithFallback(
      () => apiClient.get('/analytics/usage', { params: { timeRange } }),
      mockUsageStats,
      'Failed to get usage stats'
    );
  },

  // Get agent metrics
  getAgentMetrics: async (agentId: string): Promise<APIResponse<{
    responseTime: number[];
    successRate: number;
    tokenUsage: number[];
  }>> => {
    return apiCallWithFallback(
      () => apiClient.get(`/analytics/agents/${agentId}`),
      mockAgentMetrics,
      'Failed to get agent metrics'
    );
  },
};

// Health Check API
export const healthAPI = {
  // Check backend health
  checkHealth: async (): Promise<APIResponse<{ status: string; timestamp: string }>> => {
    const mockHealthResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };

    return apiCallWithFallback(
      () => apiClient.get('/riskassessment/public/api/v1/health-check/health'),
      mockHealthResult,
      'Failed to check backend health'
    );
  },
};

export default apiClient;
