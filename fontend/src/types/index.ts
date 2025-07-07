// GenAI Types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  agentId?: string;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    sessionId?: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  capabilities: string[];
  avatar?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'aws' | 'local';
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: ('text' | 'image' | 'code' | 'function-calling')[];
}

export interface FileUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedText?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AgentMetrics {
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
}
