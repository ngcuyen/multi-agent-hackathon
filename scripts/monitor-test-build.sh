#!/bin/bash

# Monitor test build
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BUILD_ID="VPBankKMult-GitHub-Working:940b4438-bc54-41eb-bf08-8ae56c156298"

echo -e "${BLUE}🧪 TESTING CI/CD PIPELINE${NC}"
echo "Build ID: $BUILD_ID"
echo "=================================================="

for i in {1..20}; do
    echo -e "${BLUE}⏳ Checking test build status... ($i/20)${NC}"
    
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region us-east-1)
    CURRENT_PHASE=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].currentPhase' --output text --region us-east-1)
    
    echo -e "${BLUE}Status: $BUILD_STATUS | Phase: $CURRENT_PHASE${NC}"
    
    case $BUILD_STATUS in
        "IN_PROGRESS")
            echo -e "${BLUE}🔄 Build in progress...${NC}"
            ;;
        "SUCCEEDED")
            echo -e "${GREEN}🎉 CI/CD TEST SUCCESSFUL! 🎉${NC}"
            echo ""
            
            # Get build details
            echo -e "${BLUE}📋 Build Summary:${NC}"
            aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].[startTime,endTime,buildStatus]' --output table --region us-east-1
            
            # Check ECR images
            echo -e "${BLUE}🐳 Latest ECR Images:${NC}"
            aws ecr describe-images --repository-name vpbank-kmult-backend --query 'imageDetails[0:3].[imageTags[0],imagePushedAt,imageSizeInBytes]' --output table --region us-east-1
            
            echo ""
            echo -e "${GREEN}✅ CI/CD PIPELINE FULLY OPERATIONAL!${NC}"
            
            break
            ;;
        "FAILED")
            echo -e "${RED}❌ Build failed${NC}"
            
            # Get failure details
            echo -e "${BLUE}📋 Failure Details:${NC}"
            aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].phases[?phaseStatus==`FAILED`].[phaseType,contexts[0].message]' --output table --region us-east-1
            
            break
            ;;
        *)
            echo -e "${YELLOW}⚠️  Status: $BUILD_STATUS${NC}"
            ;;
    esac
    
    sleep 30
done

echo ""
echo -e "${BLUE}🔗 Test Build Links:${NC}"
echo "• Build Console: https://console.aws.amazon.com/codesuite/codebuild/projects/VPBankKMult-GitHub-Working/build/$BUILD_ID"
echo "• ECR Repository: https://console.aws.amazon.com/ecr/repositories/private/536697254280/vpbank-kmult-backend"
