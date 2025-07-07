#!/bin/bash

# Multi-Agent Hackathon - React Frontend Startup Script
# Starts backend API and React + CloudScape frontend

echo "🚀 Starting Multi-Agent AI Risk Assessment System"
echo "   React + AWS CloudScape Frontend"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start within timeout${NC}"
    return 1
}

echo -e "${BLUE}🔧 Starting Backend API...${NC}"
# Check if backend is already running
if check_port 8080; then
    echo -e "${GREEN}✅ Backend already running on port 8080${NC}"
else
    cd "$(dirname "$0")"
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend container started${NC}"
        wait_for_service "http://localhost:8080/riskassessment/public/api/v1/health-check/health" "Backend API"
    else
        echo -e "${RED}❌ Failed to start backend container${NC}"
        exit 1
    fi
fi

echo -e "${CYAN}⚛️  Starting React + CloudScape Frontend...${NC}"
# Check if React frontend is already running
if check_port 3000; then
    echo -e "${GREEN}✅ React Frontend already running on port 3000${NC}"
else
    cd react-frontend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing React dependencies...${NC}"
        npm install
    fi
    
    # Start React development server in background
    echo -e "${CYAN}🎨 Starting React development server...${NC}"
    BROWSER=none PORT=3000 nohup npm start > react.log 2>&1 &
    REACT_PID=$!
    echo "React PID: $REACT_PID" > react.pid
    cd ..
    
    wait_for_service "http://localhost:3000" "React Frontend"
fi

echo ""
echo -e "${GREEN}🎉 Multi-Agent AI Risk Assessment System is ready!${NC}"
echo "================================================================"
echo ""
echo -e "${BLUE}📊 Services Status:${NC}"
echo -e "  🔗 Backend API:           ${GREEN}http://localhost:8080${NC}"
echo -e "  ⚛️  React Frontend:        ${GREEN}http://localhost:3000${NC}"
echo -e "  📚 API Documentation:     ${GREEN}http://localhost:8080/docs${NC}"
echo ""
echo -e "${CYAN}🎯 React + CloudScape Features:${NC}"
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│                 React + AWS CloudScape                     │"
echo "├─────────────────────────────────────────────────────────────┤"
echo "│ ⚛️  React 18 with Hooks                                    │"
echo "│ 🏢 AWS CloudScape Design System                           │"
echo "│ 🎨 Professional UI Components                             │"
echo "│ ♿ WCAG 2.1 AA Accessibility                              │"
echo "│ 📱 Responsive Design                                       │"
echo "│ 🚀 Modern Development Experience                           │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
echo -e "${BLUE}🔧 Available Features:${NC}"
echo "  📝 Text Summarization with multiple types"
echo "  💬 AI Chat Interface with Claude 3.7 Sonnet"
echo "  📁 Document Upload & Processing (TXT, PDF, DOCX, DOC)"
echo "  📊 System Status Dashboard"
echo "  🔔 Real-time Notifications"
echo "  🎨 Professional AWS-native UI"
echo ""
echo -e "${BLUE}🌐 Access Your Application:${NC}"
echo -e "  • ${CYAN}React Frontend:${NC}   ${YELLOW}http://localhost:3000${NC}"
echo -e "  • ${BLUE}Backend API:${NC}      ${YELLOW}http://localhost:8080${NC}"
echo -e "  • ${BLUE}Health Check:${NC}     ${YELLOW}http://localhost:8080/riskassessment/public/api/v1/health-check/health${NC}"
echo -e "  • ${BLUE}API Docs:${NC}         ${YELLOW}http://localhost:8080/docs${NC}"
echo ""
echo -e "${YELLOW}🛠️ Development Commands:${NC}"
echo "  • View React logs: tail -f react-frontend/react.log"
echo "  • View backend logs: docker logs riskassessment-app"
echo "  • Stop all services: ./stop-react.sh"
echo "  • React dev tools: Available in browser"
echo ""
echo -e "${GREEN}🚀 Open http://localhost:3000 in your browser to start using the system!${NC}"

# Keep script running and handle Ctrl+C
trap 'echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"; ./stop-react.sh; exit 0' INT

# Wait indefinitely
while true; do
    sleep 1
done
