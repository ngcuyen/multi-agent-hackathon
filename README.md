# 🤖 Multi-Agent AI Risk Assessment System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.2-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?style=flat&logo=React)](https://reactjs.org)
[![AWS](https://img.shields.io/badge/AWS-Bedrock-FF9900.svg?style=flat&logo=Amazon-AWS)](https://aws.amazon.com/bedrock/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=flat&logo=Docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🏆 **Multi-Agent Hackathon Project** - An advanced AI-powered risk assessment system with intelligent document summarization, conversational AI, and multi-agent architecture.

## 🌟 Overview

This project is a comprehensive AI Risk Assessment System built for a multi-agent hackathon. It combines the power of AWS Bedrock (Claude 3.7), LangGraph multi-agent workflows, and modern web technologies to provide intelligent document analysis, text summarization, and conversational AI capabilities.

### 🎯 Key Features

- **🤖 Multi-Agent Architecture**: Built with LangGraph for complex AI workflows
- **📄 Document Summarization**: Support for PDF, DOCX, TXT files with multiple summary types
- **💬 Conversational AI**: Intelligent chat interface with context awareness
- **🌐 Modern Web UI**: React frontend with AWS CloudScape design system
- **☁️ Cloud-Native**: AWS Bedrock integration with DynamoDB and S3
- **🔒 Production Ready**: Docker containerization with health checks
- **📊 Real-time Processing**: Streaming responses and real-time updates

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend│────▶│   FastAPI       │────▶│   AWS Bedrock   │
│   (Port 3000)   │     │   Backend       │     │   (Claude 3.7)  │
│                 │     │   (Port 8080)   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌─────────────────┐                │
         │              │   LangGraph     │                │
         │              │   Multi-Agent   │                │
         │              │   Workflow      │                │
         │              └─────────────────┘                │
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                    ┌─────────────────────────────────┐
                    │        Data Layer               │
                    │  ┌─────────────┐ ┌─────────────┐│
                    │  │  DynamoDB   │ │     S3      ││
                    │  │(Conversations)│ │(Documents) ││
                    │  └─────────────┘ └─────────────┘│
                    └─────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for React frontend)
- **Python 3.12+** (for local development)
- **AWS Account** with Bedrock access

### 🐳 Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/ngcuyen/multi-agent-hackathon.git
   cd multi-agent-hackathon
   ```

2. **Configure environment**
   ```bash
   # Copy and edit environment file
   cp app/riskassessment/.env-template app/riskassessment/.env
   # Edit .env with your AWS credentials
   ```

3. **Start the application**
   ```bash
   # Start backend only
   docker-compose up -d
   
   # Or start everything (backend + frontend)
   ./start-all.sh
   ```

4. **Access the application**
   - **Backend API**: http://localhost:8080
   - **API Documentation**: http://localhost:8080/docs
   - **Health Check**: http://localhost:8080/riskassessment/public/api/v1/health-check/health

### 🛠️ Development Setup

1. **Start development environment**
   ```bash
   ./start-dev.sh
   ```

2. **Access services**
   - **Frontend UI**: http://localhost:3000 (React dev server)
   - **Backend API**: http://localhost:8080 (with hot reload)

3. **Stop development environment**
   ```bash
   ./stop-dev.sh
   ```

## 📚 API Documentation

### 🔍 Core Endpoints

#### Health Check
```bash
GET /riskassessment/public/api/v1/health-check/health
```

#### Text Summarization
```bash
# Summarize text directly
POST /riskassessment/api/v1/text/summary/text
Content-Type: application/json

{
  "text": "Your text content here...",
  "summary_type": "bullet_points",
  "language": "en"
}
```

#### Document Upload & Summarization
```bash
# Upload and summarize document
POST /riskassessment/api/v1/text/summary/document
Content-Type: multipart/form-data

file: [PDF/DOCX/TXT file]
summary_type: "executive_summary"
language: "vietnamese"
```

#### Conversational AI
```bash
# Chat with AI agent
POST /riskassessment/api/v1/conversation/chat
Content-Type: application/json

{
  "message": "Hello! Can you help me analyze this document?",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123"
}
```

#### Summary Types
```bash
# Get available summary types
GET /riskassessment/api/v1/text/summary/types
```

### 📊 Summary Types Available

| Type | Description | Use Case |
|------|-------------|----------|
| `general` | Tóm tắt chung | General overview |
| `bullet_points` | Điểm chính | Key points listing |
| `key_insights` | Thông tin quan trọng | Important insights |
| `executive_summary` | Tóm tắt điều hành | Executive briefing |
| `detailed` | Tóm tắt chi tiết | Detailed but concise |

### 🌐 Supported Languages

- **Vietnamese** (`vietnamese`)
- **English** (`english`)

### 📁 Supported File Types

- **PDF** (`.pdf`) - Up to 10MB
- **Word Documents** (`.docx`, `.doc`) - Up to 10MB  
- **Text Files** (`.txt`) - Up to 10MB

## 🧪 Testing the API

### Using cURL

```bash
# Test health check
curl http://localhost:8080/riskassessment/public/api/v1/health-check/health

# Test text summarization
curl -X POST "http://localhost:8080/riskassessment/api/v1/text/summary/text" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial Intelligence is transforming industries...",
    "summary_type": "bullet_points",
    "language": "en"
  }'

# Test document upload
curl -X POST "http://localhost:8080/riskassessment/api/v1/text/summary/document" \
  -F "file=@document.pdf" \
  -F "summary_type=executive_summary" \
  -F "language=vietnamese"
```

### Using Python

```python
import requests
import json

# Test text summarization
url = "http://localhost:8080/riskassessment/api/v1/text/summary/text"
data = {
    "text": "Your text content here...",
    "summary_type": "bullet_points",
    "language": "en"
}

response = requests.post(url, json=data)
print(json.dumps(response.json(), indent=2))
```

## 🎨 Frontend Features

### React + AWS CloudScape UI

- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🎯 Modern Interface**: AWS CloudScape design system
- **⚡ Real-time Updates**: Live chat and document processing
- **📊 Rich Components**: Tables, forms, modals, and more

### Key Components

- **Document Upload**: Drag & drop file upload with progress
- **Chat Interface**: Real-time conversation with AI agents
- **Summary Dashboard**: Multiple summary types and formats
- **Settings Panel**: Language and preference configuration

## 🔧 Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_BEDROCK_REGION=us-east-1

# Bedrock Configuration
DEFAULT_MODEL_NAME=claude-37-sonnet
LLM_MAX_TOKENS=8192
LLM_TEMPERATURE=0.5

# Database Configuration
DYNAMODB_REGION=us-east-1
DYNAMODB_CONVERSATION_TABLE=conversations
DYNAMODB_MESSAGE_TABLE=messages

# S3 Configuration
EXTRACTED_CONTENT_BUCKET=document-text-summary-bucket
```

### Docker Configuration

```yaml
# docker-compose.yml
services:
  riskassessment:
    image: riskassessment:0.0.1
    ports:
      - '8080:8080'
    env_file:
      - ./app/riskassessment/.env
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/riskassessment/public/api/v1/health-check/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🏗️ Multi-Agent Architecture

### LangGraph Workflow

The system uses LangGraph to orchestrate multiple AI agents:

```python
# Agent workflow structure
class ConversationAgent:
    - Document Analysis Agent
    - Summarization Agent  
    - Chat Response Agent
    - Context Management Agent
```

### Agent Responsibilities

1. **📄 Document Analysis Agent**: Extracts and processes document content
2. **📝 Summarization Agent**: Creates different types of summaries
3. **💬 Chat Response Agent**: Handles conversational interactions
4. **🧠 Context Management Agent**: Maintains conversation context

## 📊 Monitoring & Logging

### Health Checks

```bash
# Backend health
curl http://localhost:8080/riskassessment/public/api/v1/health-check/health

# Container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Logs

```bash
# Backend logs
docker logs riskassessment-app -f

# All logs
docker-compose logs -f
```

## 🚀 Deployment

### Production Deployment

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.yml build
   ```

2. **Deploy with environment**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Scale services**
   ```bash
   docker-compose up -d --scale riskassessment=3
   ```

### AWS Deployment

The system is designed for AWS deployment with:

- **ECS/Fargate**: Container orchestration
- **Application Load Balancer**: Traffic distribution
- **DynamoDB**: Conversation storage
- **S3**: Document storage
- **Bedrock**: AI model access

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make changes and test**
   ```bash
   ./start-dev.sh
   # Test your changes
   ```
4. **Commit and push**
   ```bash
   git commit -m 'Add amazing feature'
   git push origin feature/amazing-feature
   ```
5. **Create Pull Request**

### Code Standards

- **Python**: Follow PEP 8, use type hints
- **JavaScript**: Use ES6+, follow React best practices
- **Docker**: Multi-stage builds, security best practices
- **API**: RESTful design, proper HTTP status codes

## 📋 Project Structure

```
multi-agent-hackathon/
├── 📁 app/riskassessment/          # FastAPI Backend
│   ├── 📁 agents/                  # Multi-agent workflows
│   ├── 📁 routes/                  # API endpoints
│   ├── 📁 services/                # Business logic
│   ├── 📁 models/                  # Data models
│   └── 📄 main.py                  # Application entry
├── 📁 react-frontend/              # React Frontend
│   ├── 📁 src/components/          # React components
│   ├── 📁 src/pages/               # Page components
│   ├── 📁 src/services/            # API services
│   └── 📄 package.json             # Dependencies
├── 📁 docs/                        # Documentation
├── 📁 scripts/                     # Utility scripts
├── 📄 docker-compose.yml           # Docker configuration
├── 📄 start-all.sh                 # Start script
└── 📄 README.md                    # This file
```

## 🔍 Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   # Check logs
   docker logs riskassessment-app
   
   # Rebuild image
   docker-compose build --no-cache
   ```

2. **AWS Bedrock access denied**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   
   # Verify Bedrock permissions
   aws bedrock list-foundation-models --region us-east-1
   ```

3. **Frontend can't connect to backend**
   ```bash
   # Check backend health
   curl http://localhost:8080/riskassessment/public/api/v1/health-check/health
   
   # Check proxy configuration in package.json
   "proxy": "http://localhost:8080"
   ```

### Performance Optimization

- **Use Redis** for caching frequent requests
- **Implement pagination** for large document lists
- **Use CDN** for static assets
- **Enable compression** for API responses

## 📈 Roadmap

### Phase 1 - Current ✅
- [x] Multi-agent architecture with LangGraph
- [x] Document summarization (PDF, DOCX, TXT)
- [x] Conversational AI interface
- [x] React frontend with AWS CloudScape
- [x] Docker containerization

### Phase 2 - In Progress 🚧
- [ ] Advanced document analysis (tables, images)
- [ ] Multi-language support expansion
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard

### Phase 3 - Planned 📋
- [ ] Mobile app development
- [ ] Advanced AI model fine-tuning
- [ ] Enterprise SSO integration
- [ ] Advanced security features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AWS Bedrock** for powerful AI capabilities
- **LangGraph** for multi-agent orchestration
- **FastAPI** for high-performance API framework
- **React** and **AWS CloudScape** for modern UI
- **Docker** for containerization

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ngcuyen/multi-agent-hackathon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ngcuyen/multi-agent-hackathon/discussions)
- **Email**: support@example.com

---

<div align="center">

**🏆 Built for Multi-Agent Hackathon 2024**

[![GitHub stars](https://img.shields.io/github/stars/ngcuyen/multi-agent-hackathon?style=social)](https://github.com/ngcuyen/multi-agent-hackathon/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ngcuyen/multi-agent-hackathon?style=social)](https://github.com/ngcuyen/multi-agent-hackathon/network/members)

Made with ❤️ by the Multi-Agent Team

</div>
