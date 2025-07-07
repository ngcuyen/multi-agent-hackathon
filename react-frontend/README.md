# ⚛️ React + AWS CloudScape Frontend

Modern React-based frontend for the Multi-Agent AI Risk Assessment System using AWS CloudScape Design System.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![CloudScape](https://img.shields.io/badge/AWS-CloudScape-orange)
![TypeScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)

## 🌟 Overview

This is a modern React application built with **AWS CloudScape Design System**, providing a professional, component-based architecture for the AI Risk Assessment system. It combines the power of React's ecosystem with AWS's enterprise-grade UI components.

### Why React + CloudScape?

- **⚛️ Modern React**: Latest React 18 with Hooks and functional components
- **🏢 Professional UI**: AWS CloudScape enterprise components
- **🔄 State Management**: React Hooks for efficient state handling
- **♿ Accessibility**: WCAG 2.1 AA compliant out of the box
- **🎨 Consistent Design**: AWS design language throughout
- **🚀 Developer Experience**: Hot reload, debugging tools, modern tooling

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Backend API running on port 8080

### Start the Application
```bash
# Option 1: Use the startup script (recommended)
./start-react.sh

# Option 2: Manual start
cd react-frontend
npm install
npm start
```

### Access the Application
- **React Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs

## 📱 Features

### 🎯 **Modern React Architecture**
- **Functional Components**: Modern React patterns with Hooks
- **Custom Hooks**: Reusable logic for notifications, loading states
- **Component Composition**: Modular, maintainable code structure
- **State Management**: Efficient local state with React Hooks

### 🏢 **AWS CloudScape Integration**
- **Professional Components**: Enterprise-grade UI elements
- **Consistent Styling**: AWS design system throughout
- **Accessibility**: Built-in WCAG 2.1 AA compliance
- **Responsive Design**: Mobile-first responsive components

### 📝 **Text Summarization**
- Professional form components with validation
- Real-time statistics display
- Multiple summary types selection
- Language selection (Vietnamese/English)

### 💬 **AI Chat Interface**
- Real-time streaming chat
- Message history management
- Typing indicators
- Professional message formatting

### 📁 **Document Upload**
- Drag & drop file upload
- File validation and error handling
- Progress indicators
- Professional file management UI

### 📊 **System Status Dashboard**
- Real-time system monitoring
- Service status indicators
- Expandable system information
- Professional status displays

## 🏗️ Architecture

### Component Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
│   ├── TextSummarization.js
│   ├── ChatInterface.js
│   ├── DocumentUpload.js
│   └── SystemStatus.js
├── services/           # API service layer
│   └── api.js
├── hooks/              # Custom React hooks
│   ├── useNotifications.js
│   └── useLoading.js
├── utils/              # Utility functions
├── styles/             # Global styles
└── App.js              # Main application component
```

### State Management
```javascript
// Custom hooks for state management
const { notifications, addNotification } = useNotifications();
const { isLoading, startLoading, stopLoading } = useLoading();

// Component state with React Hooks
const [inputText, setInputText] = useState('');
const [summaryResult, setSummaryResult] = useState(null);
```

### API Integration
```javascript
// Centralized API service
import { summarizeText, sendChatMessage } from '../services/api';

// Usage in components
const response = await summarizeText(requestData);
```

## 🎨 CloudScape Components Used

### Layout & Navigation
- `AppLayout` - Main application layout
- `TopNavigation` - Professional top navigation
- `SideNavigation` - Sidebar navigation menu
- `Container` - Content containers with headers

### Forms & Inputs
- `FormField` - Professional form fields with labels
- `Input` - Text inputs with validation
- `Textarea` - Multi-line text areas
- `Select` - Dropdown selectors with options
- `Button` - Action buttons with icons and loading states

### Feedback & Status
- `Flashbar` - Professional notification system
- `Alert` - Contextual alerts and messages
- `StatusIndicator` - System status displays
- `Spinner` - Loading indicators

### Data Display
- `KeyValuePairs` - Structured data display
- `ExpandableSection` - Collapsible content sections
- `Grid` - Responsive grid layouts
- `Box` - Layout and spacing utility

## 🔧 Development

### Available Scripts
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (not recommended)
npm run eject
```

### Environment Variables
```bash
# Development
NODE_ENV=development
PORT=3000
BROWSER=none

# Production
NODE_ENV=production
```

### Custom Hooks

#### useNotifications
```javascript
const { notifications, addNotification, removeNotification } = useNotifications();

// Add notification
addNotification({
  type: 'success',
  content: 'Operation completed successfully!',
  dismissible: true
});
```

#### useLoading
```javascript
const { isLoading, startLoading, stopLoading } = useLoading();

// Show loading
startLoading('Processing...');
// Hide loading
stopLoading();
```

## 🎯 Component Examples

### Text Summarization Component
```jsx
const TextSummarization = ({ onNotification }) => {
  const [inputText, setInputText] = useState('');
  const { isLoading, startLoading, stopLoading } = useLoading();

  const handleSummarize = async () => {
    startLoading('Summarizing text...');
    try {
      const response = await summarizeText({ text: inputText });
      // Handle response
    } catch (error) {
      onNotification({ type: 'error', content: 'Error occurred!' });
    } finally {
      stopLoading();
    }
  };

  return (
    <Container>
      <FormField label="Text to summarize">
        <Textarea value={inputText} onChange={({detail}) => setInputText(detail.value)} />
      </FormField>
      <Button onClick={handleSummarize} loading={isLoading}>
        Summarize
      </Button>
    </Container>
  );
};
```

### Chat Interface Component
```jsx
const ChatInterface = ({ onNotification }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async () => {
    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: inputMessage }]);
    
    // Send to API and handle streaming response
    const response = await sendChatMessage({ message: inputMessage });
    // Handle streaming response...
  };

  return (
    <Container>
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`chat-message ${message.type}`}>
            {message.content}
          </div>
        ))}
      </div>
      <SpaceBetween direction="horizontal" size="s">
        <Input value={inputMessage} onChange={({detail}) => setInputMessage(detail.value)} />
        <Button onClick={handleSendMessage}>Send</Button>
      </SpaceBetween>
    </Container>
  );
};
```

## 🔒 Security & Best Practices

### Security Features
- **Input Validation**: Client-side validation for all inputs
- **XSS Prevention**: Safe HTML rendering with dangerouslySetInnerHTML only when needed
- **File Upload Security**: File type and size validation
- **API Security**: Proper error handling and request validation

### React Best Practices
- **Functional Components**: Modern React patterns
- **Custom Hooks**: Reusable logic extraction
- **Proper State Management**: Efficient state updates
- **Error Boundaries**: Graceful error handling
- **Performance Optimization**: Proper re-rendering control

### Code Quality
```javascript
// Proper error handling
try {
  const response = await api.call();
  // Handle success
} catch (error) {
  console.error('API Error:', error);
  onNotification({ type: 'error', content: 'Operation failed' });
}

// Proper cleanup
useEffect(() => {
  const cleanup = () => {
    // Cleanup logic
  };
  return cleanup;
}, []);
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### CloudScape Grid System
```jsx
<Grid
  gridDefinition={[
    { colspan: { default: 12, xs: 6, s: 4 } },
    { colspan: { default: 12, xs: 6, s: 8 } }
  ]}
>
  <div>Column 1</div>
  <div>Column 2</div>
</Grid>
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **Dependencies Not Installing**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

#### 3. **CloudScape Components Not Rendering**
```bash
# Check if CloudScape is properly installed
npm list @cloudscape-design/components

# Reinstall if needed
npm install @cloudscape-design/components @cloudscape-design/global-styles
```

#### 4. **API Connection Issues**
```javascript
// Check proxy configuration in package.json
"proxy": "http://localhost:8080"

// Or configure CORS in development
const api = axios.create({
  baseURL: 'http://localhost:8080',
  // ... other config
});
```

### Debug Mode
```javascript
// Enable React DevTools
// Install React Developer Tools browser extension

// Console logging
console.log('Component state:', { inputText, summaryResult });

// Network debugging
// Check Network tab in browser DevTools
```

## 🚀 Production Build

### Build for Production
```bash
# Create production build
npm run build

# Serve production build locally
npx serve -s build -l 3000
```

### Deployment Options
```bash
# Static hosting (Netlify, Vercel, S3)
npm run build
# Upload build/ folder

# Docker deployment
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
```

## 📊 Performance

### Optimization Features
- **Code Splitting**: Automatic code splitting with React.lazy
- **Tree Shaking**: Unused code elimination
- **Bundle Analysis**: webpack-bundle-analyzer integration
- **Caching**: Browser caching for static assets

### Performance Monitoring
```javascript
// React DevTools Profiler
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('Component render time:', actualDuration);
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone <your-fork>`
3. Install dependencies: `npm install`
4. Start development server: `npm start`
5. Make changes and test
6. Submit pull request

### Code Standards
- **ESLint**: Follow React/JavaScript best practices
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📞 Support

### Getting Help
1. **React Documentation**: https://reactjs.org/docs
2. **CloudScape Documentation**: https://cloudscape.design/
3. **Create React App**: https://create-react-app.dev/
4. **GitHub Issues**: Create issue in repository

### Common Resources
- **React DevTools**: Browser extension for debugging
- **CloudScape Storybook**: Component examples and documentation
- **Stack Overflow**: Community support for React questions

---

## 🎉 React + CloudScape Frontend Ready!

Your modern React application is now ready with:

- ✅ **React 18** with modern Hooks
- ✅ **AWS CloudScape Design System**
- ✅ **Professional UI Components**
- ✅ **Real-time AI Features**
- ✅ **Responsive Design**
- ✅ **Production-ready Architecture**

**🌐 Access your React application at: http://localhost:3000**

Experience the power of modern React with AWS CloudScape! ⚛️🚀
