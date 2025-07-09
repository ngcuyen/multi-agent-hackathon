#!/bin/bash

# VPBank K-MULT Agent Studio Management Script
# Usage: ./manage.sh [command]

PROJECT_NAME="VPBank K-MULT Agent Studio"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $PROJECT_NAME${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to start services
start() {
    print_header
    print_status "Starting $PROJECT_NAME in background mode..."
    check_docker
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_status "Services started successfully!"
        print_status "Backend API: http://localhost:8080"
        print_status "Frontend Web: http://localhost:3000"
        print_status "API Docs: http://localhost:8080/docs"
        echo ""
        status
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Function to stop services
stop() {
    print_header
    print_status "Stopping $PROJECT_NAME..."
    check_docker
    
    docker-compose down
    
    if [ $? -eq 0 ]; then
        print_status "Services stopped successfully!"
    else
        print_error "Failed to stop services"
        exit 1
    fi
}

# Function to restart services
restart() {
    print_header
    print_status "Restarting $PROJECT_NAME..."
    stop
    sleep 2
    start
}

# Function to show status
status() {
    print_header
    print_status "Service Status:"
    echo ""
    docker-compose ps
    echo ""
    
    # Check health endpoints
    print_status "Health Check:"
    
    # Backend health
    if curl -s -f http://localhost:8080/mutil_agent/public/api/v1/health-check/health > /dev/null 2>&1; then
        echo -e "  Backend API: ${GREEN}✅ Healthy${NC}"
    else
        echo -e "  Backend API: ${RED}❌ Unhealthy${NC}"
    fi
    
    # Frontend health
    if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "  Frontend Web: ${GREEN}✅ Healthy${NC}"
    else
        echo -e "  Frontend Web: ${RED}❌ Unhealthy${NC}"
    fi
    echo ""
}

# Function to show logs
logs() {
    print_header
    if [ -z "$2" ]; then
        print_status "Showing logs for all services (last 50 lines)..."
        docker-compose logs --tail=50 -f
    else
        print_status "Showing logs for $2..."
        docker-compose logs --tail=50 -f "$2"
    fi
}

# Function to rebuild services
rebuild() {
    print_header
    print_status "Rebuilding $PROJECT_NAME..."
    check_docker
    
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_status "Services rebuilt and started successfully!"
        status
    else
        print_error "Failed to rebuild services"
        exit 1
    fi
}

# Function to show help
help() {
    print_header
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start services in background"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  status    - Show service status and health"
    echo "  logs      - Show logs (all services)"
    echo "  logs [service] - Show logs for specific service (mutil-agent or frontend)"
    echo "  rebuild   - Rebuild and restart services"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs mutil-agent"
    echo "  $0 status"
    echo ""
}

# Main script logic
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$@"
        ;;
    rebuild)
        rebuild
        ;;
    help|--help|-h)
        help
        ;;
    "")
        print_warning "No command specified. Use 'help' to see available commands."
        help
        ;;
    *)
        print_error "Unknown command: $1"
        help
        exit 1
        ;;
esac
