// API Service for Multi-Agent AI Risk Assessment System
// Updated to match actual backend endpoints

// Use proxy for both development and production
export const API_BASE_URL = `http://localhost:8080`; // Always use relative URL to leverage proxy
export const API_PREFIX = '/mutil_agent/api/v1'; // Backend API path
export const PUBLIC_PREFIX = '/mutil_agent/public/api/v1'; // Backend public API path

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
  // Legacy methods for compatibility
  getChatSessions: async () => ({ success: true, data: [] }),
  getMessages: async (sessionId: string) => ({ success: true, data: [] }),
};

export const agentAPI = {
  // Mock agent API for now - backend doesn't have agent management yet
  getAgents: async () => ({
    success: true,
    data: [
      {
        id: 'risk-assessment-agent',
        name: 'Risk Assessment Agent',
        description: 'Chuyên gia phân tích và đánh giá rủi ro doanh nghiệp',
        status: 'active' as const,
        model: 'claude-3-sonnet',
        temperature: 0.7,
        maxTokens: 8192,
        capabilities: ['Risk Analysis', 'Document Processing', 'Vietnamese Support'],
        systemPrompt: 'Bạn là một chuyên gia phân tích rủi ro doanh nghiệp...',
        createdAt: new Date(),
      },
      {
        id: 'document-processor',
        name: 'Document Processor',
        description: 'Chuyên xử lý và tóm tắt tài liệu',
        status: 'active' as const,
        model: 'claude-3-sonnet',
        temperature: 0.5,
        maxTokens: 8192,
        capabilities: ['Document Summarization', 'Text Analysis', 'Multi-language'],
        systemPrompt: 'Bạn là một chuyên gia xử lý tài liệu...',
        createdAt: new Date(),
      },
    ]
  }),
  createAgent: async (agentData: any) => ({ success: true, data: { id: 'new-agent' } }),
  updateAgent: async (id: string, agentData: any) => ({ success: true }),
  deleteAgent: async (id: string) => ({ success: true }),
};

export default apiClient;

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
export const knowledgeAPI = {
  searchDocuments: async (query: string, category?: string, limit?: number) => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/knowledge/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, category, limit }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/knowledge/categories`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/knowledge/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  uploadDocuments: async (files: File[], category: string, tags: string, description: string) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('description', description);

    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/knowledge/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};

// Agent Management API exports
export const agentManagementAPI = {
  getAgentsList: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/agents/list`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getAgentsHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/agents/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  assignTask: async (taskData: any) => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/agents/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  coordinateAgents: async (coordinationData: any) => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/agents/coordinate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(coordinationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};

// Risk Analytics API exports
export const riskAnalyticsAPI = {
  getMarketData: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/risk/market-data`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getRiskHistory: async (entityId: string) => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/risk/score/history/${entityId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  monitorEntity: async (entityId: string) => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/risk/monitor/${entityId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  configureAlert: async (alertData: any) => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/risk/alert/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};

// Pure Strands API exports
export const pureStrandsAPI = {
  processMessage: async (message: string, file?: File) => {
    const formData = new FormData();
    formData.append('message', message);
    
    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/pure-strands/process`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getStatus: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/pure-strands/status`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};

// System Health API exports
export const systemHealthAPI = {
  getSystemHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getDetailedHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health/health/detailed`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getAgentsHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health/health/agents`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getComplianceHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health/health/compliance`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getRiskHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health/health/risk`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getTextHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health/health/text`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getKnowledgeHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health/health/knowledge`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  getDocumentHealth: async () => {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health/health/document`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
};
