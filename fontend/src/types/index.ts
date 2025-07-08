// Types for Multi-Agent AI Risk Assessment System
// Updated to match backend schemas

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  model: string;
  temperature: number;
  maxTokens: number;
  capabilities: string[];
  systemPrompt: string;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
  agentId?: string;
  conversationId?: string;
  type?: 'human' | 'ai' | 'system' | 'hidden';
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
  };
}

export interface ChatSession {
  id: string;
  title?: string;
  agentId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
  lastMessage?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  agentId?: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived';
}

// Text Summarization Types
export interface SummaryRequest {
  text: string;
  summary_type?: SummaryType;
  max_length?: number;
  language?: Language;
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

export interface DocumentSummaryRequest {
  file: File;
  summary_type?: SummaryType;
  language?: Language;
  max_length?: number;
}

export type SummaryType = 
  | 'general' 
  | 'bullet_points' 
  | 'key_insights' 
  | 'executive_summary' 
  | 'detailed';

export type Language = 'vietnamese' | 'english';

// Conversation Types
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

// System Health Types
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

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LegacyApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Model Configuration Type
export interface ModelConfig {
  name: string;
  temperature: number;
  maxTokens: number;
  provider: string;
}

// UI State Types
export interface AppState {
  user: User | null;
  currentConversation: Conversation | null;
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  preferences?: {
    language: Language;
    theme: 'light' | 'dark';
    defaultSummaryType: SummaryType;
  };
}

// Form Types
export interface TextSummaryForm {
  text: string;
  summaryType: SummaryType;
  language: Language;
  maxLength: number;
}

export interface DocumentUploadForm {
  file: File | null;
  summaryType: SummaryType;
  language: Language;
}

export interface ChatForm {
  message: string;
  attachments?: File[];
}

// Dashboard Types
export interface DashboardStats {
  totalConversations: number;
  totalMessages: number;
  activeAgents: number;
  documentsProcessed: number;
  avgResponseTime: number;
  systemUptime: number;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
}

// Settings Types
export interface SystemSettings {
  apiKey?: string;
  region: string;
  model: string;
  temperature: number;
  maxTokens: number;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  autoSave: boolean;
  language: Language;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// Export all types
export * from './index';
