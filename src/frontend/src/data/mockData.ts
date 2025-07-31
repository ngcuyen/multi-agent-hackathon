// Comprehensive Mock Data for VPBank K-MULT Agent Studio
// Multi-Agent Hackathon 2025 - Group 181

export interface MockAgent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'processing';
  capabilities: string[];
  loadPercentage: number;
  currentTask: string | null;
  lastActivity: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  createdAt: Date;
  updatedAt: Date;
  totalTasks: number;
  successRate: number;
  averageResponseTime: number;
}

export interface MockSystemHealth {
  status: 'healthy' | 'warning' | 'error';
  service: string;
  version: string;
  timestamp: number;
  features: {
    text_summary: boolean;
    s3_integration: boolean;
    knowledge_base: boolean;
    multi_agent: boolean;
    vietnamese_nlp: boolean;
    banking_compliance: boolean;
  };
  services: Array<{
    service_name: string;
    status: 'healthy' | 'warning' | 'error';
    response_time_ms: number;
    last_check: string;
    details: any;
  }>;
}

export interface MockTextSummary {
  id: string;
  originalText: string;
  summary: string;
  summaryType: string;
  language: string;
  processingTime: number;
  modelUsed: string;
  metadata: {
    originalLength: number;
    summaryLength: number;
    compressionRatio: number;
    wordCount: {
      original: number;
      summary: number;
    };
    documentAnalysis?: {
      documentCategory: string;
      recommendations: {
        suggestedTypes: string[];
        note: string;
      };
    };
  };
  timestamp: Date;
}

export interface MockKnowledgeBase {
  totalDocuments: number;
  totalCategories: number;
  totalSearchesToday: number;
  averageSearchTimeMs: number;
  mostSearchedTopics: string[];
  recentAdditions: number;
  storageSizeMb: number;
  languages: string[];
  searchAccuracy: string;
  categories: Array<{
    name: string;
    displayName: string;
    description: string;
    documentCount: number;
  }>;
  documents: Array<{
    id: string;
    title: string;
    category: string;
    uploadDate: string;
    size: string;
    type: string;
    tags: string[];
  }>;
}

export interface MockCompliance {
  supportedTypes: Record<string, {
    name: string;
    description: string;
    ucpArticles: string[];
    ucpApplicable: boolean;
  }>;
  totalTypes: number;
  validationResults: Array<{
    id: string;
    documentType: string;
    status: 'compliant' | 'non_compliant' | 'warning';
    issues: string[];
    recommendations: string[];
    timestamp: Date;
  }>;
}

export interface MockRiskAssessment {
  marketData: {
    indicators: Array<{
      name: string;
      value: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
      lastUpdated: string;
    }>;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
  };
  assessments: Array<{
    id: string;
    entityName: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: Array<{
      category: string;
      score: number;
      weight: number;
      description: string;
    }>;
    recommendations: string[];
    timestamp: Date;
  }>;
}

// Mock Agents Data
export const mockAgents: MockAgent[] = [
  {
    id: 'supervisor',
    name: 'Supervisor Agent',
    description: 'Orchestrates workflow and coordinates other agents for optimal task distribution',
    status: 'active',
    capabilities: ['Workflow Management', 'Agent Coordination', 'Task Distribution', 'Load Balancing'],
    loadPercentage: 25.5,
    currentTask: 'Coordinating LC processing workflow',
    lastActivity: '2 minutes ago',
    model: 'claude-3.5-sonnet',
    temperature: 0.7,
    maxTokens: 8192,
    systemPrompt: 'You are a supervisor agent responsible for coordinating multi-agent workflows in Vietnamese banking operations.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    totalTasks: 1247,
    successRate: 99.8,
    averageResponseTime: 1.2
  },
  {
    id: 'document-intelligence',
    name: 'Document Intelligence Agent',
    description: 'Advanced OCR with deep Vietnamese NLP capabilities for banking document processing',
    status: 'processing',
    capabilities: ['OCR Processing', 'Vietnamese NLP', 'Document Classification', 'Text Extraction'],
    loadPercentage: 78.3,
    currentTask: 'Processing LC documents batch #247',
    lastActivity: '30 seconds ago',
    model: 'claude-3.5-sonnet',
    temperature: 0.5,
    maxTokens: 8192,
    systemPrompt: 'You are a document intelligence agent specialized in OCR and Vietnamese NLP for banking documents.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    totalTasks: 3421,
    successRate: 99.5,
    averageResponseTime: 2.8
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment Agent',
    description: 'Automated financial analysis and predictive risk modeling for Vietnamese banking sector',
    status: 'active',
    capabilities: ['Financial Analysis', 'Risk Modeling', 'Credit Scoring', 'Market Analysis'],
    loadPercentage: 45.7,
    currentTask: 'Analyzing credit portfolio risk',
    lastActivity: '1 minute ago',
    model: 'claude-3.5-sonnet',
    temperature: 0.3,
    maxTokens: 8192,
    systemPrompt: 'You are a risk assessment agent specialized in financial analysis and risk modeling for Vietnamese banking.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    totalTasks: 892,
    successRate: 95.2,
    averageResponseTime: 4.1
  },
  {
    id: 'compliance-validation',
    name: 'Compliance Validation Agent',
    description: 'Validates against UCP 600, ISBP 821, and SBV regulations with real-time compliance checking',
    status: 'active',
    capabilities: ['UCP 600 Validation', 'ISBP 821 Compliance', 'SBV Regulations', 'AML/CFT Checks'],
    loadPercentage: 32.1,
    currentTask: 'Validating LC compliance batch',
    lastActivity: '45 seconds ago',
    model: 'claude-3.5-sonnet',
    temperature: 0.2,
    maxTokens: 8192,
    systemPrompt: 'You are a compliance validation agent specialized in banking regulations including UCP 600, ISBP 821, and SBV requirements.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    totalTasks: 1567,
    successRate: 98.7,
    averageResponseTime: 1.8
  },
  {
    id: 'decision-synthesis',
    name: 'Decision Synthesis Agent',
    description: 'Generates evidence-based recommendations with confidence scores and risk analysis',
    status: 'active',
    capabilities: ['Decision Making', 'Confidence Scoring', 'Report Generation', 'Risk Analysis'],
    loadPercentage: 18.9,
    currentTask: 'Synthesizing credit decision report',
    lastActivity: '3 minutes ago',
    model: 'claude-3.5-sonnet',
    temperature: 0.4,
    maxTokens: 8192,
    systemPrompt: 'You are a decision synthesis agent that generates evidence-based recommendations with confidence scoring.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    totalTasks: 743,
    successRate: 97.3,
    averageResponseTime: 3.2
  },
  {
    id: 'process-automation',
    name: 'Process Automation Agent',
    description: 'End-to-end workflow automation and system integration for banking operations',
    status: 'active',
    capabilities: ['LC Processing', 'Credit Proposals', 'Document Routing', 'System Integration'],
    loadPercentage: 56.4,
    currentTask: 'Automating LC workflow process',
    lastActivity: '1 minute ago',
    model: 'claude-3.5-sonnet',
    temperature: 0.6,
    maxTokens: 8192,
    systemPrompt: 'You are a process automation agent responsible for end-to-end workflow automation in banking operations.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    totalTasks: 1123,
    successRate: 96.8,
    averageResponseTime: 2.5
  }
];

// Mock System Health Data
export const mockSystemHealth: MockSystemHealth = {
  status: 'healthy',
  service: 'VPBank K-MULT Agent Studio',
  version: '2.0.0',
  timestamp: Date.now(),
  features: {
    text_summary: true,
    s3_integration: true,
    knowledge_base: true,
    multi_agent: true,
    vietnamese_nlp: true,
    banking_compliance: true
  },
  services: [
    {
      service_name: 'document_intelligence',
      status: 'healthy',
      response_time_ms: 245,
      last_check: new Date().toISOString(),
      details: {
        ocr_engine: 'tesseract',
        languages: ['vietnamese', 'english'],
        accuracy: '99.5%',
        features: ['pdf_extraction', 'image_ocr', 'text_analysis']
      }
    },
    {
      service_name: 'risk_assessment',
      status: 'healthy',
      response_time_ms: 412,
      last_check: new Date().toISOString(),
      details: {
        models: ['credit_scoring', 'financial_health'],
        algorithms: ['ml_based', 'rule_based'],
        accuracy: '95%',
        features: ['real_time_scoring', 'historical_analysis']
      }
    },
    {
      service_name: 'compliance_validation',
      status: 'healthy',
      response_time_ms: 189,
      last_check: new Date().toISOString(),
      details: {
        standards: ['UCP600', 'ISBP821', 'SBV'],
        validation_types: ['document', 'process', 'regulatory'],
        coverage: '100%'
      }
    },
    {
      service_name: 'text_processing',
      status: 'healthy',
      response_time_ms: 1234,
      last_check: new Date().toISOString(),
      details: {
        nlp_engine: 'bedrock_claude',
        languages: ['vietnamese', 'english'],
        features: ['summarization', 'extraction', 'analysis'],
        model: 'claude-3.5-sonnet'
      }
    },
    {
      service_name: 'agent_coordination',
      status: 'healthy',
      response_time_ms: 156,
      last_check: new Date().toISOString(),
      details: {
        total_agents: 6,
        active_agents: 6,
        coordination_engine: 'langchain',
        workflow_types: ['lc_processing', 'credit_assessment', 'document_analysis']
      }
    },
    {
      service_name: 'knowledge_base',
      status: 'healthy',
      response_time_ms: 298,
      last_check: new Date().toISOString(),
      details: {
        knowledge_base: 'vector_store',
        documents: 'banking_regulations',
        search_engine: 'semantic_search',
        accuracy: '98%'
      }
    },
    {
      service_name: 'database',
      status: 'healthy',
      response_time_ms: 87,
      last_check: new Date().toISOString(),
      details: {
        dynamodb: 'connected',
        tables: ['messages', 'conversations', 'documents'],
        status: 'operational'
      }
    },
    {
      service_name: 'ai_models',
      status: 'healthy',
      response_time_ms: 567,
      last_check: new Date().toISOString(),
      details: {
        bedrock_models: ['claude-3.5-sonnet'],
        ocr_models: ['tesseract'],
        nlp_models: ['vietnamese_nlp'],
        status: 'loaded'
      }
    }
  ]
};

// Mock Knowledge Base Data
export const mockKnowledgeBase: MockKnowledgeBase = {
  totalDocuments: 1250,
  totalCategories: 4,
  totalSearchesToday: 1847,
  averageSearchTimeMs: 45,
  mostSearchedTopics: [
    'letter of credit',
    'risk assessment',
    'compliance requirements',
    'UCP 600',
    'SBV regulations'
  ],
  recentAdditions: 23,
  storageSizeMb: 2840,
  languages: ['vietnamese', 'english'],
  searchAccuracy: '98%',
  categories: [
    {
      name: 'banking_regulations',
      displayName: 'Banking Regulations',
      description: 'UCP 600, ISBP 821, and other banking regulations',
      documentCount: 450
    },
    {
      name: 'compliance',
      displayName: 'Compliance',
      description: 'SBV and international compliance requirements',
      documentCount: 320
    },
    {
      name: 'risk_management',
      displayName: 'Risk Management',
      description: 'Credit risk, operational risk, and risk assessment guidelines',
      documentCount: 280
    },
    {
      name: 'procedures',
      displayName: 'Procedures',
      description: 'Banking operations and procedural manuals',
      documentCount: 200
    }
  ],
  documents: [
    {
      id: 'doc-001',
      title: 'UCP 600 - Uniform Customs and Practice for Documentary Credits',
      category: 'banking_regulations',
      uploadDate: '2024-01-15',
      size: '2.4 MB',
      type: 'PDF',
      tags: ['UCP 600', 'Documentary Credits', 'International']
    },
    {
      id: 'doc-002',
      title: 'SBV Circular 39/2016 - Foreign Exchange Management',
      category: 'compliance',
      uploadDate: '2024-01-20',
      size: '1.8 MB',
      type: 'PDF',
      tags: ['SBV', 'Foreign Exchange', 'Vietnam']
    },
    {
      id: 'doc-003',
      title: 'Credit Risk Assessment Guidelines',
      category: 'risk_management',
      uploadDate: '2024-01-25',
      size: '3.2 MB',
      type: 'PDF',
      tags: ['Credit Risk', 'Assessment', 'Guidelines']
    }
  ]
};

// Mock Compliance Data
export const mockCompliance: MockCompliance = {
  supportedTypes: {
    commercial_invoice: {
      name: 'Commercial Invoice',
      description: 'Hóa đơn thương mại trong tín dụng thư',
      ucpArticles: ['Article 18'],
      ucpApplicable: true
    },
    letter_of_credit: {
      name: 'Letter of Credit',
      description: 'Tín dụng thư',
      ucpArticles: ['Article 1-39'],
      ucpApplicable: true
    },
    bill_of_lading: {
      name: 'Bill of Lading',
      description: 'Vận đơn',
      ucpArticles: ['Article 20'],
      ucpApplicable: true
    },
    bank_guarantee: {
      name: 'Bank Guarantee',
      description: 'Bảo lãnh ngân hàng',
      ucpArticles: ['Article 2'],
      ucpApplicable: true
    },
    insurance_certificate: {
      name: 'Insurance Certificate',
      description: 'Chứng từ bảo hiểm',
      ucpArticles: ['Article 28'],
      ucpApplicable: true
    }
  },
  totalTypes: 14,
  validationResults: [
    {
      id: 'validation-001',
      documentType: 'letter_of_credit',
      status: 'compliant',
      issues: [],
      recommendations: ['Document meets all UCP 600 requirements'],
      timestamp: new Date()
    },
    {
      id: 'validation-002',
      documentType: 'commercial_invoice',
      status: 'warning',
      issues: ['Missing beneficiary signature'],
      recommendations: ['Add beneficiary signature', 'Verify invoice amount'],
      timestamp: new Date()
    }
  ]
};

// Mock Risk Assessment Data
export const mockRiskAssessment: MockRiskAssessment = {
  marketData: {
    indicators: [
      {
        name: 'VN-Index',
        value: 1247.82,
        change: 2.34,
        trend: 'up',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'USD/VND',
        value: 24350,
        change: -0.12,
        trend: 'down',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'Banking Sector Index',
        value: 892.45,
        change: 1.78,
        trend: 'up',
        lastUpdated: new Date().toISOString()
      }
    ],
    riskLevel: 'medium',
    confidence: 87.5
  },
  assessments: [
    {
      id: 'risk-001',
      entityName: 'ABC Manufacturing Co., Ltd',
      riskScore: 72.5,
      riskLevel: 'medium',
      factors: [
        {
          category: 'Financial Health',
          score: 78,
          weight: 0.4,
          description: 'Strong revenue growth but high debt ratio'
        },
        {
          category: 'Market Position',
          score: 85,
          weight: 0.3,
          description: 'Leading position in manufacturing sector'
        },
        {
          category: 'Management Quality',
          score: 65,
          weight: 0.3,
          description: 'Experienced team but recent management changes'
        }
      ],
      recommendations: [
        'Monitor debt-to-equity ratio closely',
        'Request quarterly financial updates',
        'Consider reducing credit limit by 10%'
      ],
      timestamp: new Date()
    }
  ]
};

// Mock Text Summary Data
export const mockTextSummaries: MockTextSummary[] = [
  {
    id: 'summary-001',
    originalText: 'VPBank là một trong những ngân hàng thương mại cổ phần hàng đầu tại Việt Nam, được thành lập vào năm 1993. Ngân hàng cung cấp đầy đủ các dịch vụ tài chính bao gồm cho vay, huy động vốn, thanh toán quốc tế và các dịch vụ ngân hàng điện tử hiện đại. Với mạng lưới chi nhánh rộng khắp cả nước và đội ngũ nhân viên chuyên nghiệp, VPBank đã khẳng định vị thế của mình trong ngành ngân hàng Việt Nam.',
    summary: '# Tóm tắt về VPBank\n\nVPBank là ngân hàng thương mại cổ phần hàng đầu Việt Nam, thành lập năm 1993. Ngân hàng cung cấp đầy đủ dịch vụ tài chính như cho vay, huy động vốn, thanh toán quốc tế và ngân hàng điện tử. VPBank có mạng lưới chi nhánh rộng khắp và đội ngũ chuyên nghiệp, khẳng định vị thế trong ngành ngân hàng Việt Nam.',
    summaryType: 'general',
    language: 'vietnamese',
    processingTime: 2.45,
    modelUsed: 'bedrock_claude',
    metadata: {
      originalLength: 487,
      summaryLength: 312,
      compressionRatio: 1.56,
      wordCount: {
        original: 87,
        summary: 56
      },
      documentAnalysis: {
        documentCategory: 'banking_information',
        recommendations: {
          suggestedTypes: ['executive_summary', 'bullet_points'],
          note: 'Document contains banking sector information suitable for executive summary'
        }
      }
    },
    timestamp: new Date()
  }
];

// Mock Chat/Conversation Data
export const mockConversations = [
  {
    id: 'conv-001',
    userId: 'user-001',
    sessionId: 'session-001',
    messages: [
      {
        id: 'msg-001',
        role: 'user',
        content: 'Tôi cần xử lý một tín dụng thư xuất khẩu',
        timestamp: new Date()
      },
      {
        id: 'msg-002',
        role: 'assistant',
        content: 'Tôi sẽ hỗ trợ bạn xử lý tín dụng thư xuất khẩu. Vui lòng cung cấp thông tin về:\n1. Giá trị tín dụng thư\n2. Thời hạn hiệu lực\n3. Điều kiện thanh toán\n4. Các chứng từ yêu cầu',
        timestamp: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock Coordination History
export const mockCoordinationHistory = [
  {
    id: 'coord-001',
    taskType: 'document_processing',
    priority: 'high',
    assignedAgents: ['document-intelligence', 'compliance-validation'],
    status: 'completed',
    result: 'Successfully processed 15 LC documents with 100% compliance',
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    duration: 245
  },
  {
    id: 'coord-002',
    taskType: 'risk_assessment',
    priority: 'medium',
    assignedAgents: ['risk-assessment', 'decision-synthesis'],
    status: 'completed',
    result: 'Risk assessment completed for 3 entities with medium risk level',
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    duration: 412
  },
  {
    id: 'coord-003',
    taskType: 'compliance_check',
    priority: 'high',
    assignedAgents: ['compliance-validation'],
    status: 'in_progress',
    result: 'Processing compliance validation for batch #247',
    timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    duration: null
  }
];

// Performance History Data (for charts)
export const generatePerformanceHistory = (hours: number = 24) => {
  const history = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const dataPoint = {
      x: timestamp.toLocaleTimeString(),
      timestamp,
      supervisor: Math.random() * 30 + 10,
      'document-intelligence': Math.random() * 40 + 40,
      'risk-assessment': Math.random() * 30 + 30,
      'compliance-validation': Math.random() * 25 + 15,
      'decision-synthesis': Math.random() * 20 + 10,
      'process-automation': Math.random() * 35 + 35
    };
    history.push(dataPoint);
  }
  
  return history;
};

// Export all mock data
export const mockData = {
  agents: mockAgents,
  systemHealth: mockSystemHealth,
  knowledgeBase: mockKnowledgeBase,
  compliance: mockCompliance,
  riskAssessment: mockRiskAssessment,
  textSummaries: mockTextSummaries,
  conversations: mockConversations,
  coordinationHistory: mockCoordinationHistory,
  performanceHistory: generatePerformanceHistory()
};

export default mockData;
