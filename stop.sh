#!/bin/bash

# Multi-Agent Hackathon - Simple Stop Script

echo "🛑 Stopping Multi-Agent Hackathon..."

# Stop backend
echo "📡 Stopping backend..."
docker-compose down

# Stop frontend if running
echo "🎨 Stopping frontend..."
pkill -f "react-scripts start" 2>/dev/null || true

echo "✅ All services stopped!"
