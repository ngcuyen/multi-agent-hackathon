#!/bin/bash

# VPBank K-MULT Agent Studio - Environment Setup Script

set -e

echo "🏦 VPBank K-MULT Agent Studio - Environment Setup"
echo "=================================================="

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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker found: $DOCKER_VERSION"
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker Compose found: $COMPOSE_VERSION"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_warning "Node.js not found. Installing Node.js 18..."
        # Install Node.js using NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Check Python
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
    else
        print_warning "Python3 not found. Installing Python3..."
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv
    fi
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version)
        print_success "Git found: $GIT_VERSION"
    else
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/app/riskassessment/.env" ]; then
        if [ -f "backend/app/riskassessment/.env-template" ]; then
            cp backend/app/riskassessment/.env-template backend/app/riskassessment/.env
            print_success "Backend .env file created from template"
            print_warning "Please edit backend/app/riskassessment/.env with your AWS credentials"
        else
            print_error "Backend .env template not found"
        fi
    else
        print_success "Backend .env file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:8080
REACT_APP_ENV=development
GENERATE_SOURCEMAP=false
EOF
        print_success "Frontend .env file created"
    else
        print_success "Frontend .env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Frontend dependencies
    if [ -d "frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    fi
    
    # Backend dependencies (if running locally)
    if [ -d "backend/app/riskassessment" ]; then
        print_status "Setting up Python virtual environment..."
        cd backend/app/riskassessment
        
        if [ ! -d "venv" ]; then
            python3 -m venv venv
            print_success "Python virtual environment created"
        fi
        
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        deactivate
        cd ../../..
        print_success "Backend dependencies installed"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create log directories
    mkdir -p logs/{backend,frontend,system}
    
    # Create data directories
    mkdir -p data/{samples,test-data,schemas}
    
    # Create test directories
    mkdir -p tests/{backend,frontend,integration,e2e}
    
    print_success "Directories created"
}

# Setup Docker networks
setup_docker() {
    print_status "Setting up Docker environment..."
    
    # Create Docker networks if they don't exist
    if ! docker network ls | grep -q "vpbank-kmult-network"; then
        docker network create vpbank-kmult-network
        print_success "Docker network created"
    else
        print_success "Docker network already exists"
    fi
    
    # Pull required images
    print_status "Pulling Docker images..."
    docker-compose -f docker-compose.dev.yml pull
    print_success "Docker images pulled"
}

# Verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check if we can build the project
    if make build > /dev/null 2>&1; then
        print_success "Build verification passed"
    else
        print_warning "Build verification failed - you may need to configure AWS credentials"
    fi
    
    # Check if health endpoint is accessible after starting services
    print_status "Starting services for verification..."
    make dev > /dev/null 2>&1 &
    
    # Wait for services to start
    sleep 30
    
    if curl -f http://localhost:8080/riskassessment/public/api/v1/health-check/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed - services may still be starting"
    fi
    
    # Stop services
    make dev-stop > /dev/null 2>&1
}

# Main setup function
main() {
    echo ""
    print_status "Starting VPBank K-MULT Agent Studio setup..."
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_environment
    echo ""
    
    create_directories
    echo ""
    
    install_dependencies
    echo ""
    
    setup_docker
    echo ""
    
    verify_installation
    echo ""
    
    print_success "Setup completed successfully!"
    echo ""
    echo "🎉 VPBank K-MULT Agent Studio is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Edit backend/app/riskassessment/.env with your AWS credentials"
    echo "2. Run 'make dev' to start the development environment"
    echo "3. Access the application at http://localhost:3000"
    echo ""
    echo "For more information, see docs/DEVELOPMENT.md"
}

# Run main function
main "$@"
