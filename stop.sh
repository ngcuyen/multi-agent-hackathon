#!/bin/bash

# Multi-Agent Risk Assessment System Stop Script

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

# Stop backend
stop_backend() {
    print_status "Stopping backend services..."
    docker-compose down --remove-orphans
    print_success "Backend stopped"
}

# Stop frontend
stop_frontend() {
    print_status "Stopping frontend..."
    
    if [ -f "fontend/frontend.pid" ]; then
        FRONTEND_PID=$(cat fontend/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_success "Frontend stopped (PID: $FRONTEND_PID)"
        else
            print_warning "Frontend process not running"
        fi
        rm -f fontend/frontend.pid
    else
        print_warning "Frontend PID file not found"
    fi
    
    # Also try to kill any npm/node processes on port 3000
    if lsof -ti:3000 >/dev/null 2>&1; then
        print_status "Killing processes on port 3000..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
}

# Main execution
main() {
    print_status "🛑 Stopping Multi-Agent Risk Assessment System"
    
    # Stop frontend
    stop_frontend
    
    # Stop backend
    stop_backend
    
    print_success "🎉 System stopped successfully!"
}

# Run main function
main
