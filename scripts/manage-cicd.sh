#!/bin/bash

# VPBank K-MULT CI/CD Management Script
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_help() {
    echo -e "${BLUE}🚀 VPBank K-MULT CI/CD Management${NC}"
    echo "=================================================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status          Check CI/CD pipeline status"
    echo "  build-local     Build and push Docker image locally"
    echo "  build-s3        Deploy using S3 source (no GitHub token)"
    echo "  sync-build      Sync local changes to S3 and build"
    echo "  build-github    Start GitHub-integrated CodeBuild"
    echo "  setup-github    Setup GitHub credentials for CodeBuild"
    echo "  deploy-stack    Deploy CloudFormation CI/CD stack"
    echo "  cleanup         Clean up CI/CD resources"
    echo "  logs            View recent build logs"
    echo "  help            Show this help message"
    echo ""
    echo -e "${GREEN}🔒 No GitHub Token Required:${NC}"
    echo "  $0 build-s3             # S3 source build"
    echo "  $0 sync-build           # Local sync + build"
    echo "  $0 build-local          # Local Docker build"
    echo ""
    echo -e "${BLUE}🔗 GitHub Integration:${NC}"
    echo "  $0 setup-github         # Setup GitHub credentials"
    echo "  $0 build-github         # GitHub-integrated build"
    echo ""
    echo -e "${YELLOW}📋 GitHub Actions Available:${NC}"
    echo "  • Push to main/develop triggers automatic builds"
    echo "  • Pull requests trigger validation builds"
    echo "  • Hybrid GitHub Actions + CodeBuild workflow"
    echo ""
}

check_status() {
    echo -e "${BLUE}📊 Checking CI/CD Pipeline Status...${NC}"
    $SCRIPT_DIR/check-pipeline-status.sh
}

build_local() {
    echo -e "${BLUE}🔨 Starting Local Build...${NC}"
    $SCRIPT_DIR/deploy-local-build.sh
}

build_codebuild() {
    echo -e "${BLUE}☁️  Starting CodeBuild...${NC}"
    
    # Check if project exists
    PROJECT_EXISTS=$(aws codebuild batch-get-projects --names VPBankKMult-Build --query 'projects[0].name' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$PROJECT_EXISTS" = "NOT_FOUND" ]; then
        echo -e "${RED}❌ CodeBuild project not found${NC}"
        echo -e "${YELLOW}💡 Run '$0 deploy-stack' to create the project first${NC}"
        exit 1
    fi
    
    $SCRIPT_DIR/deploy-with-codebuild.sh
}

setup_github() {
    echo -e "${BLUE}🔐 Setting up GitHub credentials...${NC}"
    $SCRIPT_DIR/setup-github-credentials.sh
}

build_s3() {
    echo -e "${BLUE}📦 Starting S3 Source Build...${NC}"
    $SCRIPT_DIR/deploy-s3-source.sh
}

sync_build() {
    echo -e "${BLUE}🔄 Starting Sync and Build...${NC}"
    $SCRIPT_DIR/sync-and-build.sh
}

deploy_stack() {
    echo -e "${BLUE}☁️  Deploying CloudFormation CI/CD stack...${NC}"
    
    STACK_NAME="vpbank-kmult-cicd"
    TEMPLATE_FILE="/home/ubuntu/multi-agent-hackathon/cloudformation/cicd-pipeline.yml"
    
    if [ ! -f "$TEMPLATE_FILE" ]; then
        echo -e "${RED}❌ CloudFormation template not found: $TEMPLATE_FILE${NC}"
        exit 1
    fi
    
    # Check if stack exists
    STACK_EXISTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackName' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$STACK_EXISTS" = "NOT_FOUND" ]; then
        echo -e "${BLUE}📝 Creating new stack: $STACK_NAME${NC}"
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://$TEMPLATE_FILE \
            --capabilities CAPABILITY_IAM \
            --region us-east-1
    else
        echo -e "${BLUE}🔄 Updating existing stack: $STACK_NAME${NC}"
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://$TEMPLATE_FILE \
            --capabilities CAPABILITY_IAM \
            --region us-east-1 || echo -e "${YELLOW}⚠️  No updates needed${NC}"
    fi
    
    echo -e "${BLUE}⏳ Waiting for stack operation to complete...${NC}"
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region us-east-1 2>/dev/null || \
    aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region us-east-1 2>/dev/null || true
    
    echo -e "${GREEN}✅ Stack operation completed${NC}"
}

cleanup() {
    echo -e "${YELLOW}⚠️  This will delete CI/CD resources. Are you sure? (y/N)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🧹 Cleaning up CI/CD resources...${NC}"
        
        # Delete CloudFormation stack
        aws cloudformation delete-stack --stack-name vpbank-kmult-cicd --region us-east-1 2>/dev/null || true
        
        # Delete CodeBuild projects
        aws codebuild delete-project --name VPBankKMult-Build --region us-east-1 2>/dev/null || true
        aws codebuild delete-project --name VPBankKMult-S3-Build --region us-east-1 2>/dev/null || true
        
        echo -e "${GREEN}✅ Cleanup completed${NC}"
    else
        echo -e "${BLUE}ℹ️  Cleanup cancelled${NC}"
    fi
}

view_logs() {
    echo -e "${BLUE}📋 Viewing recent build logs...${NC}"
    
    # Get recent builds
    BUILD_IDS=$(aws codebuild list-builds-for-project --project-name VPBankKMult-Build --query 'ids[0:3]' --output text --region us-east-1 2>/dev/null || echo "")
    
    if [ -z "$BUILD_IDS" ]; then
        echo -e "${YELLOW}⚠️  No builds found${NC}"
        return
    fi
    
    echo -e "${BLUE}Recent builds:${NC}"
    for BUILD_ID in $BUILD_IDS; do
        echo "• $BUILD_ID"
        
        # Get build status
        BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region us-east-1 2>/dev/null || echo "UNKNOWN")
        echo "  Status: $BUILD_STATUS"
        
        # Get log group
        LOG_GROUP=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].logs.groupName' --output text --region us-east-1 2>/dev/null || echo "")
        if [ "$LOG_GROUP" != "" ] && [ "$LOG_GROUP" != "None" ]; then
            echo "  Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$(echo $LOG_GROUP | sed 's/\//%2F/g')"
        fi
        echo ""
    done
}

# Main script logic
case "${1:-help}" in
    status)
        check_status
        ;;
    build-local)
        build_local
        ;;
    build-s3)
        build_s3
        ;;
    sync-build)
        sync_build
        ;;
    build-codebuild)
        build_codebuild
        ;;
    setup-github)
        setup_github
        ;;
    deploy-stack)
        deploy_stack
        ;;
    cleanup)
        cleanup
        ;;
    logs)
        view_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
