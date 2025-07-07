import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:8080' 
  : 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout for AI processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Endpoints - Updated to match actual backend routes
export const API_ENDPOINTS = {
  // Public endpoints
  health: '/riskassessment/public/api/v1/health-check/health',
  healthRoot: '/riskassessment/public/api/v1/health-check/',
  
  // Text summarization endpoints
  summaryTypes: '/riskassessment/api/v1/text/summary/types',
  summaryHealth: '/riskassessment/api/v1/text/summary/health',
  summarizeText: '/riskassessment/api/v1/text/summary/text',
  summarizeDocument: '/riskassessment/api/v1/text/summary/document',
  analyzeSummary: '/riskassessment/api/v1/text/summary/analyze',
  legacySummary: '/riskassessment/api/v1/text/summary',
  
  // Conversation endpoints
  chat: '/riskassessment/api/v1/conversation/chat'
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error);
    if (error.response) {
      // Server responded with error status
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Health Check Functions
export const checkSystemHealth = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.health);
    return response.data;
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
};

export const checkSummaryHealth = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.summaryHealth);
    return response.data;
  } catch (error) {
    throw new Error(`Summary service health check failed: ${error.message}`);
  }
};

// Summary Types Function
export const getSummaryTypes = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.summaryTypes);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get summary types: ${error.message}`);
  }
};

// Text Summarization Function - Updated with proper error handling
export const summarizeText = async (textData) => {
  try {
    // Validate input data
    if (!textData.text || textData.text.trim().length === 0) {
      throw new Error('Text content is required');
    }

    // Prepare request data with defaults
    const requestData = {
      text: textData.text.trim(),
      summary_type: textData.summary_type || 'general',
      language: textData.language || 'vietnamese',
      max_length: textData.max_length || 300
    };

    console.log('📝 Sending text summarization request:', requestData);
    
    const response = await api.post(API_ENDPOINTS.summarizeText, requestData);
    
    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Text summarization failed');
    }
  } catch (error) {
    console.error('❌ Text summarization error:', error);
    if (error.response?.data?.detail) {
      throw new Error(`API Error: ${JSON.stringify(error.response.data.detail)}`);
    }
    throw new Error(`Text summarization failed: ${error.message}`);
  }
};

// Document Summarization Function - Updated with proper error handling
export const summarizeDocument = async (formData) => {
  try {
    console.log('📄 Sending document summarization request');
    
    const response = await api.post(API_ENDPOINTS.summarizeDocument, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for document processing
    });
    
    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Document summarization failed');
    }
  } catch (error) {
    console.error('❌ Document summarization error:', error);
    if (error.response?.data?.detail) {
      throw new Error(`API Error: ${JSON.stringify(error.response.data.detail)}`);
    }
    throw new Error(`Document summarization failed: ${error.message}`);
  }
};

// Chat with AI Function - Updated for streaming response
export const sendChatMessage = async (messageData) => {
  try {
    // Validate input data
    if (!messageData.message || messageData.message.trim().length === 0) {
      throw new Error('Message content is required');
    }
    
    if (!messageData.conversation_id) {
      throw new Error('Conversation ID is required');
    }
    
    if (!messageData.user_id) {
      throw new Error('User ID is required');
    }

    // Prepare request data
    const requestData = {
      message: messageData.message.trim(),
      conversation_id: messageData.conversation_id,
      user_id: messageData.user_id
    };

    console.log('💬 Sending chat message:', { ...requestData, message: requestData.message.substring(0, 50) + '...' });

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.chat}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Chat API error response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
    }

    return response;
  } catch (error) {
    console.error('❌ Chat request error:', error);
    throw new Error(`Chat request failed: ${error.message}`);
  }
};

// Analyze Document Function - New endpoint
export const analyzeDocument = async (formData) => {
  try {
    console.log('🔍 Sending document analysis request');
    
    const response = await api.post(API_ENDPOINTS.analyzeSummary, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 90000, // 1.5 minutes for analysis
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Document analysis error:', error);
    throw new Error(`Document analysis failed: ${error.message}`);
  }
};

// Utility Functions
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

// Validation Functions
export const validateTextInput = (text, minLength = 10, maxLength = 50000) => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Text is required' };
  }
  
  const trimmedText = text.trim();
  
  if (trimmedText.length < minLength) {
    return { isValid: false, error: `Text must be at least ${minLength} characters long` };
  }
  
  if (trimmedText.length > maxLength) {
    return { isValid: false, error: `Text must be less than ${maxLength} characters long` };
  }
  
  return { isValid: true, text: trimmedText };
};

export const validateFileUpload = (file, maxSize = 10 * 1024 * 1024) => {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }
  
  const allowedTypes = ['.txt', '.pdf', '.docx', '.doc'];
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!allowedTypes.includes(fileExtension)) {
    return { 
      isValid: false, 
      error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File size too large. Maximum size: ${formatFileSize(maxSize)}` 
    };
  }
  
  return { isValid: true };
};

// Error handling helper
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return `Bad Request: ${data.message || 'Invalid request data'}`;
      case 401:
        return 'Unauthorized: Please check your credentials';
      case 403:
        return 'Forbidden: You do not have permission to perform this action';
      case 404:
        return 'Not Found: The requested resource was not found';
      case 422:
        return `Validation Error: ${JSON.stringify(data.detail || data.message)}`;
      case 500:
        return 'Internal Server Error: Please try again later';
      case 503:
        return 'Service Unavailable: The service is temporarily unavailable';
      default:
        return `HTTP Error ${status}: ${data.message || 'Unknown error occurred'}`;
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Network Error: Unable to connect to the server';
  } else {
    // Something else happened
    return `Error: ${error.message}`;
  }
};

export default api;
