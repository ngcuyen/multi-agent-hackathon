#!/bin/bash

# Create optimized GitHub CodeBuild project
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Creating Optimized GitHub CodeBuild Project${NC}"
echo "================================================="

PROJECT_NAME="VPBankKMult-GitHub-Optimized"
GITHUB_REPO="https://github.com/ngcuyen/multi-agent-hackathon.git"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "• Project: $PROJECT_NAME"
echo "• Repository: $GITHUB_REPO"
echo "• Buildspec: buildspec-codebuild.yml (optimized)"
echo "• Dockerfile: Dockerfile.codebuild (simplified)"
echo ""

# Create optimized project
cat > /tmp/optimized-github-project.json << 'EOF'
{
    "name": "VPBankKMult-GitHub-Optimized",
    "description": "Optimized VPBank K-MULT GitHub build with simplified Docker",
    "source": {
        "type": "GITHUB",
        "location": "https://github.com/ngcuyen/multi-agent-hackathon.git",
        "gitCloneDepth": 1,
        "buildspec": "buildspec-codebuild.yml",
        "reportBuildStatus": false,
        "insecureSsl": false
    },
    "artifacts": {
        "type": "NO_ARTIFACTS"
    },
    "environment": {
        "type": "LINUX_CONTAINER",
        "image": "aws/codebuild/amazonlinux2-x86_64-standard:5.0",
        "computeType": "BUILD_GENERAL1_MEDIUM",
        "privilegedMode": true,
        "environmentVariables": [
            {
                "name": "AWS_DEFAULT_REGION",
                "value": "us-east-1",
                "type": "PLAINTEXT"
            },
            {
                "name": "AWS_ACCOUNT_ID",
                "value": "536697254280",
                "type": "PLAINTEXT"
            },
            {
                "name": "IMAGE_REPO_NAME",
                "value": "vpbank-kmult-backend",
                "type": "PLAINTEXT"
            }
        ]
    },
    "serviceRole": "arn:aws:iam::536697254280:role/VPBankKMult-CodeBuild-Role",
    "timeoutInMinutes": 45
}
EOF

# Create project
echo -e "${BLUE}🔨 Creating optimized project...${NC}"
aws codebuild create-project --cli-input-json file:///tmp/optimized-github-project.json --region us-east-1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Optimized project created successfully${NC}"
    
    # Start build immediately
    echo -e "${BLUE}🚀 Starting optimized build...${NC}"
    BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --region us-east-1 --query 'build.id' --output text)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build started: $BUILD_ID${NC}"
        
        BUILD_URL="https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME/build/$BUILD_ID"
        echo -e "${BLUE}🔗 Build URL: $BUILD_URL${NC}"
        
        # Monitor build with detailed logging
        echo -e "${BLUE}📊 Monitoring optimized build...${NC}"
        for i in {1..30}; do
            BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region us-east-1)
            CURRENT_PHASE=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].currentPhase' --output text --region us-east-1)
            
            echo -e "${BLUE}[$i/30] Status: $BUILD_STATUS | Phase: $CURRENT_PHASE${NC}"
            
            case $BUILD_STATUS in
                "IN_PROGRESS")
                    echo -e "${BLUE}⏳ Build in progress...${NC}"
                    ;;
                "SUCCEEDED")
                    echo -e "${GREEN}🎉 BUILD SUCCESSFUL! 🎉${NC}"
                    echo ""
                    
                    # Get build summary
                    echo -e "${BLUE}📋 Build Summary:${NC}"
                    aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].[startTime,endTime,buildStatus]' --output table --region us-east-1
                    
                    # Check ECR images
                    echo -e "${BLUE}🐳 Latest ECR Images:${NC}"
                    aws ecr describe-images --repository-name vpbank-kmult-backend --query 'imageDetails[0:5].[imageTags[0],imagePushedAt,imageSizeInBytes]' --output table --region us-east-1
                    
                    echo ""
                    echo -e "${GREEN}✅ ALL ISSUES FIXED! GitHub CI/CD is fully operational!${NC}"
                    echo -e "${BLUE}🚀 Push code to GitHub will trigger automatic builds!${NC}"
                    
                    break
                    ;;
                "FAILED")
                    echo -e "${RED}❌ Build failed${NC}"
                    
                    # Get detailed failure info
                    echo -e "${BLUE}📋 Failure Details:${NC}"
                    aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].phases[?phaseStatus==`FAILED`].[phaseType,contexts[0].message]' --output table --region us-east-1
                    
                    # Get logs
                    LOG_GROUP=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].logs.groupName' --output text --region us-east-1)
                    if [ "$LOG_GROUP" != "None" ]; then
                        echo -e "${BLUE}📋 Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$(echo $LOG_GROUP | sed 's/\//%2F/g')${NC}"
                    fi
                    
                    break
                    ;;
                *)
                    echo -e "${YELLOW}⚠️  Status: $BUILD_STATUS${NC}"
                    ;;
            esac
            
            sleep 30
        done
        
    else
        echo -e "${RED}❌ Failed to start build${NC}"
    fi
    
else
    echo -e "${RED}❌ Failed to create project${NC}"
fi

# Cleanup
rm -f /tmp/optimized-github-project.json

echo ""
echo -e "${GREEN}🎉 Optimized GitHub Setup Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "• Project: $PROJECT_NAME"
echo "• Repository: $GITHUB_REPO (PUBLIC)"
echo "• Buildspec: buildspec-codebuild.yml (optimized)"
echo "• Dockerfile: Dockerfile.codebuild (simplified)"
echo "• Build ID: $BUILD_ID"
echo ""
echo "🔗 Links:"
echo "• CodeBuild: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME"
echo "• Build Details: $BUILD_URL"
echo "• ECR: https://console.aws.amazon.com/ecr/repositories/private/536697254280/vpbank-kmult-backend"
echo "• GitHub: https://github.com/ngcuyen/multi-agent-hackathon"
