# Multi-Agent Hackathon Frontend

A modern React TypeScript frontend for the Multi-Agent AI Risk Assessment System with comprehensive chat interface, agent management, and analytics dashboard.

## 🚀 Features

### Core Features
- **Multi-Agent Chat Interface** - Chat with different AI agents for risk assessment
- **Real-time Communication** - WebSocket support for live updates
- **Agent Management** - Create, edit, and manage AI agents
- **Session Management** - Persistent chat sessions with history
- **Dashboard & Analytics** - Usage statistics and performance metrics
- **File Upload & Processing** - Document upload and text extraction for risk analysis
- **Responsive Design** - Mobile-first responsive UI

### AI Integration
- **AWS Bedrock Integration** - Claude 3.7 Sonnet for risk assessment
- **Multiple AI Providers** - Support for OpenAI, Anthropic, Google AI
- **Model Selection** - Choose from different AI models
- **Custom System Prompts** - Configure agent behavior for risk assessment
- **Temperature & Token Control** - Fine-tune AI responses
- **Cost Tracking** - Monitor API usage and costs

### Developer Experience
- **TypeScript** - Full type safety
- **Material-UI** - Modern component library
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Socket.io** - Real-time communication
- **Recharts** - Data visualization

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **UI Library**: Material-UI (MUI) v7
- **State Management**: React Hooks + Context
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client
- **Charts**: Recharts
- **Markdown**: React-Markdown
- **Code Highlighting**: React-Syntax-Highlighter
- **File Upload**: React-Dropzone

## 📦 Installation

1. **Navigate to the frontend directory**:
   ```bash
   cd react-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## 🔧 Configuration

### Environment Variables

The `.env` file contains the following configuration:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080

# App Configuration
REACT_APP_NAME=Multi-Agent Risk Assessment Platform
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_FILE_UPLOAD=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_VOICE_CHAT=false

# Development
REACT_APP_DEBUG=true
```

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Chat/            # Chat interface components
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   └── TypingIndicator.tsx
│   ├── Agent/           # Agent management components
│   │   └── AgentSelector.tsx
│   ├── Dashboard/       # Dashboard and analytics
│   │   └── Dashboard.tsx
│   ├── FileUpload/      # File upload components
│   ├── ModelSelector/   # AI model selection
│   └── Navigation/      # Navigation components
├── pages/               # Page components
│   ├── Home/
│   ├── Chat/
│   ├── Agents/
│   └── Settings/
├── services/            # API services
│   └── api.ts          # API client and endpoints
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
│   └── index.ts        # Core types
├── utils/               # Utility functions
└── App.tsx             # Main application component
```

## 🔌 API Integration

The frontend integrates with the Multi-Agent Risk Assessment backend API running on port 8080:

### Risk Assessment API
- `POST /riskassessment/api/v1/chat` - Send message to risk assessment agent
- `GET /riskassessment/api/v1/history/:sessionId` - Get chat history
- `POST /riskassessment/api/v1/session` - Create new assessment session

### Agent API
- `GET /riskassessment/api/v1/agents` - Get all available agents
- `POST /riskassessment/api/v1/agents` - Create new agent
- `PUT /riskassessment/api/v1/agents/:id` - Update agent configuration

### Document Processing API
- `POST /riskassessment/api/v1/documents/upload` - Upload document for analysis
- `POST /riskassessment/api/v1/documents/:id/analyze` - Analyze document for risks

### Health Check
- `GET /riskassessment/public/api/v1/health-check/health` - Backend health status

## 🎨 UI Components

### Chat Interface
- **ChatInterface**: Main chat component with message history and risk assessment display
- **MessageBubble**: Individual message display with markdown support and risk highlighting
- **TypingIndicator**: Shows when agent is analyzing risks

### Risk Assessment
- **RiskAnalyzer**: Component for displaying risk assessment results
- **RiskMetrics**: Visual representation of risk scores and categories
- **DocumentViewer**: Display uploaded documents with risk annotations

### Agent Management
- **AgentSelector**: Grid view of available risk assessment agents
- **AgentEditor**: Create/edit agent configuration for specific risk domains
- **ModelSelector**: Choose AI model and parameters for risk analysis

### Dashboard
- **RiskDashboard**: Overview of risk assessments and trends
- **UsageStats**: Display usage metrics and API costs
- **Charts**: Visualize risk patterns and assessment history

## 🚀 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Integration with Backend

The frontend is designed to work seamlessly with the Multi-Agent Risk Assessment backend:

1. **Start the backend** (from project root):
   ```bash
   ./start.sh
   ```

2. **Start the frontend** (from react-frontend directory):
   ```bash
   npm start
   ```

3. **Or start both together** (from project root):
   ```bash
   ./start.sh --with-frontend
   ```

## 🔒 Security

- **Environment Variables**: Store sensitive configuration in environment variables
- **Request Interceptors**: Automatic authentication headers
- **Input Validation**: Validate user inputs before API calls
- **Error Handling**: Graceful error handling and user feedback
- **CORS Configuration**: Proper CORS setup for API communication

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:
- **Responsive Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Optimized for touch interactions
- **Mobile Navigation**: Collapsible sidebar for mobile
- **Performance**: Optimized for mobile performance

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Integration with Docker

The frontend can be served alongside the backend using Docker. The main project includes scripts to start both services together.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is part of the Multi-Agent Hackathon and follows the same license as the main project.

## 🆘 Support

For support and questions:
- Check the main project documentation
- Review the API integration guide
- Create an issue in the repository

---

**Ready to assess risks with AI!** 🤖🔍
