# GenAI Frontend

A modern React TypeScript frontend for GenAI multi-agent systems with comprehensive chat interface, agent management, and analytics dashboard.

## 🚀 Features

### Core Features
- **Multi-Agent Chat Interface** - Chat with different AI agents
- **Real-time Communication** - WebSocket support for live updates
- **Agent Management** - Create, edit, and manage AI agents
- **Session Management** - Persistent chat sessions with history
- **Dashboard & Analytics** - Usage statistics and performance metrics
- **File Upload & Processing** - Document upload and text extraction
- **Responsive Design** - Mobile-first responsive UI

### AI Integration
- **Multiple AI Providers** - OpenAI, Anthropic, Google AI, AWS Bedrock
- **Model Selection** - Choose from different AI models
- **Custom System Prompts** - Configure agent behavior
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

- **Frontend**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Hooks + Context
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client
- **Charts**: Recharts
- **Markdown**: React-Markdown
- **Code Highlighting**: React-Syntax-Highlighter
- **File Upload**: React-Dropzone

## 📦 Installation

1. **Clone and navigate to the project**:
   ```bash
   cd /home/ubuntu/multi-agent-hackathon/genai-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000/ws

# AI Provider API Keys
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key
REACT_APP_GOOGLE_AI_API_KEY=your_google_ai_api_key

# AWS Configuration
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_ACCESS_KEY_ID=your_aws_access_key
REACT_APP_AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Feature Flags
REACT_APP_ENABLE_FILE_UPLOAD=true
REACT_APP_ENABLE_VOICE_CHAT=false
REACT_APP_ENABLE_IMAGE_GENERATION=true
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

The frontend is designed to work with a GenAI backend API. Key endpoints:

### Chat API
- `POST /chat/message` - Send message to agent
- `GET /chat/history/:sessionId` - Get chat history
- `POST /chat/session` - Create new chat session
- `GET /chat/sessions` - Get all chat sessions

### Agent API
- `GET /agents` - Get all agents
- `POST /agents` - Create new agent
- `PUT /agents/:id` - Update agent
- `DELETE /agents/:id` - Delete agent

### Model API
- `GET /models` - Get available AI models
- `POST /models/:id/test` - Test model connection

### File API
- `POST /files/upload` - Upload file
- `POST /files/:id/process` - Process document

### Analytics API
- `GET /analytics/usage` - Get usage statistics
- `GET /analytics/agents/:id` - Get agent metrics

## 🎨 UI Components

### Chat Interface
- **ChatInterface**: Main chat component with message history
- **MessageBubble**: Individual message display with markdown support
- **TypingIndicator**: Shows when agent is responding

### Agent Management
- **AgentSelector**: Grid view of available agents
- **AgentEditor**: Create/edit agent configuration
- **ModelSelector**: Choose AI model and parameters

### Dashboard
- **UsageStats**: Display usage metrics and costs
- **Charts**: Visualize usage patterns and trends
- **ActivityFeed**: Recent activity and events

## 🚀 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Adding New Features

1. **Create Component**:
   ```bash
   mkdir src/components/NewFeature
   touch src/components/NewFeature/NewFeature.tsx
   ```

2. **Add Types**:
   ```typescript
   // src/types/index.ts
   export interface NewFeatureType {
     id: string;
     name: string;
   }
   ```

3. **Add API Service**:
   ```typescript
   // src/services/api.ts
   export const newFeatureAPI = {
     getData: async (): Promise<APIResponse<NewFeatureType[]>> => {
       const response = await apiClient.get('/new-feature');
       return response.data;
     },
   };
   ```

## 🔒 Security

- **API Key Management**: Store API keys in environment variables
- **Request Interceptors**: Automatic authentication headers
- **Input Validation**: Validate user inputs before API calls
- **Error Handling**: Graceful error handling and user feedback

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

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API integration guide

---

**Ready to build amazing GenAI applications!** 🚀
