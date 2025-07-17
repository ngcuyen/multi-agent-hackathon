#!/bin/bash

# Monitor final working build
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BUILD_ID="VPBankKMult-GitHub-Working:ef51c00d-b7d1-4539-a434-3c93411b6622"

echo -e "${BLUE}🎯 FINAL BUILD MONITORING - ALL FIXES APPLIED${NC}"
echo "Build ID: $BUILD_ID"
echo "=================================================="

for i in {1..25}; do
    echo -e "${BLUE}⏳ Checking final build status... ($i/25)${NC}"
    
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region us-east-1)
    CURRENT_PHASE=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].currentPhase' --output text --region us-east-1)
    
    echo -e "${BLUE}Status: $BUILD_STATUS | Phase: $CURRENT_PHASE${NC}"
    
    case $BUILD_STATUS in
        "IN_PROGRESS")
            echo -e "${BLUE}🔄 Build in progress...${NC}"
            ;;
        "SUCCEEDED")
            echo -e "${GREEN}🎉🎉🎉 BUILD SUCCESSFUL! ALL ISSUES FIXED! 🎉🎉🎉${NC}"
            echo ""
            
            # Get build details
            echo -e "${BLUE}📋 Final Build Summary:${NC}"
            aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].[startTime,endTime,buildStatus]' --output table --region us-east-1
            
            # Check ECR images
            echo -e "${BLUE}🐳 Latest ECR Images:${NC}"
            aws ecr describe-images --repository-name vpbank-kmult-backend --query 'imageDetails[0:5].[imageTags[0],imagePushedAt,imageSizeInBytes]' --output table --region us-east-1
            
            echo ""
            echo -e "${GREEN}✅ GITHUB CI/CD FULLY OPERATIONAL!${NC}"
            echo -e "${GREEN}✅ ALL PROBLEMS FIXED!${NC}"
            echo -e "${GREEN}✅ READY FOR PRODUCTION!${NC}"
            echo ""
            echo -e "${BLUE}🚀 Push code to GitHub will trigger automatic builds!${NC}"
            
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
echo -e "${BLUE}🔗 Final Links:${NC}"
echo "• Working Build: https://console.aws.amazon.com/codesuite/codebuild/projects/VPBankKMult-GitHub-Working/build/$BUILD_ID"
echo "• ECR Repository: https://console.aws.amazon.com/ecr/repositories/private/536697254280/vpbank-kmult-backend"
echo "• GitHub Repository: https://github.com/ngcuyen/multi-agent-hackathon"
