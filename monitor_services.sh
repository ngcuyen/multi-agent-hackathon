#!/bin/bash

# VPBank K-MULT Agent Studio - Background Service Monitor
# Multi-Agent Hackathon 2025 - Group 181

echo "🏦 VPBank K-MULT Agent Studio - Service Monitor"
echo "================================================"
echo "Date: $(date)"
echo ""

# Check Docker containers
echo "📦 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep vpbank
echo ""

# Check service health
echo "🔍 Service Health Check:"
echo "Frontend (Port 3000): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
echo "Backend (Port 8080): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)"
echo ""

# Check API endpoints
echo "🤖 Multi-Agent System Status:"
AGENT_STATUS=$(curl -s http://localhost:8080/mutil_agent/api/v1/agents/status 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "Total Agents: $(echo $AGENT_STATUS | jq -r '.total_agents // "N/A"')"
    echo "Active Agents: $(echo $AGENT_STATUS | jq -r '.active_agents // "N/A"')"
    echo "System Health: $(curl -s http://localhost:8080/mutil_agent/public/api/v1/health-check/health 2>/dev/null | jq -r '.status // "N/A"')"
else
    echo "❌ Backend API not responding"
fi
echo ""

# Resource usage
echo "💻 Resource Usage:"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo ""

echo "🌐 Access URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080"
echo "API Docs: http://localhost:8080/docs"
echo ""

echo "📋 Quick Commands:"
echo "View logs: docker-compose logs -f"
echo "Restart: docker-compose restart"
echo "Stop: docker-compose down"
echo "================================================"
