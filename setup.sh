#!/bin/bash

# VPBank K-MULT Agent Studio - Project Setup Script
# Multi-Agent Hackathon 2025 - Group 181

set -e

echo "🏦 VPBank K-MULT Agent Studio - Project Setup"
echo "=============================================="

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
    echo -e "${BLUE}$1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_header "🔍 Checking System Requirements..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_status "Docker found: $(docker --version)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_status "Docker Compose found: $(docker-compose --version)"

# Check Node.js (for frontend development)
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Frontend development may be limited."
else
    print_status "Node.js found: $(node --version)"
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    print_warning "Python3 not found. Backend development may be limited."
else
    print_status "Python3 found: $(python3 --version)"
fi

print_header "📁 Setting up Project Structure..."

# Create necessary directories
mkdir -p logs/{backend,frontend,deployment}
mkdir -p data/{samples,test-data,schemas}
mkdir -p testing/{unit,integration,e2e,performance}
mkdir -p tools/{scripts,monitoring,ci-cd}

print_status "Project directories created"

print_header "🔧 Setting up Environment Files..."

# Backend environment setup
if [ ! -f "backend/app/mutil_agent/.env" ]; then
    if [ -f "backend/app/mutil_agent/.env-template" ]; then
        cp backend/app/mutil_agent/.env-template backend/app/mutil_agent/.env
        print_status "Backend .env file created from template"
    else
        print_warning "Backend .env template not found"
    fi
else
    print_status "Backend .env file already exists"
fi

# Frontend environment setup
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        print_status "Frontend .env file created from example"
    else
        print_warning "Frontend .env example not found"
    fi
else
    print_status "Frontend .env file already exists"
fi

print_header "🐳 Setting up Docker Environment..."

# Create Docker network if it doesn't exist
if ! docker network ls | grep -q "vpbank-kmult-network"; then
    docker network create vpbank-kmult-network
    print_status "Docker network 'vpbank-kmult-network' created"
else
    print_status "Docker network 'vpbank-kmult-network' already exists"
fi

print_header "📦 Installing Dependencies..."

# Backend dependencies
if [ -f "backend/requirements.txt" ]; then
    print_status "Backend dependencies will be installed during Docker build"
else
    print_warning "Backend requirements.txt not found"
fi

# Frontend dependencies
if [ -f "frontend/package.json" ]; then
    if [ -d "frontend/node_modules" ]; then
        print_status "Frontend node_modules already exists"
    else
        print_status "Frontend dependencies will be installed during Docker build"
    fi
else
    print_warning "Frontend package.json not found"
fi

print_header "🔒 Setting up Security..."

# Set proper permissions
chmod +x scripts/*.sh 2>/dev/null || true
chmod 600 backend/app/mutil_agent/.env 2>/dev/null || true
chmod 600 frontend/.env 2>/dev/null || true

print_status "File permissions set"

print_header "📊 Project Setup Summary"
echo "================================"
print_status "✅ System requirements checked"
print_status "✅ Project structure created"
print_status "✅ Environment files configured"
print_status "✅ Docker environment prepared"
print_status "✅ Dependencies identified"
print_status "✅ Security permissions set"

echo ""
print_header "🚀 Next Steps:"
echo "1. Configure your .env files with actual values"
echo "2. Run './run.sh' to start the application"
echo "3. Access the application at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8080"
echo "   - API Docs: http://localhost:8080/docs"

echo ""
print_header "📋 Available Commands:"
echo "- ./setup.sh     - Run this setup script"
echo "- ./run.sh       - Start the application"
echo "- ./build.sh     - Build Docker images"
echo "- ./test.sh      - Run tests"
echo "- ./deploy.sh    - Deploy to AWS"

echo ""
print_status "🎯 VPBank K-MULT Agent Studio setup completed successfully!"
print_status "Multi-Agent Banking Platform ready for deployment"
