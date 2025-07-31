// Enhanced API Service with Improved Integration
// VPBank K-MULT Agent Studio - Multi-Agent Hackathon 2025

import { useState } from 'react';
import { ApiResponse, SummaryRequest, SummaryResponse, ConversationRequest } from './api';

// Enhanced API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'development' ? '' : 'http://localhost:8080',
  API_PREFIX: process.env.NODE_ENV === 'development' ? '/api/v1' : '/mutil_agent/api/v1',
  PUBLIC_PREFIX: process.env.NODE_ENV === 'development' ? '/public/api/v1' : '/mutil_agent/public/api/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Enhanced error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface EnhancedApiResponse<T = any> {
  status: 'success' | 'error' | 'loading';
  data?: T;
  message?: string;
  error?: ApiError;
  metadata?: {
    responseTime: number;
    retryCount: number;
    cached: boolean;
  };
}

// Request options interface
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  signal?: AbortSignal;
}

class EnhancedApiClient {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestQueue = new Map<string, Promise<any>>();

  // Enhanced request method with retry logic and caching
  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<EnhancedApiResponse<T>> {
    const startTime = Date.now();
    const { timeout = API_CONFIG.TIMEOUT, retries = API_CONFIG.RETRY_ATTEMPTS, cache = false, ...fetchOptions } = options;
    
    // Create cache key
    const cacheKey = `${endpoint}-${JSON.stringify(fetchOptions)}`;
    
    // Check cache first
    if (cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cached.ttl) {
        return {
          status: 'success',
          data: cached.data,
          metadata: {
            responseTime: Date.now() - startTime,
            retryCount: 0,
            cached: true
          }
        };
      }
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    // Create the request promise
    const requestPromise = this.executeRequest<T>(endpoint, fetchOptions, timeout, retries, startTime);
    
    // Store in queue
    this.requestQueue.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      
      // Cache successful responses
      if (cache && result.status === 'success') {
        this.cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          ttl: 300000 // 5 minutes
        });
      }
      
      return result;
    } finally {
      // Remove from queue
      this.requestQueue.delete(cacheKey);
    }
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit,
    timeout: number,
    retries: number,
    startTime: number
  ): Promise<EnhancedApiResponse<T>> {
    let lastError: any;
    let retryCount = 0;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
          status: 'success',
          data,
          metadata: {
            responseTime: Date.now() - startTime,
            retryCount,
            cached: false
          }
        };

      } catch (error) {
        lastError = error;
        retryCount = attempt;

        // Don't retry on certain errors
        if (error.name === 'AbortError' || (error as any).status === 404) {
          break;
        }

        // Wait before retry
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    // Return error response
    return {
      status: 'error',
      error: {
        code: lastError.name || 'UNKNOWN_ERROR',
        message: lastError.message || 'An unknown error occurred',
        details: lastError,
        timestamp: new Date().toISOString()
      },
      metadata: {
        responseTime: Date.now() - startTime,
        retryCount,
        cached: false
      }
    };
  }

  // Enhanced system health check
  async getSystemHealth(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.PUBLIC_PREFIX}/health-check/health`, { cache: true });
  }

  // Enhanced agent management
  async getAgentStatus(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/agents/status`, { cache: true });
  }

  async getAgentDetails(agentId: string): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/agents/status/${agentId}`, { cache: true });
  }

  async coordinateAgents(taskType: string, priority: string = 'medium'): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/agents/coordinate`, {
      method: 'POST',
      body: JSON.stringify({ task_type: taskType, priority }),
    });
  }

  async assignTask(agentId: string, task: any): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/agents/assign`, {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId, task }),
    });
  }

  // Enhanced text processing
  async summarizeText(request: SummaryRequest): Promise<EnhancedApiResponse<SummaryResponse>> {
    return this.request(`${API_CONFIG.API_PREFIX}/text/summary/text`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async summarizeDocument(file: File, summaryType: string = 'general', language: string = 'vietnamese'): Promise<EnhancedApiResponse<SummaryResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('summary_type', summaryType);
    formData.append('language', language);

    return this.request(`${API_CONFIG.API_PREFIX}/text/summary/document`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async getSummaryTypes(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/text/summary/types`, { cache: true });
  }

  // Enhanced knowledge base operations
  async searchKnowledge(query: string, category?: string): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/knowledge/search`, {
      method: 'POST',
      body: JSON.stringify({ query, category }),
    });
  }

  async getKnowledgeStats(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/knowledge/stats`, { cache: true });
  }

  async getKnowledgeCategories(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/knowledge/categories`, { cache: true });
  }

  async uploadDocument(file: File, category: string, metadata?: any): Promise<EnhancedApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== null) {
          formData.append(key, metadata[key]);
        }
      });
    }

    return this.request(`${API_CONFIG.API_PREFIX}/knowledge/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  // Enhanced compliance operations
  async validateCompliance(text: string, documentType: string): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/compliance/validate`, {
      method: 'POST',
      body: JSON.stringify({ text, document_type: documentType }),
    });
  }

  async getComplianceTypes(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/compliance/types`, { cache: true });
  }

  // Enhanced risk assessment
  async assessRisk(entityData: any): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/risk/assess`, {
      method: 'POST',
      body: JSON.stringify(entityData),
    });
  }

  async getMarketData(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/risk/market-data`, { cache: true });
  }

  // Enhanced conversation
  async sendMessage(request: ConversationRequest): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/conversation/chat`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Enhanced Strands operations
  async processWithStrands(message: string, sessionId?: string): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/strands/supervisor/process`, {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId || `session-${Date.now()}` }),
    });
  }

  async getStrandsAgentStatus(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/strands/agents/status`, { cache: true });
  }

  // Enhanced health monitoring
  async getDetailedHealth(): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/health/health/detailed`, { cache: true });
  }

  async getServiceHealth(service: string): Promise<EnhancedApiResponse<any>> {
    return this.request(`${API_CONFIG.API_PREFIX}/health/health/${service}`, { cache: true });
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export enhanced API client instance
export const enhancedApiClient = new EnhancedApiClient();

// Enhanced API hooks for React components
export const useApiState = <T>(initialData?: T) => {
  const [state, setState] = useState<{
    data: T | undefined;
    loading: boolean;
    error: ApiError | null;
    metadata?: any;
  }>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = async (apiCall: () => Promise<EnhancedApiResponse<T>>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      
      if (response.status === 'success') {
        setState({
          data: response.data,
          loading: false,
          error: null,
          metadata: response.metadata,
        });
      } else {
        setState({
          data: undefined,
          loading: false,
          error: response.error || { code: 'UNKNOWN', message: 'Unknown error', timestamp: new Date().toISOString() },
          metadata: response.metadata,
        });
      }
    } catch (error) {
      setState({
        data: undefined,
        loading: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Execution failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  return { ...state, execute };
};

export default enhancedApiClient;
