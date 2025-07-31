// Enhanced API Hooks for React Components
// VPBank K-MULT Agent Studio - Multi-Agent Hackathon 2025

import { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedApiClient, EnhancedApiResponse, ApiError } from '../services/enhanced-api';

// Generic API hook with loading states and error handling
export const useApiCall = <T>(
  apiCall: () => Promise<EnhancedApiResponse<T>>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean;
    interval?: number;
    retryOnError?: boolean;
    maxRetries?: number;
  } = {}
) => {
  const { immediate = false, interval, retryOnError = false, maxRetries = 3 } = options;
  
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: ApiError | null;
    metadata?: any;
    retryCount: number;
  }>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(async (forceRetry = false) => {
    if (forceRetry) {
      retryCountRef.current = 0;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();

      if (response.status === 'success') {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
          metadata: response.metadata,
          retryCount: retryCountRef.current,
        });
        retryCountRef.current = 0;
      } else {
        const error = response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          timestamp: new Date().toISOString(),
        };

        setState({
          data: null,
          loading: false,
          error,
          metadata: response.metadata,
          retryCount: retryCountRef.current,
        });

        // Auto-retry on error if enabled
        if (retryOnError && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(() => execute(), 2000 * retryCountRef.current);
        }
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Execution failed',
          timestamp: new Date().toISOString(),
        },
        retryCount: retryCountRef.current,
      });
    }
  }, [apiCall, retryOnError, maxRetries]);

  // Auto-execute on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...dependencies]);

  // Set up interval if specified
  useEffect(() => {
    if (interval && interval > 0) {
      intervalRef.current = setInterval(() => {
        if (!state.loading) {
          execute();
        }
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [interval, execute, state.loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute,
    retry: () => execute(true),
    isRetrying: retryCountRef.current > 0,
  };
};

// Specific hooks for common API operations

// System health hook with auto-refresh
export const useSystemHealth = (refreshInterval = 30000) => {
  return useApiCall(
    () => enhancedApiClient.getSystemHealth(),
    [],
    { immediate: true, interval: refreshInterval, retryOnError: true }
  );
};

// Agent status hook with real-time updates
export const useAgentStatus = (refreshInterval = 15000) => {
  return useApiCall(
    () => enhancedApiClient.getAgentStatus(),
    [],
    { immediate: true, interval: refreshInterval, retryOnError: true }
  );
};

// Individual agent details hook
export const useAgentDetails = (agentId: string, refreshInterval = 10000) => {
  return useApiCall(
    () => enhancedApiClient.getAgentDetails(agentId),
    [agentId],
    { immediate: !!agentId, interval: refreshInterval }
  );
};

// Text processing hook
export const useTextProcessing = () => {
  const [summaryTypes, setSummaryTypes] = useState<any>(null);
  
  const summarizeText = useCallback(async (text: string, summaryType = 'general', language = 'vietnamese') => {
    return enhancedApiClient.summarizeText({ text, summary_type: summaryType as any, language: language as any });
  }, []);

  const summarizeDocument = useCallback(async (file: File, summaryType = 'general', language = 'vietnamese') => {
    return enhancedApiClient.summarizeDocument(file, summaryType, language);
  }, []);

  // Load summary types on mount
  useEffect(() => {
    const loadSummaryTypes = async () => {
      const response = await enhancedApiClient.getSummaryTypes();
      if (response.status === 'success') {
        setSummaryTypes(response.data);
      }
    };
    loadSummaryTypes();
  }, []);

  return {
    summarizeText,
    summarizeDocument,
    summaryTypes,
  };
};

// Knowledge base hook
export const useKnowledgeBase = () => {
  const stats = useApiCall(
    () => enhancedApiClient.getKnowledgeStats(),
    [],
    { immediate: true, interval: 60000 }
  );

  const categories = useApiCall(
    () => enhancedApiClient.getKnowledgeCategories(),
    [],
    { immediate: true }
  );

  const searchKnowledge = useCallback(async (query: string, category?: string) => {
    return enhancedApiClient.searchKnowledge(query, category);
  }, []);

  const uploadDocument = useCallback(async (file: File, category: string, metadata?: any) => {
    return enhancedApiClient.uploadDocument(file, category, metadata);
  }, []);

  return {
    stats: stats.data,
    categories: categories.data,
    loading: stats.loading || categories.loading,
    error: stats.error || categories.error,
    searchKnowledge,
    uploadDocument,
    refreshStats: stats.execute,
    refreshCategories: categories.execute,
  };
};

// Compliance hook
export const useCompliance = () => {
  const types = useApiCall(
    () => enhancedApiClient.getComplianceTypes(),
    [],
    { immediate: true }
  );

  const validateCompliance = useCallback(async (text: string, documentType: string) => {
    return enhancedApiClient.validateCompliance(text, documentType);
  }, []);

  return {
    types: types.data,
    loading: types.loading,
    error: types.error,
    validateCompliance,
    refreshTypes: types.execute,
  };
};

// Risk assessment hook
export const useRiskAssessment = () => {
  const marketData = useApiCall(
    () => enhancedApiClient.getMarketData(),
    [],
    { immediate: true, interval: 300000 } // Refresh every 5 minutes
  );

  const assessRisk = useCallback(async (entityData: any) => {
    return enhancedApiClient.assessRisk(entityData);
  }, []);

  return {
    marketData: marketData.data,
    loading: marketData.loading,
    error: marketData.error,
    assessRisk,
    refreshMarketData: marketData.execute,
  };
};

// Strands multi-agent hook
export const useStrands = () => {
  const agentStatus = useApiCall(
    () => enhancedApiClient.getStrandsAgentStatus(),
    [],
    { immediate: true, interval: 20000 }
  );

  const processWithStrands = useCallback(async (message: string, sessionId?: string) => {
    return enhancedApiClient.processWithStrands(message, sessionId);
  }, []);

  return {
    agentStatus: agentStatus.data,
    loading: agentStatus.loading,
    error: agentStatus.error,
    processWithStrands,
    refreshAgentStatus: agentStatus.execute,
  };
};

// Conversation hook
export const useConversation = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<string>(`session-${Date.now()}`);

  const sendMessage = useCallback(async (message: string, userId = 'current-user') => {
    const response = await enhancedApiClient.sendMessage({
      user_id: userId,
      message,
      conversation_id: currentSession,
    });

    if (response.status === 'success' && response.data) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message,
        response: response.data.response,
        timestamp: new Date(),
        userId,
      }]);
    }

    return response;
  }, [currentSession]);

  const startNewSession = useCallback(() => {
    const newSession = `session-${Date.now()}`;
    setCurrentSession(newSession);
    setMessages([]);
    return newSession;
  }, []);

  return {
    messages,
    currentSession,
    sendMessage,
    startNewSession,
  };
};

// Health monitoring hook
export const useHealthMonitoring = () => {
  const detailedHealth = useApiCall(
    () => enhancedApiClient.getDetailedHealth(),
    [],
    { immediate: true, interval: 30000 }
  );

  const getServiceHealth = useCallback(async (service: string) => {
    return enhancedApiClient.getServiceHealth(service);
  }, []);

  return {
    detailedHealth: detailedHealth.data,
    loading: detailedHealth.loading,
    error: detailedHealth.error,
    getServiceHealth,
    refreshHealth: detailedHealth.execute,
  };
};

// Agent coordination hook
export const useAgentCoordination = () => {
  const [coordinationHistory, setCoordinationHistory] = useState<any[]>([]);

  const coordinateAgents = useCallback(async (taskType: string, priority = 'medium') => {
    const response = await enhancedApiClient.coordinateAgents(taskType, priority);
    
    if (response.status === 'success') {
      setCoordinationHistory(prev => [...prev, {
        id: Date.now(),
        taskType,
        priority,
        response: response.data,
        timestamp: new Date(),
      }]);
    }

    return response;
  }, []);

  const assignTask = useCallback(async (agentId: string, task: any) => {
    return enhancedApiClient.assignTask(agentId, task);
  }, []);

  return {
    coordinationHistory,
    coordinateAgents,
    assignTask,
    clearHistory: () => setCoordinationHistory([]),
  };
};

// Real-time data hook for dashboard
export const useRealTimeData = (refreshInterval = 10000) => {
  const systemHealth = useSystemHealth(refreshInterval);
  const agentStatus = useAgentStatus(refreshInterval);
  const strandsStatus = useStrands();

  const isLoading = systemHealth.loading || agentStatus.loading || strandsStatus.loading;
  const hasError = systemHealth.error || agentStatus.error || strandsStatus.error;

  return {
    systemHealth: systemHealth.data,
    agentStatus: agentStatus.data,
    strandsStatus: strandsStatus.agentStatus,
    loading: isLoading,
    error: hasError,
    refresh: () => {
      systemHealth.execute();
      agentStatus.execute();
      strandsStatus.refreshAgentStatus();
    },
  };
};

export default {
  useApiCall,
  useSystemHealth,
  useAgentStatus,
  useAgentDetails,
  useTextProcessing,
  useKnowledgeBase,
  useCompliance,
  useRiskAssessment,
  useStrands,
  useConversation,
  useHealthMonitoring,
  useAgentCoordination,
  useRealTimeData,
};
