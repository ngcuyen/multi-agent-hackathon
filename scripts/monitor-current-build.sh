#!/bin/bash

# Monitor current GitHub build
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BUILD_ID="VPBankKMult-GitHub-Final:6cdb9d4b-bd87-4f57-913c-6c866fd457f7"

echo -e "${BLUE}📊 Monitoring GitHub Build After buildspec.yml Fix${NC}"
echo "Build ID: $BUILD_ID"
echo "=================================================="

for i in {1..25}; do
    echo -e "${BLUE}⏳ Checking build status... ($i/25)${NC}"
    
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region us-east-1)
    CURRENT_PHASE=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].currentPhase' --output text --region us-east-1)
    
    echo -e "${BLUE}Status: $BUILD_STATUS | Phase: $CURRENT_PHASE${NC}"
    
    case $BUILD_STATUS in
        "IN_PROGRESS")
            echo -e "${BLUE}🔄 Build in progress...${NC}"
            ;;
        "SUCCEEDED")
            echo -e "${GREEN}🎉 BUILD SUCCESSFUL! 🎉${NC}"
            echo ""
            
            # Get build details
            echo -e "${BLUE}📋 Build Summary:${NC}"
            aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].[startTime,endTime,buildStatus]' --output table --region us-east-1
            
            # Check ECR images
            echo -e "${BLUE}🐳 Latest ECR Images:${NC}"
            aws ecr describe-images --repository-name vpbank-kmult-backend --query 'imageDetails[0:3].[imageTags[0],imagePushedAt,imageSizeInBytes]' --output table --region us-east-1
            
            echo ""
            echo -e "${GREEN}✅ GitHub CI/CD is now fully operational!${NC}"
            echo -e "${BLUE}🚀 Push code to GitHub will trigger automatic builds!${NC}"
            
            break
            ;;
        "FAILED")
            echo -e "${RED}❌ Build failed!${NC}"
            
            # Get failure details
            echo -e "${BLUE}📋 Failure Details:${NC}"
            aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].phases[?phaseStatus==`FAILED`].[phaseType,contexts[0].message]' --output table --region us-east-1
            
            # Get logs link
            LOG_GROUP=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].logs.groupName' --output text --region us-east-1)
            if [ "$LOG_GROUP" != "None" ]; then
                echo -e "${BLUE}📋 Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$(echo $LOG_GROUP | sed 's/\//%2F/g')${NC}"
            fi
            
            break
            ;;
        *)
            echo -e "${YELLOW}⚠️  Build status: $BUILD_STATUS${NC}"
            ;;
    esac
    
    sleep 30
done

echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "• Build Console: https://console.aws.amazon.com/codesuite/codebuild/projects/VPBankKMult-GitHub-Final/build/$BUILD_ID"
echo "• ECR Repository: https://console.aws.amazon.com/ecr/repositories/private/536697254280/vpbank-kmult-backend"
echo "• GitHub Repository: https://github.com/ngcuyen/multi-agent-hackathon"
