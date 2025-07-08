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
docker-compose up -d

# Frontend (in separate terminal)
cd fontend
npm install
npm start
```

### 4. Access Services
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **Frontend UI**: http://localhost:3000
- **Health Check**: http://localhost:8080/riskassessment/public/api/v1/health-check/health

### 5. Stop Application
```bash
docker-compose down
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
- **OCR Support**: Automatic text extraction from scanned PDFs

### 💬 **Conversational AI**
- **Streaming Responses**: Real-time chat interface
- **Context Awareness**: Maintains conversation history
- **Error Recovery**: Graceful error handling and retry mechanisms

### 🎨 **Modern Frontend**
- **AWS CloudScape UI**: Professional design system
- **Responsive Design**: Mobile-first approach
- **Real-time Validation**: Input validation with live feedback
- **Accessibility**: Screen reader and keyboard navigation support
- **CORS Support**: Seamless frontend-backend communication

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
docker-compose up

# View logs
docker logs riskassessment-app -f

# Restart backend
docker-compose restart
```

### Frontend Development
```bash
cd fontend
npm install
npm start

# Build for production
npm run build

# Fix TypeScript errors
npm run fix-errors
```

### Testing
```bash
# Test backend health
curl http://localhost:8080/riskassessment/public/api/v1/health-check/health

# Test text summarization
curl -X POST "http://localhost:8080/riskassessment/api/v1/text/summary/text" \
  -H "Content-Type: application/json" \
  -d '{"text": "Sample text...", "summary_type": "general", "language": "english"}'

# Test document upload
curl -X POST "http://localhost:8080/riskassessment/api/v1/text/summary/document" \
  -F "file=@sample.pdf" \
  -F "summary_type=general" \
  -F "language=vietnamese"
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

# Frontend Configuration
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_DEBUG=true
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

**CORS Issues:**
- Backend includes CORS middleware for all origins
- Frontend uses proxy configuration for development
- Check browser console for detailed error messages

**Document Processing Slow:**
- PDF with OCR can take 30-60 seconds
- Use text files for faster testing
- Check backend logs for processing status

## 📈 Performance

- **Response Time**: 
  - Text summarization: 3-8 seconds
  - Document processing: 10-60 seconds (depending on OCR needs)
- **File Processing**: Up to 10MB documents
- **Concurrent Users**: Supports multiple simultaneous requests
- **Scalability**: Docker-based horizontal scaling ready

## 🆕 Recent Updates

### Version 2.0 (Latest)
- ✅ **Fixed CORS Issues**: Proper middleware configuration
- ✅ **Enhanced Error Handling**: Detailed error messages and logging
- ✅ **Improved Frontend**: Better UX with progress indicators
- ✅ **Document Upload Fix**: Resolved "Failed to fetch" errors
- ✅ **TypeScript Improvements**: Fixed compilation errors
- ✅ **Proxy Configuration**: Seamless development experience

### Bug Fixes
- Fixed "Không thể tóm tắt tài liệu" error
- Resolved CORS preflight issues
- Improved API response handling
- Enhanced error messages in Vietnamese

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add proper error handling
- Include Vietnamese language support
- Test both frontend and backend changes
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AWS Bedrock** for Claude 3.7 Sonnet AI model
- **LangGraph** for multi-agent orchestration
- **FastAPI** for high-performance API framework
- **React** and **AWS CloudScape** for modern UI components
- **Docker** for containerization and deployment

## 📞 Support

If you encounter any issues:

1. **Check the logs**: `docker logs riskassessment-app`
2. **Verify configuration**: Ensure AWS credentials are correct
3. **Test endpoints**: Use the provided curl commands
4. **Check browser console**: For frontend issues
5. **Create an issue**: On GitHub with detailed error information

---

<div align="center">

**🏆 Built for Multi-Agent Hackathon 2024**

[![GitHub stars](https://img.shields.io/github/stars/ngcuyen/multi-agent-hackathon?style=social)](https://github.com/ngcuyen/multi-agent-hackathon/stargazers)

Made with ❤️ by the Multi-Agent Team

**Latest Update**: Fixed CORS and document processing issues ✨

</div>
