#!/bin/bash

# Multi-Agent Hackathon - Simple Start Script

echo "🚀 Starting Multi-Agent Hackathon..."

# Start backend
echo "📡 Starting backend..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
sleep 10

# Check backend health
if curl -s http://localhost:8080/riskassessment/public/api/v1/health-check/health > /dev/null; then
    echo "✅ Backend is ready!"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend (optional)
if [ "$1" = "--with-frontend" ]; then
    echo "🎨 Starting frontend..."
    cd react-frontend
    npm start &
    echo "✅ Frontend starting on http://localhost:3000"
fi

echo ""
echo "🎉 Application is ready!"
echo "📊 Backend API: http://localhost:8080"
echo "📚 API Docs: http://localhost:8080/docs"
if [ "$1" = "--with-frontend" ]; then
    echo "🎨 Frontend: http://localhost:3000"
fi
