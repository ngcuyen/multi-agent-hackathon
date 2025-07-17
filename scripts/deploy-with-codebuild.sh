#!/bin/bash

# Deploy VPBank K-MULT using CodeBuild
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_NAME="VPBankKMult-Build"

echo -e "${BLUE}🚀 Starting VPBank K-MULT Deployment via CodeBuild${NC}"

# Start build
echo -e "${BLUE}Starting CodeBuild...${NC}"
BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --query 'build.id' --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build started successfully!${NC}"
    echo -e "${BLUE}Build ID: $BUILD_ID${NC}"
    
    # Get build URL
    BUILD_URL="https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME/build/$BUILD_ID"
    echo -e "${BLUE}🔗 Build URL: $BUILD_URL${NC}"
    
    echo ""
    echo -e "${YELLOW}📊 Monitoring build progress...${NC}"
    
    # Monitor build status
    while true; do
        BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text)
        
        case $BUILD_STATUS in
            "IN_PROGRESS")
                echo -e "${BLUE}⏳ Build in progress...${NC}"
                ;;
            "SUCCEEDED")
                echo -e "${GREEN}✅ Build completed successfully!${NC}"
                break
                ;;
            "FAILED")
                echo -e "${RED}❌ Build failed!${NC}"
                echo -e "${YELLOW}📋 Getting build logs...${NC}"
                aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].logs.cloudWatchLogs.groupName' --output text
                exit 1
                ;;
            "FAULT"|"STOPPED"|"TIMED_OUT")
                echo -e "${RED}❌ Build encountered an error: $BUILD_STATUS${NC}"
                exit 1
                ;;
        esac
        
        sleep 30
    done
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "📋 Summary:"
    echo "• Build ID: $BUILD_ID"
    echo "• Status: SUCCESS"
    echo "• Docker image pushed to ECR"
    echo "• Ready for ECS deployment"
    echo ""
    echo "🔗 Links:"
    echo "• Build Details: $BUILD_URL"
    echo "• ECR Repository: https://console.aws.amazon.com/ecr/repositories/private/536697254280/vpbank-kmult-backend"
    echo "• ECS Service: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/vpbank-kmult-cluster/services/vpbank-kmult-backend"
    
else
    echo -e "${RED}❌ Failed to start build${NC}"
    exit 1
fi
