#!/bin/bash

# Multi-Agent Hackathon - React Frontend Stop Script
# Stops backend API and React frontend

echo "🛑 Stopping Multi-Agent AI Risk Assessment System"
echo "   React + AWS CloudScape Frontend"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Stopping Backend containers...${NC}"
cd "$(dirname "$0")"
docker-compose down

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend containers stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Backend containers may not have been running${NC}"
fi

echo -e "${CYAN}⚛️  Stopping React Frontend...${NC}"

# Kill React development server processes
pkill -f "react-scripts start" 2>/dev/null
pkill -f "npm start" 2>/dev/null

# Check if React PID file exists and kill that process
if [ -f "react-frontend/react.pid" ]; then
    REACT_PID=$(cat react-frontend/react.pid | grep "React PID:" | cut -d' ' -f3)
    if [ ! -z "$REACT_PID" ]; then
        kill $REACT_PID 2>/dev/null
        echo -e "${GREEN}✅ React Frontend stopped (PID: $REACT_PID)${NC}"
    fi
    rm -f react-frontend/react.pid
else
    echo -e "${GREEN}✅ React Frontend stopped${NC}"
fi

echo -e "${BLUE}🧹 Cleaning up log files...${NC}"
rm -f react-frontend/react.log

echo ""
echo -e "${GREEN}✅ Multi-Agent AI Risk Assessment System stopped successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Cleanup Summary:${NC}"
echo "  🔗 Backend containers: Stopped"
echo "  ⚛️  React Frontend: Stopped"
echo "  📝 Log files: Cleaned"
echo ""
echo -e "${YELLOW}💡 To start again:${NC}"
echo -e "  • Full system: ${GREEN}./start-react.sh${NC}"
echo -e "  • Backend only: ${GREEN}docker-compose up -d${NC}"
echo -e "  • React only: ${GREEN}cd react-frontend && npm start${NC}"
