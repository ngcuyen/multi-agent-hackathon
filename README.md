# 🤖 Multi-Agent AI Risk Assessment System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.2-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?style=flat&logo=React)](https://reactjs.org)
[![AWS](https://img.shields.io/badge/AWS-Bedrock-FF9900.svg?style=flat&logo=Amazon-AWS)](https://aws.amazon.com/bedrock/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=flat&logo=Docker)](https://www.docker.com/)

> 🏆 **Multi-Agent Hackathon Project** - AI-powered risk assessment system with document summarization, conversational AI, and multi-agent architecture using AWS Bedrock (Claude 3.7).

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- AWS Account with Bedrock access

### 1. Clone & Setup
```bash
git clone https://github.com/ngcuyen/multi-agent-hackathon.git
cd multi-agent-hackathon
```

### 2. Configure Environment
```bash
# Edit AWS credentials in app/riskassessment/.env
cp app/riskassessment/.env-template app/riskassessment/.env
# Add your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
```

### 3. Start Application
```bash
# Backend only
./start.sh

# Backend + Frontend
./start.sh --with-frontend
```

### 4. Access Services
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **Frontend UI**: http://localhost:3000 (if started)

### 5. Stop Application
```bash
./stop.sh
```

## 🎯 Features

### 🤖 **Multi-Agent System**
- **LangGraph Architecture**: Advanced AI workflow orchestration
- **Claude 3.7 Sonnet**: Latest AWS Bedrock AI model
- **Conversation Management**: Persistent chat sessions with context

### 📄 **Document Processing**
- **File Support**: PDF, DOCX, TXT (up to 10MB)
- **Summary Types**: General, bullet points, key insights, executive, detailed
- **Languages**: Vietnamese, English
- **Real-time Processing**: Progress tracking and status updates

### 💬 **Conversational AI**
- **Streaming Responses**: Real-time chat interface
- **Context Awareness**: Maintains conversation history
- **Error Recovery**: Graceful error handling and retry mechanisms

### 🎨 **Modern Frontend**
- **AWS CloudScape UI**: Professional design system
- **Responsive Design**: Mobile-first approach
- **Real-time Validation**: Input validation with live feedback
- **Accessibility**: Screen reader and keyboard navigation support

## 📊 API Endpoints

### Health Check
```bash
GET /riskassessment/public/api/v1/health-check/health
```

### Text Summarization
```bash
POST /riskassessment/api/v1/text/summary/text
Content-Type: application/json

{
  "text": "Your text content...",
  "summary_type": "bullet_points",
  "language": "vietnamese",
  "max_length": 300
}
```

### Document Upload
```bash
POST /riskassessment/api/v1/text/summary/document
Content-Type: multipart/form-data

file: [PDF/DOCX/TXT file]
summary_type: "executive_summary"
language: "vietnamese"
```

### Chat Interface
```bash
POST /riskassessment/api/v1/conversation/chat
Content-Type: application/json

{
  "message": "Hello! Can you help me analyze this document?",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123"
}
```

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

## 🛠️ Development

### Backend Development
```bash
# Start backend in development mode
docker-compose -f docker-compose.dev.yml up

# View logs
docker logs riskassessment-app -f
```

### Frontend Development
```bash
cd react-frontend
npm install
npm start
```

### Testing
```bash
# Test backend health
curl http://localhost:8080/riskassessment/public/api/v1/health-check/health

# Test text summarization
curl -X POST "http://localhost:8080/riskassessment/api/v1/text/summary/text" \
  -H "Content-Type: application/json" \
  -d '{"text": "Sample text...", "summary_type": "general", "language": "english"}'
```

## 📋 Configuration

### Environment Variables
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_BEDROCK_REGION=us-east-1

# Model Configuration
DEFAULT_MODEL_NAME=claude-37-sonnet
LLM_MAX_TOKENS=8192
LLM_TEMPERATURE=0.5

# Database Configuration
DYNAMODB_REGION=us-east-1
MONGODB_URI=your_mongodb_connection_string
```

## 🔧 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check Docker status
docker ps -a

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

**AWS Bedrock access denied:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check Bedrock permissions
aws bedrock list-foundation-models --region us-east-1
```

**Frontend can't connect:**
```bash
# Check backend health
curl http://localhost:8080/riskassessment/public/api/v1/health-check/health

# Verify proxy configuration in package.json
"proxy": "http://localhost:8080"
```

## 📈 Performance

- **Response Time**: < 5 seconds for text summarization
- **File Processing**: Up to 10MB documents
- **Concurrent Users**: Supports multiple simultaneous requests
- **Scalability**: Docker-based horizontal scaling ready

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AWS Bedrock** for Claude 3.7 Sonnet AI model
- **LangGraph** for multi-agent orchestration
- **FastAPI** for high-performance API framework
- **React** and **AWS CloudScape** for modern UI components

---

<div align="center">

**🏆 Built for Multi-Agent Hackathon 2024**

[![GitHub stars](https://img.shields.io/github/stars/ngcuyen/multi-agent-hackathon?style=social)](https://github.com/ngcuyen/multi-agent-hackathon/stargazers)

Made with ❤️ by the Multi-Agent Team

</div>
