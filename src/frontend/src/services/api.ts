// API Service for Multi-Agent AI Risk Assessment System
// Updated to match actual backend endpoints and nginx proxy

// Use nginx proxy paths for development, direct URL for production
export const API_BASE_URL = process.env.NODE_ENV === 'development' ? '' : 'http://localhost:8080';
export const API_PREFIX = process.env.NODE_ENV === 'development' ? '/api/v1' : '/mutil_agent/api/v1';
export const PUBLIC_PREFIX = process.env.NODE_ENV === 'development' ? '/public/api/v1' : '/mutil_agent/public/api/v1';

// Types matching backend schemas
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface SummaryRequest {
  text: string;
  summary_type?: 'general' | 'bullet_points' | 'key_insights' | 'executive_summary' | 'detailed';
  max_length?: number;
  language?: 'vietnamese' | 'english';
}

export interface SummaryResponse {
  summary: string;
  summary_type: string;
  language: string;
  original_length: number;
  summary_length: number;
  compression_ratio: number;
  word_count: {
    original: number;
    summary: number;
  };
  processing_time: number;
  model_used: string;
  document_analysis: {
    document_category: string;
    recommendations: {
      suggested_types: string[];
      note: string;
    };
  };
}

export interface ConversationRequest {
  user_id: string;
  message?: string;
  conversation_id?: string;
}

export interface ConversationResponse {
  conversation_id: string;
  message?: string;
  response?: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: number;
  version: string;
  features: {
    text_summary: boolean;
    s3_integration: boolean;
    knowledge_base: boolean;
  };
}

// API Client Class
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Health Check API
  async checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    return this.request<HealthCheckResponse>(`${PUBLIC_PREFIX}/health-check/health`);
  }

  // Text Summarization APIs
  async summarizeText(request: SummaryRequest): Promise<ApiResponse<SummaryResponse>> {
    return this.request<SummaryResponse>(`${API_PREFIX}/text/summary/text`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async summarizeDocument(
    file: File,
    summaryType: string = 'general',
    language: string = 'vietnamese'
  ): Promise<ApiResponse<SummaryResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('summary_type', summaryType);
    formData.append('language', language);

    try {
      const url = `${API_BASE_URL}${API_PREFIX}/text/summary/document`;
      console.log('Sending request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      // Backend returns: {"status": "success", "data": {...}, "message": "..."}
      // We return it as-is since it's already in the correct ApiResponse format
      return data;
    } catch (error) {
      console.error('Document summarization failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getSummaryTypes(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>(`${API_PREFIX}/text/summary/types`);
  }

  // Conversation APIs
  async startConversation(userId: string): Promise<ApiResponse<ConversationResponse>> {
    return this.request<ConversationResponse>(`${API_PREFIX}/conversation/chat`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
      }),
    });
  }

  async sendMessage(request: ConversationRequest): Promise<ApiResponse<ConversationResponse>> {
    return this.request<ConversationResponse>(`${API_PREFIX}/conversation/chat`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Streaming chat (for future implementation)
  async streamChat(request: ConversationRequest): Promise<ReadableStream> {
    const url = `${API_BASE_URL}${API_PREFIX}/conversation/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body!;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Legacy exports for backward compatibility
export const healthAPI = {
  checkHealth: () => apiClient.checkHealth(),
};

export const textAPI = {
  summarizeText: (request: SummaryRequest) => apiClient.summarizeText(request),
  summarizeDocument: (file: File, summaryType?: string, language?: string) =>
    apiClient.summarizeDocument(file, summaryType, language),
  getSummaryTypes: () => apiClient.getSummaryTypes(),
};

export const chatAPI = {
  startConversation: (userId: string) => apiClient.startConversation(userId),
  sendMessage: (request: ConversationRequest) => apiClient.sendMessage(request),
  streamChat: (request: ConversationRequest) => apiClient.streamChat(request),
  
  // Real conversation API calls
  getChatSessions: async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/conversation/sessions?user_id=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.sessions || [] };
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
      return { success: false, data: [], error: error.message };
    }
  },
  
  getMessages: async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/conversation/messages?session_id=${sessionId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.messages || [] };
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  // Chat with specific agent
  chatWithAgent: async (agentId: string, message: string, sessionId?: string) => {
    try {
      const response = await fetch('/api/v1/conversation/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'current-user',
          message: message,
          conversation_id: sessionId || `agent-${agentId}-${Date.now()}`,
          agent_id: agentId
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to chat with agent:', error);
      return { success: false, data: null, error: error.message };
    }
  }
};

export const agentAPI = {
  // Real agent API calls
  getAgents: async () => {
    try {
      const response = await fetch('/api/v1/agents/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        success: true,
        data: data.agents?.map((agent: any) => ({
          id: agent.agent_id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
          model: 'claude-3.5-sonnet',
          temperature: 0.7,
          maxTokens: 8192,
          capabilities: agent.capabilities || [],
          systemPrompt: `You are ${agent.name.toLowerCase()} responsible for ${agent.description.toLowerCase()}.`,
          createdAt: new Date(),
          loadPercentage: agent.load_percentage,
          currentTask: agent.current_task,
          lastActivity: agent.last_activity
        })) || []
      };
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  getAgentStatus: async (agentId?: string) => {
    try {
      const url = agentId ? `/api/v1/agents/status/${agentId}` : '/api/v1/agents/status';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  coordinateAgents: async (taskType: string, priority: string = 'medium') => {
    try {
      const response = await fetch('/api/v1/agents/coordinate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_type: taskType,
          priority: priority
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to coordinate agents:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  assignTask: async (agentId: string, task: any) => {
    try {
      const response = await fetch('/api/v1/agents/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          task: task
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to assign task:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  // Note: Agent CRUD operations not implemented in backend yet
  createAgent: async (agentData: any) => {
    console.warn('Agent creation not implemented in backend yet');
    return { success: false, error: 'Agent creation not implemented in backend' };
  },
  
  updateAgent: async (id: string, agentData: any) => {
    console.warn('Agent update not implemented in backend yet');
    return { success: false, error: 'Agent update not implemented in backend' };
  },
  
  deleteAgent: async (id: string) => {
    console.warn('Agent deletion not implemented in backend yet');
    return { success: false, error: 'Agent deletion not implemented in backend' };
  },
};

// System Health API
export const systemAPI = {
  getSystemHealth: async () => {
    try {
      const response = await fetch('/public/api/v1/health-check/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getDetailedHealth: async () => {
    try {
      const response = await fetch('/api/v1/health/health/detailed');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch detailed health:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getServiceHealth: async (service: string) => {
    try {
      const response = await fetch(`/api/v1/health/health/${service}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`Failed to fetch ${service} health:`, error);
      return { success: false, data: null, error: error.message };
    }
  }
};

// Knowledge Base API
export const knowledgeAPI = {
  searchDocuments: async (query: string) => {
    try {
      const response = await fetch('/api/v1/knowledge/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to search documents:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  queryKnowledgeBase: async (query: string) => {
    try {
      const response = await fetch('/api/v1/knowledge/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to query knowledge base:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getDocuments: async () => {
    try {
      const response = await fetch('/api/v1/knowledge/documents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  uploadDocument: async (file: File, metadata?: any) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        Object.keys(metadata).forEach(key => {
          if (metadata[key] !== undefined && metadata[key] !== null) {
            formData.append(key, metadata[key]);
          }
        });
      }

      const response = await fetch('/api/v1/knowledge/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to upload document:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getCategories: async () => {
    try {
      const response = await fetch('/api/v1/knowledge/categories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getStats: async () => {
    try {
      const response = await fetch('/api/v1/knowledge/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch knowledge base stats:', error);
      return { success: false, data: null, error: error.message };
    }
  }
};

// Risk Assessment API
export const riskAPI = {
  assessRisk: async (entityData: any) => {
    try {
      const response = await fetch('/api/v1/risk/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entityData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to assess risk:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  assessRiskFromFile: async (file: File, metadata?: any) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        Object.keys(metadata).forEach(key => {
          if (metadata[key] !== undefined && metadata[key] !== null) {
            formData.append(key, metadata[key]);
          }
        });
      }

      const response = await fetch('/api/v1/risk/assess-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to assess risk from file:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getMarketData: async () => {
    try {
      const response = await fetch('/api/v1/risk/market-data');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  monitorEntity: async (entityId: string) => {
    try {
      const response = await fetch(`/api/v1/risk/monitor/${entityId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to monitor entity:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getRiskHistory: async (entityId: string) => {
    try {
      const response = await fetch(`/api/v1/risk/score/history/${entityId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch risk history:', error);
      return { success: false, data: null, error: error.message };
    }
  }
};

// Strands Multi-Agent API
export const strandsAPI = {
  processWithStrands: async (query: string, sessionId?: string) => {
    try {
      const response = await fetch('/api/v1/strands/supervisor/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          session_id: sessionId || `session-${Date.now()}`
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to process with Strands:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  processFileWithStrands: async (file: File, message?: string, sessionId?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (message) formData.append('message', message);
      if (sessionId) formData.append('session_id', sessionId);

      const response = await fetch('/api/v1/strands/supervisor/process-with-file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to process file with Strands:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getStrandsAgentStatus: async () => {
    try {
      const response = await fetch('/api/v1/strands/agents/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch Strands agent status:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getAvailableTools: async () => {
    try {
      const response = await fetch('/api/v1/strands/tools/list');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch available tools:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  processPureStrands: async (message: string, sessionId?: string) => {
    try {
      const response = await fetch('/api/pure-strands/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: sessionId || `pure-session-${Date.now()}`
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to process with Pure Strands:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  getPureStrandsStatus: async () => {
    try {
      const response = await fetch('/api/pure-strands/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch Pure Strands status:', error);
      return { success: false, data: null, error: error.message };
    }
  }
};

// Compliance API exports
export const complianceAPI = {
  validateCompliance: async (request: any) => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/compliance/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  validateDocumentFile: async (file: File, documentType?: string, metadata?: any) => {
    const formData = new FormData();
    formData.append('file', file);

    if (documentType) {
      formData.append('document_type', documentType);
    }

    if (metadata) {
      // Add metadata fields to form data
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== null) {
          formData.append(key, metadata[key]);
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/compliance/document`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  queryRegulations: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/compliance/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },
};

// Knowledge Base API exports

export default apiClient;
