#!/bin/bash

# Simple GitHub CodeBuild setup
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Simple GitHub CodeBuild Setup${NC}"
echo "=================================="

PROJECT_NAME="VPBankKMult-GitHub-Simple"
GITHUB_REPO="https://github.com/ngcuyen/multi-agent-hackathon.git"

# Create simple buildspec
BUILDSPEC='version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - IMAGE_TAG=github-$(date +%Y%m%d-%H%M%S)
  build:
    commands:
      - echo Build started on $(date)
      - echo Building the Docker image...
      - cd backend
      - docker build -f Dockerfile.prod -t $REPOSITORY_URI:$IMAGE_TAG .
      - docker tag $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:latest
  post_build:
    commands:
      - echo Build completed on $(date)
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - docker push $REPOSITORY_URI:latest'

echo -e "${BLUE}📋 Configuration:${NC}"
echo "• Project: $PROJECT_NAME"
echo "• Repository: $GITHUB_REPO"
echo ""

# Create project JSON
cat > /tmp/simple-github-project.json << EOF
{
    "name": "$PROJECT_NAME",
    "description": "Simple VPBank K-MULT GitHub build",
    "source": {
        "type": "GITHUB",
        "location": "$GITHUB_REPO",
        "gitCloneDepth": 1,
        "buildspec": "$BUILDSPEC",
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
    "timeoutInMinutes": 30
}
EOF

# Create project
echo -e "${BLUE}🔨 Creating simple GitHub project...${NC}"
aws codebuild create-project --cli-input-json file:///tmp/simple-github-project.json --region us-east-1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Project created successfully${NC}"
    
    # Start build
    echo -e "${BLUE}🚀 Starting build...${NC}"
    BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --region us-east-1 --query 'build.id' --output text)
    
    echo -e "${GREEN}✅ Build started: $BUILD_ID${NC}"
    echo -e "${BLUE}🔗 Monitor at: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME/build/$BUILD_ID${NC}"
    
    # Quick status check
    sleep 60
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region us-east-1)
    echo -e "${BLUE}Current Status: $BUILD_STATUS${NC}"
    
else
    echo -e "${RED}❌ Failed to create project${NC}"
fi

# Cleanup
rm -f /tmp/simple-github-project.json

echo ""
echo -e "${GREEN}🎉 Simple GitHub Setup Complete!${NC}"
echo "• Project: $PROJECT_NAME"
echo "• Repository: $GITHUB_REPO (PUBLIC)"
echo "• No GitHub token required!"
