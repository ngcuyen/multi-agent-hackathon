#!/bin/bash

# Multi-Agent Hackathon - Development Startup Script
# This script starts both backend and frontend services

echo "🚀 Starting Multi-Agent Hackathon Development Environment"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if backend is already running
if check_port 8080; then
    echo -e "${GREEN}✅ Backend already running on port 8080${NC}"
else
    echo -e "${BLUE}🔧 Starting Backend API...${NC}"
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

# Check if frontend is already running
if check_port 3001; then
    echo -e "${GREEN}✅ Frontend already running on port 3001${NC}"
else
    echo -e "${BLUE}🎨 Starting Frontend UI...${NC}"
    cd frontend
    nohup python3 -m http.server 3001 > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID" > frontend.pid
    
    wait_for_service "http://localhost:3001" "Frontend UI"
fi

echo ""
echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}📊 Services Status:${NC}"
echo -e "  🔗 Backend API:      ${GREEN}http://localhost:8080${NC}"
echo -e "  🎨 Frontend UI:      ${GREEN}http://localhost:3001${NC}"
echo -e "  📚 API Documentation: ${GREEN}http://localhost:8080/docs${NC}"
echo ""
echo -e "${BLUE}🔧 Available Features:${NC}"
echo "  📝 Text Summarization"
echo "  💬 AI Chat Interface"
echo "  📁 Document Upload & Processing"
echo "  🏥 Health Monitoring"
echo ""
echo -e "${BLUE}🌐 Quick Links:${NC}"
echo -e "  • Main UI:        ${YELLOW}http://localhost:3001${NC}"
echo -e "  • Health Check:   ${YELLOW}http://localhost:8080/riskassessment/public/api/v1/health-check/health${NC}"
echo -e "  • API Docs:       ${YELLOW}http://localhost:8080/docs${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  • Use Ctrl+C to stop this script"
echo "  • Backend logs: docker logs riskassessment-app"
echo "  • Frontend logs: cat frontend/frontend.log"
echo "  • To stop all: ./stop-dev.sh"
echo ""
echo -e "${GREEN}🚀 Ready for development! Open http://localhost:3001 in your browser${NC}"

# Keep script running and handle Ctrl+C
trap 'echo -e "\n${YELLOW}🛑 Shutting down development environment...${NC}"; exit 0' INT

# Wait indefinitely
while true; do
    sleep 1
done
