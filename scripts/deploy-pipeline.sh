#!/bin/bash

# VPBank K-MULT CI/CD Pipeline Deployment Script
# This script deploys the CI/CD pipeline infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="VPBankKMult-CICD-Pipeline"
TEMPLATE_FILE="infrastructure/ci-cd-pipeline.yml"
REGION="us-east-1"

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

# Function to check if AWS CLI is configured
check_aws_cli() {
    print_status "Checking AWS CLI configuration..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI is configured"
}

# Function to validate parameters
validate_parameters() {
    print_status "Validating parameters..."
    
    if [ -z "$GITHUB_TOKEN" ]; then
        print_error "GITHUB_TOKEN environment variable is required"
        echo "Please set it with: export GITHUB_TOKEN=your_github_token"
        exit 1
    fi
    
    if [ -z "$GITHUB_OWNER" ]; then
        export GITHUB_OWNER="ngcuyen"
        print_warning "Using default GitHub owner: $GITHUB_OWNER"
    fi
    
    if [ -z "$GITHUB_REPO" ]; then
        export GITHUB_REPO="multi-agent-hackathon"
        print_warning "Using default GitHub repo: $GITHUB_REPO"
    fi
    
    print_success "Parameters validated"
}

# Function to deploy CloudFormation stack
deploy_stack() {
    print_status "Deploying CI/CD pipeline stack..."
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
        print_status "Stack exists, updating..."
        OPERATION="update-stack"
    else
        print_status "Stack doesn't exist, creating..."
        OPERATION="create-stack"
    fi
    
    # Deploy stack
    aws cloudformation $OPERATION \
        --stack-name "$STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters \
            ParameterKey=GitHubOwner,ParameterValue="$GITHUB_OWNER" \
            ParameterKey=GitHubRepo,ParameterValue="$GITHUB_REPO" \
            ParameterKey=GitHubBranch,ParameterValue="main" \
            ParameterKey=GitHubToken,ParameterValue="$GITHUB_TOKEN" \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$REGION"
    
    print_status "Waiting for stack operation to complete..."
    
    if [ "$OPERATION" = "create-stack" ]; then
        aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$REGION"
    else
        aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$REGION"
    fi
    
    print_success "Stack operation completed successfully"
}

# Function to get stack outputs
get_stack_outputs() {
    print_status "Getting stack outputs..."
    
    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output table)
    
    echo "$OUTPUTS"
    
    # Get specific outputs
    PIPELINE_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`PipelineUrl`].OutputValue' \
        --output text)
    
    print_success "Pipeline URL: $PIPELINE_URL"
}

# Function to setup GitHub webhook (if needed)
setup_github_webhook() {
    print_status "GitHub webhook will be automatically configured by CloudFormation"
    print_success "Webhook setup completed"
}

# Main execution
main() {
    echo "=========================================="
    echo "VPBank K-MULT CI/CD Pipeline Deployment"
    echo "=========================================="
    
    check_aws_cli
    validate_parameters
    deploy_stack
    get_stack_outputs
    setup_github_webhook
    
    echo "=========================================="
    print_success "CI/CD Pipeline deployment completed!"
    echo "=========================================="
    
    echo ""
    echo "Next steps:"
    echo "1. Visit the pipeline URL to monitor deployments"
    echo "2. Push code to trigger the pipeline"
    echo "3. Configure additional environments if needed"
    echo ""
}

# Help function
show_help() {
    echo "VPBank K-MULT CI/CD Pipeline Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Environment Variables:"
    echo "  GITHUB_TOKEN    GitHub personal access token (required)"
    echo "  GITHUB_OWNER    GitHub repository owner (default: ngcuyen)"
    echo "  GITHUB_REPO     GitHub repository name (default: multi-agent-hackathon)"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Example:"
    echo "  export GITHUB_TOKEN=ghp_xxxxxxxxxxxx"
    echo "  $0"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
