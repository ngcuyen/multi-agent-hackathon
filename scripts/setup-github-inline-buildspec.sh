#!/bin/bash

# Setup GitHub with inline buildspec
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔗 GitHub Integration with Inline Buildspec${NC}"
echo "=============================================="

PROJECT_NAME="VPBankKMult-GitHub-Inline"
GITHUB_REPO="https://github.com/ngcuyen/multi-agent-hackathon.git"
AWS_REGION="us-east-1"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "• Project: $PROJECT_NAME"
echo "• Repository: $GITHUB_REPO"
echo "• Buildspec: Inline (no external file needed)"
echo ""

# Create CodeBuild project with inline buildspec
echo -e "${BLUE}🔨 Creating GitHub project with inline buildspec...${NC}"

cat > /tmp/github-inline-project.json << 'EOF'
{
    "name": "VPBankKMult-GitHub-Inline",
    "description": "VPBank K-MULT GitHub with inline buildspec",
    "source": {
        "type": "GITHUB",
        "location": "https://github.com/ngcuyen/multi-agent-hackathon.git",
        "gitCloneDepth": 1,
        "reportBuildStatus": false,
        "insecureSsl": false,
        "buildspec": "version: 0.2\n\nphases:\n  pre_build:\n    commands:\n      - echo Logging in to Amazon ECR...\n      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com\n      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME\n      - IMAGE_TAG=github-$(date +%Y%m%d-%H%M%S)\n      - echo Build started on $(date)\n      - echo Repository URI: $REPOSITORY_URI\n      - echo Image Tag: $IMAGE_TAG\n  \n  build:\n    commands:\n      - echo Build phase started on $(date)\n      - echo Listing directory contents...\n      - ls -la\n      - echo Checking backend directory...\n      - ls -la backend/\n      - echo Building Docker image...\n      - cd backend\n      - docker build -f Dockerfile.prod -t $REPOSITORY_URI:$IMAGE_TAG .\n      - docker tag $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:latest\n      - echo Docker build completed\n  \n  post_build:\n    commands:\n      - echo Build completed on $(date)\n      - echo Pushing Docker images to ECR...\n      - docker push $REPOSITORY_URI:$IMAGE_TAG\n      - docker push $REPOSITORY_URI:latest\n      - echo Docker images pushed successfully\n      - echo Creating image definitions file...\n      - printf '[{\"name\":\"web\",\"imageUri\":\"%s\"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json\n      - cat imagedefinitions.json\n      - echo Build process completed successfully!\n\nartifacts:\n  files:\n    - imagedefinitions.json\n  name: VPBankKMultBuild"
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
    "timeoutInMinutes": 30
}
EOF

# Create or update project
PROJECT_EXISTS=$(aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].name' --output text --region $AWS_REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$PROJECT_EXISTS" != "NOT_FOUND" ] && [ "$PROJECT_EXISTS" != "None" ]; then
    echo -e "${YELLOW}⚠️  Updating existing project...${NC}"
    aws codebuild update-project --cli-input-json file:///tmp/github-inline-project.json --region $AWS_REGION
else
    echo -e "${BLUE}🆕 Creating new project...${NC}"
    aws codebuild create-project --cli-input-json file:///tmp/github-inline-project.json --region $AWS_REGION
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ GitHub inline buildspec project created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create project${NC}"
    exit 1
fi

# Start build
echo -e "${BLUE}🚀 Starting build...${NC}"
BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --region $AWS_REGION --query 'build.id' --output text)

echo -e "${GREEN}✅ Build started: $BUILD_ID${NC}"
BUILD_URL="https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME/build/$BUILD_ID"
echo -e "${BLUE}🔗 Build URL: $BUILD_URL${NC}"

# Monitor build
echo -e "${BLUE}📊 Monitoring build progress...${NC}"
for i in {1..20}; do
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region $AWS_REGION)
    CURRENT_PHASE=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].currentPhase' --output text --region $AWS_REGION)
    
    echo -e "${BLUE}[$i/20] Status: $BUILD_STATUS | Phase: $CURRENT_PHASE${NC}"
    
    case $BUILD_STATUS in
        "IN_PROGRESS")
            echo -e "${BLUE}⏳ Build in progress...${NC}"
            ;;
        "SUCCEEDED")
            echo -e "${GREEN}✅ Build completed successfully!${NC}"
            
            # Show build summary
            echo -e "${BLUE}📋 Build Summary:${NC}"
            aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].[startTime,endTime,buildStatus]' --output table --region $AWS_REGION
            
            # Check ECR images
            echo -e "${BLUE}🐳 Latest ECR Images:${NC}"
            aws ecr describe-images --repository-name vpbank-kmult-backend --query 'imageDetails[0:3].[imageTags[0],imagePushedAt,imageSizeInBytes]' --output table --region $AWS_REGION
            
            break
            ;;
        "FAILED")
            echo -e "${RED}❌ Build failed!${NC}"
            
            # Get failure details
            echo -e "${BLUE}📋 Failure Details:${NC}"
            aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].phases[?phaseStatus==`FAILED`].[phaseType,contexts[0].message]' --output table --region $AWS_REGION
            
            break
            ;;
        *)
            echo -e "${YELLOW}⚠️  Build status: $BUILD_STATUS${NC}"
            ;;
    esac
    
    sleep 30
done

# Cleanup
rm -f /tmp/github-inline-project.json

echo ""
echo -e "${GREEN}🎉 GitHub Inline Buildspec Setup Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "• Project: $PROJECT_NAME"
echo "• GitHub Repo: $GITHUB_REPO (PUBLIC)"
echo "• Build ID: $BUILD_ID"
echo "• Buildspec: Inline (no external file dependency)"
echo ""
echo "🔗 Links:"
echo "• CodeBuild Project: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME"
echo "• Build Details: $BUILD_URL"
echo "• ECR Repository: https://console.aws.amazon.com/ecr/repositories/private/536697254280/vpbank-kmult-backend"
echo ""
echo -e "${BLUE}🚀 This setup works with public GitHub repository!${NC}"
echo -e "${GREEN}✅ No GitHub token required!${NC}"
