#!/bin/bash

# Multi-Agent Hackathon - Development Stop Script
# This script stops both backend and frontend services

echo "🛑 Stopping Multi-Agent Hackathon Development Environment"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop backend containers
echo -e "${BLUE}🔧 Stopping Backend containers...${NC}"
cd "$(dirname "$0")"
docker-compose down

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend containers stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Backend containers may not have been running${NC}"
fi

# Stop frontend server
echo -e "${BLUE}🎨 Stopping Frontend server...${NC}"

# Kill Python HTTP server processes
pkill -f "python3 -m http.server 3001" 2>/dev/null
pkill -f "python3 server.py" 2>/dev/null

# Check if frontend PID file exists and kill that process
if [ -f "frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid | grep "Frontend PID:" | cut -d' ' -f3)
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend server stopped (PID: $FRONTEND_PID)${NC}"
    fi
    rm -f frontend/frontend.pid
else
    echo -e "${GREEN}✅ Frontend server stopped${NC}"
fi

# Clean up log files
echo -e "${BLUE}🧹 Cleaning up log files...${NC}"
rm -f frontend/frontend.log
rm -f frontend/server.log

echo ""
echo -e "${GREEN}✅ Development environment stopped successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Cleanup Summary:${NC}"
echo "  🔗 Backend containers: Stopped"
echo "  🎨 Frontend server: Stopped"
echo "  📝 Log files: Cleaned"
echo ""
echo -e "${YELLOW}💡 To start again, run: ./start-dev.sh${NC}"
