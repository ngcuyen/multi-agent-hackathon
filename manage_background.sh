#!/bin/bash

# VPBank K-MULT Agent Studio - Background Management Script
# Multi-Agent Hackathon 2025 - Group 181

PROJECT_DIR="/home/ubuntu/multi-agent-hackathon"
cd $PROJECT_DIR

case "$1" in
    start)
        echo "🚀 Starting VPBank K-MULT Agent Studio in background..."
        docker-compose up -d
        sleep 5
        echo "✅ Services started!"
        ./monitor_services.sh
        ;;
    stop)
        echo "🛑 Stopping VPBank K-MULT Agent Studio..."
        docker-compose down
        echo "✅ Services stopped!"
        ;;
    restart)
        echo "🔄 Restarting VPBank K-MULT Agent Studio..."
        docker-compose restart
        sleep 5
        echo "✅ Services restarted!"
        ./monitor_services.sh
        ;;
    status)
        ./monitor_services.sh
        ;;
    logs)
        if [ -z "$2" ]; then
            echo "📋 Showing all service logs (Ctrl+C to exit):"
            docker-compose logs -f
        else
            echo "📋 Showing logs for $2 (Ctrl+C to exit):"
            docker-compose logs -f $2
        fi
        ;;
    update)
        echo "🔄 Updating and rebuilding services..."
        git pull origin fix-api-mapping
        docker-compose build
        docker-compose up -d
        sleep 5
        echo "✅ Services updated and restarted!"
        ./monitor_services.sh
        ;;
    health)
        echo "🏥 Health Check:"
        echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
        echo "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)"
        echo "API Health: $(curl -s http://localhost:8080/mutil_agent/public/api/v1/health-check/health | jq -r '.status // "ERROR"')"
        echo "Agents: $(curl -s http://localhost:8080/mutil_agent/api/v1/agents/status | jq -r '.active_agents // "ERROR"')/$(curl -s http://localhost:8080/mutil_agent/api/v1/agents/status | jq -r '.total_agents // "ERROR"')"
        ;;
    *)
        echo "🏦 VPBank K-MULT Agent Studio - Background Management"
        echo "Multi-Agent Hackathon 2025 - Group 181"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|update|health}"
        echo ""
        echo "Commands:"
        echo "  start   - Start services in background"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show detailed service status"
        echo "  logs    - Show service logs (logs [service_name])"
        echo "  update  - Pull latest code and rebuild"
        echo "  health  - Quick health check"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs backend"
        echo "  $0 status"
        exit 1
        ;;
esac
