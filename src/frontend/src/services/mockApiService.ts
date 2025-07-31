// Mock API Service with Comprehensive Mock Data
// VPBank K-MULT Agent Studio - Multi-Agent Hackathon 2025

import { 
  mockData, 
  MockAgent, 
  MockSystemHealth, 
  MockTextSummary,
  generatePerformanceHistory 
} from '../data/mockData';

// Simulate API delay for realistic experience
const simulateDelay = (min: number = 500, max: number = 2000) => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Simulate occasional API failures for testing error handling
const simulateFailure = (failureRate: number = 0.05) => {
  return Math.random() < failureRate;
};

// Mock API Response Interface
interface MockApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    timestamp: string;
  };
  metadata?: {
    responseTime: number;
    cached: boolean;
    retryCount: number;
  };
}

class MockApiService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestCount = 0;

  // Helper method to create mock response
  private async createResponse<T>(
    data: T, 
    message?: string, 
    failureRate: number = 0.02
  ): Promise<MockApiResponse<T>> {
    const startTime = Date.now();
    await simulateDelay(200, 1500);
    
    this.requestCount++;
    
    // Simulate occasional failures
    if (simulateFailure(failureRate)) {
      return {
        status: 'error',
        error: {
          code: 'MOCK_API_ERROR',
          message: 'Simulated API error for testing',
          timestamp: new Date().toISOString()
        },
        metadata: {
          responseTime: Date.now() - startTime,
          cached: false,
          retryCount: 0
        }
      };
    }

    return {
      status: 'success',
      data,
      message: message || 'Request successful',
      metadata: {
        responseTime: Date.now() - startTime,
        cached: false,
        retryCount: 0
      }
    };
  }

  // System Health APIs
  async getSystemHealth(): Promise<MockApiResponse<MockSystemHealth>> {
    return this.createResponse(mockData.systemHealth, 'System health retrieved successfully');
  }

  async getDetailedHealth(): Promise<MockApiResponse<any>> {
    return this.createResponse({
      status: 'healthy',
      services: mockData.systemHealth.services
    }, 'Detailed health information retrieved');
  }

  async getServiceHealth(service: string): Promise<MockApiResponse<any>> {
    const serviceHealth = mockData.systemHealth.services.find(s => s.service_name === service);
    if (serviceHealth) {
      return this.createResponse(serviceHealth, `${service} health retrieved`);
    }
    return this.createResponse(null, `Service ${service} not found`, 0.1);
  }

  // Agent Management APIs
  async getAgentStatus(): Promise<MockApiResponse<any>> {
    const agentData = {
      total_agents: mockData.agents.length,
      active_agents: mockData.agents.filter(a => a.status === 'active').length,
      agents: mockData.agents.map(agent => ({
        agent_id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        load_percentage: agent.loadPercentage,
        current_task: agent.currentTask,
        last_activity: agent.lastActivity,
        capabilities: agent.capabilities,
        total_tasks: agent.totalTasks,
        success_rate: agent.successRate,
        average_response_time: agent.averageResponseTime
      }))
    };
    
    return this.createResponse(agentData, 'Agent status retrieved successfully');
  }

  async getAgentDetails(agentId: string): Promise<MockApiResponse<any>> {
    const agent = mockData.agents.find(a => a.id === agentId);
    if (agent) {
      return this.createResponse({
        agent_id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        load_percentage: agent.loadPercentage,
        current_task: agent.currentTask,
        last_activity: agent.lastActivity,
        capabilities: agent.capabilities,
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        total_tasks: agent.totalTasks,
        success_rate: agent.successRate,
        average_response_time: agent.averageResponseTime
      }, `Agent ${agentId} details retrieved`);
    }
    return this.createResponse(null, `Agent ${agentId} not found`, 0.1);
  }

  async coordinateAgents(taskType: string, priority: string = 'medium'): Promise<MockApiResponse<any>> {
    const taskId = `task-${taskType}-${Math.random().toString(36).substr(2, 8)}`;
    const availableAgents = mockData.agents.filter(a => a.status === 'active' && a.loadPercentage < 80);
    const assignedAgents = availableAgents.slice(0, Math.min(2, availableAgents.length)).map(a => a.id);
    
    // Update agent status (simulate task assignment)
    assignedAgents.forEach(agentId => {
      const agent = mockData.agents.find(a => a.id === agentId);
      if (agent) {
        agent.currentTask = `Processing ${taskType}`;
        agent.loadPercentage = Math.min(agent.loadPercentage + 20, 95);
        agent.lastActivity = 'Just now';
      }
    });

    // Add to coordination history
    mockData.coordinationHistory.unshift({
      id: taskId,
      taskType,
      priority,
      assignedAgents,
      status: 'in_progress',
      result: `Task ${taskType} assigned to ${assignedAgents.length} agents`,
      timestamp: new Date(),
      duration: null
    });

    return this.createResponse({
      status: 'success',
      task_id: taskId,
      assigned_agents: assignedAgents,
      message: `Đã phân công ${assignedAgents.length} agent xử lý task ${taskType} với độ ưu tiên ${priority}`
    }, 'Task coordination successful');
  }

  async assignTask(agentId: string, task: any): Promise<MockApiResponse<any>> {
    const agent = mockData.agents.find(a => a.id === agentId);
    if (agent) {
      agent.currentTask = task.description || 'Custom task';
      agent.loadPercentage = Math.min(agent.loadPercentage + 15, 95);
      agent.lastActivity = 'Just now';
      
      return this.createResponse({
        status: 'success',
        agent_id: agentId,
        task_assigned: task,
        message: `Task assigned to ${agent.name}`
      }, 'Task assigned successfully');
    }
    return this.createResponse(null, `Agent ${agentId} not found`, 0.1);
  }

  // Text Processing APIs
  async summarizeText(request: {
    text: string;
    summary_type?: string;
    language?: string;
  }): Promise<MockApiResponse<any>> {
    if (request.text.length < 50) {
      return this.createResponse(null, 'Văn bản quá ngắn để tóm tắt (tối thiểu 50 ký tự)', 0);
    }

    // Generate mock summary
    const summary = `# Tóm tắt ${request.summary_type || 'general'}\n\n${request.text.substring(0, Math.min(200, request.text.length))}...`;
    
    const summaryData = {
      summary,
      summary_type: request.summary_type || 'general',
      language: request.language || 'vietnamese',
      original_length: request.text.length,
      summary_length: summary.length,
      compression_ratio: request.text.length / summary.length,
      word_count: {
        original: request.text.split(' ').length,
        summary: summary.split(' ').length
      },
      processing_time: Math.random() * 3 + 1,
      model_used: 'bedrock_claude',
      document_analysis: {
        document_category: 'general_text',
        recommendations: {
          suggested_types: ['bullet_points', 'key_insights'],
          note: 'Text suitable for various summary types'
        }
      }
    };

    return this.createResponse({
      status: 'success',
      data: summaryData
    }, 'Tóm tắt văn bản thành công');
  }

  async summarizeDocument(file: File, summaryType: string, language: string): Promise<MockApiResponse<any>> {
    // Simulate file processing
    await simulateDelay(2000, 5000);
    
    const summary = `# Tóm tắt tài liệu: ${file.name}\n\nTài liệu "${file.name}" đã được xử lý thành công với công nghệ OCR và NLP tiên tiến. Nội dung chính của tài liệu bao gồm thông tin quan trọng về quy trình ngân hàng và các yêu cầu tuân thủ.`;
    
    const summaryData = {
      summary,
      summary_type: summaryType,
      language,
      original_length: file.size,
      summary_length: summary.length,
      compression_ratio: file.size / summary.length,
      word_count: {
        original: Math.floor(file.size / 6), // Estimate
        summary: summary.split(' ').length
      },
      processing_time: Math.random() * 5 + 2,
      model_used: 'bedrock_claude',
      file_info: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      document_analysis: {
        document_category: 'banking_document',
        recommendations: {
          suggested_types: ['executive_summary', 'detailed'],
          note: 'Banking document suitable for executive summary'
        }
      }
    };

    return this.createResponse({
      status: 'success',
      data: summaryData
    }, `Tóm tắt tài liệu "${file.name}" thành công`);
  }

  async getSummaryTypes(): Promise<MockApiResponse<any>> {
    const summaryTypes = {
      summary_types: {
        general: {
          name: 'Tóm tắt chung',
          description: 'Tóm tắt tổng quan nội dung chính của văn bản',
          use_case: 'Phù hợp cho việc hiểu nhanh nội dung tổng thể'
        },
        bullet_points: {
          name: 'Điểm chính',
          description: 'Liệt kê các điểm chính dưới dạng bullet points',
          use_case: 'Phù hợp cho báo cáo, danh sách yêu cầu'
        },
        key_insights: {
          name: 'Thông tin quan trọng',
          description: 'Trích xuất những thông tin và insight quan trọng nhất',
          use_case: 'Phù hợp cho phân tích, nghiên cứu'
        },
        executive_summary: {
          name: 'Tóm tắt điều hành',
          description: 'Tóm tắt ngắn gọn dành cho lãnh đạo và quản lý',
          use_case: 'Phù hợp cho báo cáo lãnh đạo, tài liệu kinh doanh'
        },
        detailed: {
          name: 'Tóm tắt chi tiết',
          description: 'Tóm tắt chi tiết nhưng vẫn súc tích hơn bản gốc',
          use_case: 'Phù hợp khi cần giữ lại nhiều thông tin'
        }
      },
      supported_languages: [
        {
          code: 'vietnamese',
          name: 'Tiếng Việt',
          description: 'Tóm tắt bằng tiếng Việt'
        },
        {
          code: 'english',
          name: 'English',
          description: 'Summarize in English'
        }
      ],
      supported_file_types: [
        {
          extension: '.txt',
          name: 'Text File',
          description: 'Plain text files'
        },
        {
          extension: '.pdf',
          name: 'PDF Document',
          description: 'Portable Document Format files'
        },
        {
          extension: '.docx',
          name: 'Word Document',
          description: 'Microsoft Word documents (new format)'
        },
        {
          extension: '.doc',
          name: 'Word Document (Legacy)',
          description: 'Microsoft Word documents (legacy format)'
        }
      ],
      limits: {
        max_file_size: '10MB',
        min_text_length: '50 characters',
        max_summary_length: '1000 words',
        url_timeout: '30 seconds'
      }
    };

    return this.createResponse({
      status: 'success',
      data: summaryTypes
    }, 'Lấy thông tin loại tóm tắt thành công');
  }

  // Knowledge Base APIs
  async getKnowledgeStats(): Promise<MockApiResponse<any>> {
    return this.createResponse(mockData.knowledgeBase, 'Knowledge base statistics retrieved');
  }

  async getKnowledgeCategories(): Promise<MockApiResponse<any>> {
    return this.createResponse({
      categories: mockData.knowledgeBase.categories,
      total_categories: mockData.knowledgeBase.totalCategories,
      total_documents: mockData.knowledgeBase.totalDocuments
    }, 'Knowledge base categories retrieved');
  }

  async searchKnowledge(query: string, category?: string): Promise<MockApiResponse<any>> {
    // Simulate search results
    const results = mockData.knowledgeBase.documents
      .filter(doc => 
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        (category && doc.category === category)
      )
      .slice(0, 10);

    return this.createResponse({
      query,
      category,
      results,
      total_results: results.length,
      search_time_ms: Math.random() * 100 + 20
    }, `Found ${results.length} results for "${query}"`);
  }

  async uploadDocument(file: File, category: string, metadata?: any): Promise<MockApiResponse<any>> {
    await simulateDelay(1000, 3000);
    
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: file.name,
      category,
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type.toUpperCase(),
      tags: metadata?.tags?.split(',') || ['uploaded']
    };

    mockData.knowledgeBase.documents.unshift(newDoc);
    mockData.knowledgeBase.totalDocuments++;
    mockData.knowledgeBase.recentAdditions++;

    return this.createResponse({
      document: newDoc,
      message: `Document "${file.name}" uploaded successfully`
    }, 'Document uploaded to knowledge base');
  }

  // Compliance APIs
  async getComplianceTypes(): Promise<MockApiResponse<any>> {
    return this.createResponse({
      status: 'success',
      data: {
        supported_types: mockData.compliance.supportedTypes,
        total_types: mockData.compliance.totalTypes
      }
    }, 'Danh sách loại tài liệu được hỗ trợ');
  }

  async validateCompliance(text: string, documentType: string): Promise<MockApiResponse<any>> {
    await simulateDelay(1000, 3000);
    
    const isCompliant = Math.random() > 0.3; // 70% compliance rate
    const issues = isCompliant ? [] : [
      'Missing required field: Beneficiary signature',
      'Date format does not comply with UCP 600',
      'Amount discrepancy detected'
    ];
    
    const recommendations = isCompliant ? 
      ['Document meets all compliance requirements'] :
      ['Add missing beneficiary signature', 'Correct date format', 'Verify amount accuracy'];

    const result = {
      id: `validation-${Date.now()}`,
      document_type: documentType,
      status: isCompliant ? 'compliant' : 'non_compliant',
      compliance_score: isCompliant ? Math.random() * 20 + 80 : Math.random() * 50 + 30,
      issues,
      recommendations,
      standards_checked: ['UCP 600', 'ISBP 821', 'SBV Regulations'],
      timestamp: new Date().toISOString()
    };

    return this.createResponse({
      status: 'success',
      data: result
    }, `Compliance validation completed for ${documentType}`);
  }

  // Risk Assessment APIs
  async getMarketData(): Promise<MockApiResponse<any>> {
    // Update market data with random fluctuations
    mockData.riskAssessment.marketData.indicators.forEach(indicator => {
      const change = (Math.random() - 0.5) * 5; // ±2.5% change
      indicator.value += change;
      indicator.change = change;
      indicator.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
      indicator.lastUpdated = new Date().toISOString();
    });

    return this.createResponse(mockData.riskAssessment.marketData, 'Market data retrieved');
  }

  async assessRisk(entityData: any): Promise<MockApiResponse<any>> {
    await simulateDelay(2000, 4000);
    
    const riskScore = Math.random() * 100;
    const riskLevel = riskScore > 75 ? 'high' : riskScore > 50 ? 'medium' : 'low';
    
    const assessment = {
      id: `risk-${Date.now()}`,
      entity_name: entityData.name || 'Unknown Entity',
      risk_score: riskScore,
      risk_level: riskLevel,
      factors: [
        {
          category: 'Financial Health',
          score: Math.random() * 100,
          weight: 0.4,
          description: 'Analysis of financial statements and ratios'
        },
        {
          category: 'Market Position',
          score: Math.random() * 100,
          weight: 0.3,
          description: 'Market share and competitive position'
        },
        {
          category: 'Management Quality',
          score: Math.random() * 100,
          weight: 0.3,
          description: 'Leadership experience and track record'
        }
      ],
      recommendations: [
        'Monitor financial performance quarterly',
        'Review credit terms annually',
        'Consider additional collateral if risk increases'
      ],
      timestamp: new Date().toISOString()
    };

    return this.createResponse({
      status: 'success',
      data: assessment
    }, `Risk assessment completed for ${entityData.name || 'entity'}`);
  }

  // Strands Multi-Agent APIs
  async getStrandsAgentStatus(): Promise<MockApiResponse<any>> {
    const strandsAgents = {
      compliance_validation: {
        status: 'available',
        type: 'strands_agent_tool',
        last_check: new Date().toISOString()
      },
      risk_assessment: {
        status: 'available',
        type: 'strands_agent_tool',
        last_check: new Date().toISOString()
      },
      document_intelligence: {
        status: 'available',
        type: 'strands_agent_tool',
        last_check: new Date().toISOString()
      },
      supervisor: {
        status: 'available',
        type: 'strands_agent_tool',
        last_check: new Date().toISOString()
      }
    };

    return this.createResponse({
      status: 'success',
      data: {
        status: 'success',
        agents: strandsAgents,
        total_agents: Object.keys(strandsAgents).length,
        service_info: {
          service: 'strands_agent_service',
          version: '1.0.0',
          framework: 'strands_agents_sdk'
        }
      }
    }, 'Strands Agents status retrieved successfully');
  }

  async processWithStrands(message: string, sessionId?: string): Promise<MockApiResponse<any>> {
    await simulateDelay(1500, 3500);
    
    const response = `Strands multi-agent system đã xử lý yêu cầu: "${message}". Hệ thống đã phân tích và phối hợp giữa các agent để đưa ra phản hồi tối ưu. Kết quả được tổng hợp từ ${Math.floor(Math.random() * 3) + 2} agents chuyên biệt.`;
    
    return this.createResponse({
      status: 'success',
      response,
      session_id: sessionId || `session-${Date.now()}`,
      agents_involved: ['supervisor', 'document_intelligence', 'compliance_validation'],
      processing_time: Math.random() * 3 + 1
    }, 'Strands processing completed successfully');
  }

  // Conversation APIs
  async sendMessage(request: {
    user_id: string;
    message: string;
    conversation_id?: string;
  }): Promise<MockApiResponse<any>> {
    await simulateDelay(800, 2000);
    
    const responses = [
      'Tôi hiểu yêu cầu của bạn. Hãy để tôi hỗ trợ bạn xử lý vấn đề này.',
      'Dựa trên thông tin bạn cung cấp, tôi khuyến nghị các bước sau...',
      'Để xử lý tín dụng thư này, chúng ta cần kiểm tra các điều kiện sau...',
      'Tôi đã phân tích tài liệu và phát hiện một số điểm cần lưu ý...'
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    return this.createResponse({
      status: 'success',
      response,
      conversation_id: request.conversation_id || `conv-${Date.now()}`,
      timestamp: new Date().toISOString()
    }, 'Message processed successfully');
  }

  // Performance and Statistics
  getRequestCount(): number {
    return this.requestCount;
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Generate real-time performance data
  getPerformanceHistory(): any[] {
    return generatePerformanceHistory(24);
  }

  // Get coordination history
  getCoordinationHistory(): any[] {
    return mockData.coordinationHistory;
  }
}

// Export singleton instance
export const mockApiService = new MockApiService();
export default mockApiService;
