import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:8080' 
  : 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Endpoints
export const API_ENDPOINTS = {
  health: '/riskassessment/public/api/v1/health-check/health',
  summaryTypes: '/riskassessment/api/v1/text/summary/types',
  summarizeText: '/riskassessment/api/v1/text/summary/text',
  summarizeDocument: '/riskassessment/api/v1/text/summary/document',
  chat: '/riskassessment/api/v1/conversation/chat'
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
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

// Health Check
export const checkSystemHealth = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.health);
    return response.data;
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
};

// Get Summary Types
export const getSummaryTypes = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.summaryTypes);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get summary types: ${error.message}`);
  }
};

// Text Summarization
export const summarizeText = async (textData) => {
  try {
    const response = await api.post(API_ENDPOINTS.summarizeText, textData);
    return response.data;
  } catch (error) {
    throw new Error(`Text summarization failed: ${error.message}`);
  }
};

// Document Summarization
export const summarizeDocument = async (formData) => {
  try {
    const response = await api.post(API_ENDPOINTS.summarizeDocument, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Document summarization failed: ${error.message}`);
  }
};

// Chat with AI (streaming)
export const sendChatMessage = async (messageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.chat}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    throw new Error(`Chat request failed: ${error.message}`);
  }
};

// Utility function to generate UUID
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format number with Vietnamese locale
export const formatNumber = (num) => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export default api;
