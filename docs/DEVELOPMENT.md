# 🛠️ VPBank K-MULT Agent Studio - Development Guide

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (v20.10+)
- **Node.js** (v18+) for frontend development
- **Python** (v3.9+) for backend development
- **AWS Account** with Bedrock access (Claude 3.7 Sonnet)

### 1. Clone Repository
```bash
git clone https://github.com/ngcuyen/multi-agent-hackathon.git
cd multi-agent-hackathon
```

### 2. Environment Setup
```bash
# Configure AWS credentials
cp backend/app/riskassessment/.env-template backend/app/riskassessment/.env
# Edit .env file with your AWS credentials
```

### 3. Development Environment
```bash
# Start full development stack
docker-compose -f docker-compose.dev.yml up -d

# Or start individual services
docker-compose -f docker-compose.dev.yml up riskassessment-dev
docker-compose -f docker-compose.dev.yml up frontend-dev
```

### 4. Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🏗️ Project Structure

```
vpbank-kmult-agent-studio/
├── 📁 backend/                     # Backend application
│   ├── 📁 app/riskassessment/      # Main FastAPI application
│   └── 📁 docker/                  # Backend Docker configurations
├── 📁 frontend/                    # React frontend application
├── 📁 infrastructure/              # Infrastructure as Code
├── 📁 docs/                        # Documentation
├── 📁 data/                        # Sample data and test files
├── 📁 scripts/                     # Utility scripts
├── 📁 tests/                       # Test suites
├── 📁 logs/                        # Application logs
└── 📁 examples/                    # Code examples
```

## 🔧 Backend Development

### Setup Local Environment
```bash
cd backend/app/riskassessment

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### Environment Variables
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_BEDROCK_REGION=us-east-1

# AI Model Configuration
DEFAULT_MODEL_NAME=claude-37-sonnet
LLM_MAX_TOKENS=8192
LLM_TEMPERATURE=0.5

# Database Configuration
MONGODB_URI=mongodb://localhost:27017
MONGO_DB_NAME=db_agents
```

### API Development
```bash
# Test API endpoints
curl http://localhost:8080/riskassessment/public/api/v1/health-check/health

# View API documentation
open http://localhost:8080/docs
```

### Adding New Agents
1. Create agent directory in `backend/app/riskassessment/agents/`
2. Implement agent class inheriting from base agent
3. Register agent in supervisor
4. Add agent routes and services
5. Update documentation

## ⚛️ Frontend Development

### Setup Local Environment
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Available Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run test suite
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Component Development
```bash
# Create new component
mkdir src/components/NewComponent
touch src/components/NewComponent/index.tsx
touch src/components/NewComponent/NewComponent.tsx
touch src/components/NewComponent/styles.css
```

### State Management
- **Redux Toolkit** for global state
- **React Query** for server state
- **Local state** for component-specific data

## 🧪 Testing

### Backend Testing
```bash
cd backend/app/riskassessment

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_agents.py
```

### Frontend Testing
```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test
npm test -- --testNamePattern="Component"
```

### Integration Testing
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
```

## 🔍 Debugging

### Backend Debugging
```bash
# Enable debug mode
export DEBUG=true

# Use Python debugger
import pdb; pdb.set_trace()

# View logs
docker logs vpbank-kmult-backend-dev -f
```

### Frontend Debugging
```bash
# React Developer Tools
# Install browser extension

# Debug in VS Code
# Use Chrome debugger configuration

# View logs
docker logs vpbank-kmult-frontend-dev -f
```

## 📊 Monitoring & Logging

### Application Logs
```bash
# Backend logs
tail -f logs/backend/app.log

# Frontend logs
tail -f logs/frontend/app.log

# System logs
tail -f logs/system/system.log
```

### Performance Monitoring
```bash
# Monitor API performance
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:8080/api/endpoint

# Monitor memory usage
docker stats vpbank-kmult-backend-dev
```

## 🚀 Deployment

### Development Deployment
```bash
# Build and deploy to development
docker-compose up --build

# Deploy specific service
docker-compose up --build riskassessment
```

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to AWS
./scripts/deploy.sh production
```

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Port already in use
lsof -ti:8080 | xargs kill -9

# Database connection issues
docker-compose restart mongodb-dev

# AWS credentials issues
aws configure list
```

#### Frontend Issues
```bash
# Node modules issues
rm -rf node_modules package-lock.json
npm install

# Build issues
npm run build -- --verbose

# Memory issues
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Performance Issues
```bash
# Check container resources
docker stats

# Monitor database performance
docker exec -it vpbank-kmult-mongodb-dev mongo --eval "db.stats()"

# Check API response times
curl -w "%{time_total}" http://localhost:8080/api/endpoint
```

## 📚 Development Best Practices

### Code Quality
- **ESLint** and **Prettier** for code formatting
- **Type checking** with TypeScript
- **Unit tests** for all components and functions
- **Integration tests** for API endpoints
- **Code reviews** for all pull requests

### Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/new-agent
git add .
git commit -m "feat: add new risk assessment agent"
git push origin feature/new-agent
# Create pull request
```

### Documentation
- **API documentation** with OpenAPI/Swagger
- **Component documentation** with Storybook
- **Architecture documentation** in docs/
- **README files** for each module

## 🤝 Contributing

### Development Process
1. **Fork** the repository
2. **Create** feature branch
3. **Implement** changes with tests
4. **Update** documentation
5. **Submit** pull request
6. **Code review** and merge

### Code Standards
- **Python**: PEP 8, Black formatting
- **TypeScript**: ESLint, Prettier
- **Commit messages**: Conventional Commits
- **Branch naming**: feature/, bugfix/, hotfix/

---

*Happy coding! 🚀 For questions, please check the documentation or create an issue.*
