# 🎨 Frontend UI - Complete Guide

## 🌟 Overview

A modern, responsive web interface for the AI Risk Assessment Multi-Agent Hackathon project. Built with vanilla JavaScript, Tailwind CSS, and modern web standards.

![UI Preview](https://img.shields.io/badge/UI-Modern%20Web%20Interface-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Responsive](https://img.shields.io/badge/Design-Responsive-purple)

## 🚀 Quick Start

### 1. Start Both Backend and Frontend
```bash
# One command to start everything
./start-dev.sh
```

### 2. Access the Application
- **Frontend UI**: http://localhost:3001
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs

### 3. Stop Everything
```bash
./stop-dev.sh
```

## 📱 Features Overview

### 🔍 **Tab 1: Text Summarization**
![Text Summarization](https://img.shields.io/badge/Feature-Text%20Summarization-blue)

**What it does:**
- Summarize any Vietnamese or English text
- Multiple summary types (general, bullet points, key insights, etc.)
- Customizable length (50-1000 words)
- Real-time statistics and processing info

**How to use:**
1. Paste your text in the large text area
2. Select summary type from dropdown
3. Set maximum length
4. Choose language (Vietnamese/English)
5. Click "Tóm tắt" button
6. View results with statistics

**Example:**
```
Input: Long article about AI technology...
Output: Concise summary with key points
Statistics: Original: 1000 chars → Summary: 300 chars (3.3x compression)
```

### 💬 **Tab 2: AI Chat Interface**
![AI Chat](https://img.shields.io/badge/Feature-AI%20Chat-green)

**What it does:**
- Interactive conversation with Claude 3.7 Sonnet
- Real-time streaming responses
- Context-aware conversations
- Vietnamese language support

**How to use:**
1. Type your message in the chat input
2. Press Enter or click send button
3. Watch AI respond in real-time
4. Continue the conversation naturally

**Example conversation:**
```
You: "Hãy tóm tắt văn bản này: [paste text]"
AI: "📄 Tóm tắt văn bản: [provides formatted summary]"
```

### 📁 **Tab 3: Document Upload**
![Document Upload](https://img.shields.io/badge/Feature-Document%20Processing-purple)

**What it does:**
- Upload and process documents (TXT, PDF, DOCX, DOC)
- Drag & drop interface
- OCR text extraction
- Automatic summarization

**How to use:**
1. Drag file to drop zone OR click "Chọn file"
2. Select summary type and length
3. Click "Tóm tắt tài liệu"
4. View extracted text and summary

**Supported formats:**
- 📄 TXT files
- 📕 PDF documents
- 📘 Word documents (.docx, .doc)
- 🖼️ Images with text (OCR)

## 🎯 User Interface Guide

### Navigation Bar
```
🤖 AI Risk Assessment    [Health Check] [API Docs]
```
- **Health Check**: Test backend connection
- **API Docs**: Open Swagger documentation

### Tab Navigation
```
[📝 Tóm tắt văn bản] [💬 Trò chuyện AI] [📁 Upload tài liệu]
```

### Summary Types Available
1. **Tóm tắt chung** - General overview
2. **Điểm chính** - Key points as bullet list
3. **Thông tin quan trọng** - Important insights
4. **Tóm tắt điều hành** - Executive summary
5. **Tóm tắt chi tiết** - Detailed but concise

### Language Options
- 🇻🇳 **Tiếng Việt** (Vietnamese)
- 🇺🇸 **English**

## 🔧 Technical Architecture

### Frontend Stack
```
┌─────────────────────────────────────┐
│           Frontend (Port 3001)      │
├─────────────────────────────────────┤
│ • HTML5 + CSS3 + Vanilla JS        │
│ • Tailwind CSS (Utility-first)     │
│ • Font Awesome (Icons)             │
│ • Google Fonts (Inter)             │
│ • Responsive Design                │
└─────────────────────────────────────┘
```

### API Communication
```
Frontend ←→ Backend API (Port 8080)
    │
    ├── Health Check
    ├── Text Summarization
    ├── Document Upload
    ├── AI Chat (Streaming)
    └── Summary Types
```

### File Structure
```
frontend/
├── index.html              # Main UI
├── src/
│   └── app.js             # JavaScript logic
├── server.py              # Development server
├── README.md              # Documentation
└── frontend.log           # Server logs
```

## 🎨 UI Components

### 1. **Toast Notifications**
```javascript
showToast('Message', 'success|error|warning|info')
```
- Auto-dismiss after 5 seconds
- Color-coded by type
- Slide-in animation

### 2. **Loading Modal**
```javascript
showLoading('Custom message...')
hideLoading()
```
- Blocks UI during processing
- Spinning animation
- Custom loading messages

### 3. **File Drop Zone**
```html
<div class="file-drop-zone">
    Drag & drop files here
</div>
```
- Visual feedback on hover
- File validation
- Size and type checking

### 4. **Chat Interface**
```html
<div class="chat-messages">
    <!-- User and AI messages -->
</div>
```
- Streaming message display
- Typing indicators
- Message formatting

## 🔒 Security Features

### Input Validation
- File type whitelist (TXT, PDF, DOCX, DOC)
- File size limit (10MB maximum)
- Text length validation
- XSS prevention

### API Security
- CORS handling
- Request validation
- Error boundary handling
- Secure file upload

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Touch-optimized interface
- Swipe gestures
- Mobile-friendly file upload
- Responsive typography

## 🐛 Troubleshooting

### Common Issues

#### 1. **Backend Connection Failed**
```
Error: "Không thể kết nối đến server!"
```
**Solution:**
- Ensure backend is running: `docker ps`
- Check health endpoint: `curl http://localhost:8080/riskassessment/public/api/v1/health-check/health`
- Restart backend: `docker-compose restart`

#### 2. **File Upload Not Working**
```
Error: "Loại file không được hỗ trợ!"
```
**Solution:**
- Check file extension (must be .txt, .pdf, .docx, .doc)
- Verify file size (max 10MB)
- Try different file

#### 3. **Chat Not Responding**
```
Error: Streaming response fails
```
**Solution:**
- Check browser console for errors
- Verify conversation ID format
- Restart both frontend and backend

#### 4. **UI Not Loading**
```
Error: Page doesn't load
```
**Solution:**
- Check if frontend server is running: `curl http://localhost:3001`
- Restart frontend: `./stop-dev.sh && ./start-dev.sh`
- Check browser console for JavaScript errors

### Debug Mode
```javascript
// Enable debug logging in browser console
localStorage.setItem('debug', 'true');
```

### Log Files
```bash
# Frontend server logs
cat frontend/frontend.log

# Backend container logs
docker logs riskassessment-app

# System logs
journalctl -f
```

## 🚀 Performance Optimization

### Loading Speed
- **CDN Resources**: Tailwind CSS, Font Awesome from CDN
- **Minimal JavaScript**: No heavy frameworks
- **Lazy Loading**: Images and components loaded on demand
- **Caching**: Browser caching for static assets

### API Efficiency
- **Request Debouncing**: Prevent spam requests
- **Streaming Responses**: Real-time chat updates
- **Error Handling**: Graceful degradation
- **Connection Pooling**: Efficient API calls

## 🎯 Advanced Usage

### Custom API Endpoints
```javascript
// Add new endpoint
API_ENDPOINTS.newFeature = '/api/v1/new-feature';

// Use in function
async function callNewFeature() {
    const response = await makeAPIRequest(API_ENDPOINTS.newFeature);
    return response;
}
```

### Theme Customization
```css
/* Add to index.html <style> section */
:root {
    --primary-color: #3B82F6;
    --secondary-color: #10B981;
    --accent-color: #8B5CF6;
}
```

### Adding New Tabs
```html
<!-- Add tab button -->
<button class="tab-button" data-tab="newtab">
    <i class="fas fa-star mr-2"></i>New Feature
</button>

<!-- Add tab content -->
<div id="newtab-tab" class="tab-content hidden">
    <!-- Your content here -->
</div>
```

## 📊 Analytics & Monitoring

### Usage Tracking
```javascript
// Track user interactions
function trackEvent(action, category) {
    console.log(`Event: ${category} - ${action}`);
    // Add analytics code here
}
```

### Performance Metrics
- **API Response Time**: Displayed in UI
- **File Processing Time**: Shown in results
- **User Engagement**: Tab switching, feature usage
- **Error Rates**: Failed requests tracking

## 🔄 Updates & Maintenance

### Regular Updates
1. **Dependencies**: Update CDN links for security
2. **API Compatibility**: Ensure frontend matches backend API
3. **Browser Support**: Test on latest browsers
4. **Mobile Testing**: Verify responsive design

### Backup Strategy
```bash
# Backup frontend code
tar -czf frontend-backup-$(date +%Y%m%d).tar.gz frontend/

# Backup configuration
cp .env .env.backup
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/new-ui-component`
3. **Make** changes to frontend code
4. **Test** thoroughly on multiple browsers
5. **Submit** pull request

### Code Standards
- **ES6+** JavaScript features
- **Semantic HTML** structure
- **Accessible** design (WCAG compliance)
- **Mobile-first** responsive design
- **Clean code** with comments

### Testing Checklist
- [ ] All tabs work correctly
- [ ] API calls succeed
- [ ] File upload functions
- [ ] Chat interface responsive
- [ ] Mobile compatibility
- [ ] Error handling works
- [ ] Loading states display
- [ ] Toast notifications appear

## 📞 Support

### Getting Help
1. **Check logs**: Frontend and backend logs
2. **Browser console**: JavaScript errors
3. **Network tab**: API request/response
4. **Health check**: System status

### Contact
- **Issues**: Create GitHub issue
- **Questions**: Check documentation
- **Bugs**: Provide reproduction steps

---

## 🎉 Success! Your UI is Ready

The frontend is now fully functional with:
- ✅ Modern, responsive design
- ✅ Real-time AI chat
- ✅ Document processing
- ✅ Text summarization
- ✅ Health monitoring
- ✅ Error handling
- ✅ Mobile support

**🌐 Access your application at: http://localhost:3001**

Happy coding! 🚀
