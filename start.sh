#!/bin/bash

# Multi-Agent Risk Assessment System Startup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if environment file exists
check_env() {
    if [ ! -f "app/riskassessment/.env" ]; then
        print_error "Environment file not found at app/riskassessment/.env"
        print_warning "Please copy .env-template to .env and configure your AWS credentials"
        exit 1
    fi
    print_success "Environment file found"
}

# Start backend
start_backend() {
    print_status "Starting backend services..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose up -d --build
    
    print_status "Waiting for backend to be healthy..."
    timeout=120
    counter=0
    while [ $counter -lt $timeout ]; do
        if curl -f http://localhost:8080/riskassessment/public/api/v1/health-check/health > /dev/null 2>&1; then
            print_success "Backend is healthy and ready!"
            return 0
        fi
        sleep 2
        counter=$((counter + 2))
        echo -n "."
    done
    
    print_error "Backend failed to start within $timeout seconds"
    docker-compose logs
    exit 1
}

# Start frontend
start_frontend() {
    print_status "Starting frontend..."
    cd fontend
    
    # Check if node_modules exists, if not install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend in background
    print_status "Starting React development server..."
    nohup npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    # Wait a bit for frontend to start
    sleep 5
    
    # Check if frontend is running
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        print_success "Frontend started successfully (PID: $FRONTEND_PID)"
        print_status "Frontend logs are being written to fontend/frontend.log"
    else
        print_error "Frontend failed to start"
        cat frontend.log
        exit 1
    fi
    
    cd ..
}

# Main execution
main() {
    print_status "🚀 Starting Multi-Agent Risk Assessment System"
    
    # Check prerequisites
    check_docker
    check_env
    
    # Start backend
    start_backend
    
    # Start frontend if requested
    if [[ "$1" == "--with-frontend" ]]; then
        start_frontend
        
        print_success "🎉 System started successfully!"
        echo ""
        echo "📍 Access Points:"
        echo "   • Backend API: http://localhost:8080"
        echo "   • API Documentation: http://localhost:8080/docs"
        echo "   • Frontend UI: http://localhost:3000"
        echo ""
        echo "📋 Management Commands:"
        echo "   • View backend logs: docker logs riskassessment-app -f"
        echo "   • View frontend logs: tail -f fontend/frontend.log"
        echo "   • Stop system: ./stop.sh"
        
    else
        print_success "🎉 Backend started successfully!"
        echo ""
        echo "📍 Access Points:"
        echo "   • Backend API: http://localhost:8080"
        echo "   • API Documentation: http://localhost:8080/docs"
        echo ""
        echo "📋 Management Commands:"
        echo "   • View logs: docker logs riskassessment-app -f"
        echo "   • Stop backend: ./stop.sh"
        echo "   • Start with frontend: ./start.sh --with-frontend"
    fi
}

# Run main function with all arguments
main "$@"
