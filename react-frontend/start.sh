#!/bin/bash

# React + CloudScape Frontend Startup Script

echo "🚀 Starting React + AWS CloudScape Frontend"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Checking dependencies...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not found. Installing...${NC}"
    npm install
fi

echo -e "${BLUE}🎨 Starting React development server...${NC}"
echo -e "${GREEN}✨ Features:${NC}"
echo "   • React 18 with Hooks"
echo "   • AWS CloudScape Design System"
echo "   • Professional UI Components"
echo "   • Real-time AI Chat"
echo "   • Document Processing"
echo "   • System Monitoring"
echo ""
echo -e "${BLUE}🌐 Server will start on:${NC}"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend:  http://localhost:8080"
echo ""
echo -e "${YELLOW}💡 Note: Make sure backend is running on port 8080${NC}"
echo ""

# Set environment variables
export BROWSER=none
export PORT=3000

# Start React development server
npm start
