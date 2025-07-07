#!/bin/bash

# Multi-Agent Hackathon - Complete System Stop Script
# Stops backend API and both frontend interfaces

echo "🛑 Stopping Complete Multi-Agent AI Risk Assessment System"
echo "==========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

echo -e "${PURPLE}🎨 Stopping Original Frontend...${NC}"
# Kill Original Frontend processes
pkill -f "python3 -m http.server 3001" 2>/dev/null

# Check if frontend PID file exists and kill that process
if [ -f "frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid | grep "Frontend PID:" | cut -d' ' -f3)
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Original Frontend stopped (PID: $FRONTEND_PID)${NC}"
    fi
    rm -f frontend/frontend.pid
else
    echo -e "${GREEN}✅ Original Frontend stopped${NC}"
fi

echo -e "${CYAN}🏢 Stopping CloudScape Frontend...${NC}"
# Kill CloudScape Frontend processes
pkill -f "python3 server.py" 2>/dev/null

# Check if CloudScape PID file exists and kill that process
if [ -f "cloudscape-frontend/cloudscape.pid" ]; then
    CLOUDSCAPE_PID=$(cat cloudscape-frontend/cloudscape.pid | grep "CloudScape PID:" | cut -d' ' -f3)
    if [ ! -z "$CLOUDSCAPE_PID" ]; then
        kill $CLOUDSCAPE_PID 2>/dev/null
        echo -e "${GREEN}✅ CloudScape Frontend stopped (PID: $CLOUDSCAPE_PID)${NC}"
    fi
    rm -f cloudscape-frontend/cloudscape.pid
else
    echo -e "${GREEN}✅ CloudScape Frontend stopped${NC}"
fi

echo -e "${BLUE}🧹 Cleaning up log files...${NC}"
rm -f frontend/frontend.log
rm -f frontend/server.log
rm -f cloudscape-frontend/cloudscape.log

echo ""
echo -e "${GREEN}✅ Complete AI Risk Assessment System stopped successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Cleanup Summary:${NC}"
echo "  🔗 Backend containers: Stopped"
echo "  🎨 Original Frontend: Stopped"
echo "  🏢 CloudScape Frontend: Stopped"
echo "  📝 Log files: Cleaned"
echo ""
echo -e "${YELLOW}💡 To start again:${NC}"
echo -e "  • Full system: ${GREEN}./start-all.sh${NC}"
echo -e "  • Backend only: ${GREEN}docker-compose up -d${NC}"
echo -e "  • Original Frontend: ${GREEN}cd frontend && python3 -m http.server 3001${NC}"
echo -e "  • CloudScape Frontend: ${GREEN}cd cloudscape-frontend && python3 server.py${NC}"
