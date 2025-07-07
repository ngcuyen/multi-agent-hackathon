#!/bin/bash

# Multi-Agent Hackathon - Complete System Startup Script
# Starts backend API and both frontend interfaces

echo "🚀 Starting Complete Multi-Agent AI Risk Assessment System"
echo "============================================================="

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

echo -e "${PURPLE}🎨 Starting Original Frontend (Tailwind CSS)...${NC}"
# Check if original frontend is already running
if check_port 3001; then
    echo -e "${GREEN}✅ Original Frontend already running on port 3001${NC}"
else
    cd frontend
    nohup python3 -m http.server 3001 > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID" > frontend.pid
    cd ..
    
    wait_for_service "http://localhost:3001" "Original Frontend"
fi

echo -e "${CYAN}🏢 Starting CloudScape Frontend (AWS Design System)...${NC}"
# Check if CloudScape frontend is already running
if check_port 3002; then
    echo -e "${GREEN}✅ CloudScape Frontend already running on port 3002${NC}"
else
    cd cloudscape-frontend
    nohup python3 server.py > cloudscape.log 2>&1 &
    CLOUDSCAPE_PID=$!
    echo "CloudScape PID: $CLOUDSCAPE_PID" > cloudscape.pid
    cd ..
    
    wait_for_service "http://localhost:3002" "CloudScape Frontend"
fi

echo ""
echo -e "${GREEN}🎉 Complete AI Risk Assessment System is ready!${NC}"
echo "================================================================"
echo ""
echo -e "${BLUE}📊 Services Status:${NC}"
echo -e "  🔗 Backend API:           ${GREEN}http://localhost:8080${NC}"
echo -e "  🎨 Original Frontend:     ${GREEN}http://localhost:3001${NC}"
echo -e "  🏢 CloudScape Frontend:   ${GREEN}http://localhost:3002${NC}"
echo -e "  📚 API Documentation:     ${GREEN}http://localhost:8080/docs${NC}"
echo ""
echo -e "${BLUE}🎯 Frontend Comparison:${NC}"
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│                    Frontend Options                         │"
echo "├─────────────────────────────────────────────────────────────┤"
echo -e "│ ${PURPLE}Original (Port 3001)${NC}     │ ${CYAN}CloudScape (Port 3002)${NC}      │"
echo "│ • Tailwind CSS           │ • AWS Design System        │"
echo "│ • Modern Web Design      │ • Professional Enterprise  │"
echo "│ • Custom Styling         │ • AWS Native Components    │"
echo "│ • Fast & Lightweight     │ • WCAG 2.1 AA Accessible   │"
echo "│ • Mobile Responsive      │ • Enterprise Grade UX      │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
echo -e "${BLUE}🔧 Available Features (Both Frontends):${NC}"
echo "  📝 Text Summarization with multiple types"
echo "  💬 AI Chat Interface with Claude 3.7 Sonnet"
echo "  📁 Document Upload & Processing (TXT, PDF, DOCX, DOC)"
echo "  🏥 Health Monitoring & System Status"
echo "  📊 Real-time Statistics & Analytics"
echo ""
echo -e "${BLUE}🌐 Quick Access Links:${NC}"
echo -e "  • ${PURPLE}Original UI:${NC}      ${YELLOW}http://localhost:3001${NC}"
echo -e "  • ${CYAN}CloudScape UI:${NC}    ${YELLOW}http://localhost:3002${NC}"
echo -e "  • ${BLUE}Health Check:${NC}     ${YELLOW}http://localhost:8080/riskassessment/public/api/v1/health-check/health${NC}"
echo -e "  • ${BLUE}API Docs:${NC}         ${YELLOW}http://localhost:8080/docs${NC}"
echo ""
echo -e "${YELLOW}💡 Recommendations:${NC}"
echo -e "  • ${PURPLE}Use Original Frontend${NC} for: Modern web design, custom styling"
echo -e "  • ${CYAN}Use CloudScape Frontend${NC} for: Enterprise apps, AWS consistency"
echo -e "  • Both frontends connect to the same backend API"
echo -e "  • Choose based on your design requirements"
echo ""
echo -e "${YELLOW}🛠️ Management Commands:${NC}"
echo "  • Stop all services: ./stop-all.sh"
echo "  • View backend logs: docker logs riskassessment-app"
echo "  • View frontend logs: cat frontend/frontend.log"
echo "  • View CloudScape logs: cat cloudscape-frontend/cloudscape.log"
echo ""
echo -e "${GREEN}🚀 System ready! Choose your preferred frontend and start using the AI Risk Assessment system!${NC}"

# Keep script running and handle Ctrl+C
trap 'echo -e "\n${YELLOW}🛑 Shutting down all services...${NC}"; ./stop-all.sh; exit 0' INT

# Wait indefinitely
while true; do
    sleep 1
done
