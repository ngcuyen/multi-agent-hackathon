#!/bin/bash

# Setup GitHub integration for CodeBuild
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔗 Setting up GitHub Integration for CodeBuild${NC}"
echo "=================================================="

# Configuration
PROJECT_NAME="VPBankKMult-GitHub-Build"
GITHUB_REPO="https://github.com/ngcuyen/multi-agent-hackathon.git"
AWS_REGION="us-east-1"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "• Project Name: $PROJECT_NAME"
echo "• GitHub Repository: $GITHUB_REPO"
echo "• Region: $AWS_REGION"
echo ""

# Step 1: Check GitHub credentials
echo -e "${BLUE}🔍 Verifying GitHub credentials...${NC}"
CREDS_COUNT=$(aws codebuild list-source-credentials --region $AWS_REGION --query 'length(sourceCredentialsInfos[?serverType==`GITHUB`])' --output text)

if [ "$CREDS_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No GitHub credentials found${NC}"
    echo -e "${YELLOW}💡 Run: ./scripts/setup-github-credentials.sh${NC}"
    exit 1
else
    echo -e "${GREEN}✅ GitHub credentials verified${NC}"
fi

# Step 2: Create/Update CodeBuild project with GitHub source
echo -e "${BLUE}🔨 Creating GitHub-integrated CodeBuild project...${NC}"

cat > /tmp/github-codebuild-project.json << EOF
{
    "name": "$PROJECT_NAME",
    "description": "VPBank K-MULT build with GitHub integration",
    "source": {
        "type": "GITHUB",
        "location": "$GITHUB_REPO",
        "buildspec": "buildspec.yml",
        "reportBuildStatus": true,
        "insecureSsl": false,
        "gitCloneDepth": 1
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
                "value": "$AWS_REGION",
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
            },
            {
                "name": "GITHUB_REPO",
                "value": "$GITHUB_REPO",
                "type": "PLAINTEXT"
            }
        ]
    },
    "serviceRole": "arn:aws:iam::536697254280:role/VPBankKMult-CodeBuild-Role",
    "timeoutInMinutes": 30
}
EOF

# Check if project exists
PROJECT_EXISTS=$(aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].name' --output text --region $AWS_REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$PROJECT_EXISTS" != "NOT_FOUND" ] && [ "$PROJECT_EXISTS" != "None" ]; then
    echo -e "${YELLOW}⚠️  Project exists, updating...${NC}"
    aws codebuild update-project --cli-input-json file:///tmp/github-codebuild-project.json --region $AWS_REGION
else
    echo -e "${BLUE}🆕 Creating new project...${NC}"
    aws codebuild create-project --cli-input-json file:///tmp/github-codebuild-project.json --region $AWS_REGION
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ GitHub CodeBuild project configured successfully${NC}"
else
    echo -e "${RED}❌ Failed to configure CodeBuild project${NC}"
    exit 1
fi

# Step 3: Create webhook for automatic builds
echo -e "${BLUE}🔗 Setting up webhook for automatic builds...${NC}"

# Check if webhook exists
WEBHOOK_EXISTS=$(aws codebuild list-webhooks --region $AWS_REGION --query "webhooks[?projectName=='$PROJECT_NAME'].url" --output text 2>/dev/null || echo "")

if [ -z "$WEBHOOK_EXISTS" ] || [ "$WEBHOOK_EXISTS" = "None" ]; then
    echo -e "${BLUE}📡 Creating webhook...${NC}"
    
    aws codebuild create-webhook \
        --project-name $PROJECT_NAME \
        --region $AWS_REGION \
        --filter-groups '[
            [
                {
                    "type": "EVENT",
                    "pattern": "PUSH"
                },
                {
                    "type": "HEAD_REF",
                    "pattern": "^refs/heads/main$"
                }
            ],
            [
                {
                    "type": "EVENT",
                    "pattern": "PULL_REQUEST_CREATED"
                }
            ],
            [
                {
                    "type": "EVENT",
                    "pattern": "PULL_REQUEST_UPDATED"
                }
            ]
        ]'
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Webhook created successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Webhook creation may have failed (check permissions)${NC}"
    fi
else
    echo -e "${GREEN}✅ Webhook already exists${NC}"
fi

# Step 4: Test build
echo -e "${BLUE}🚀 Starting test build...${NC}"
BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --region $AWS_REGION --query 'build.id' --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build started successfully!${NC}"
    echo -e "${BLUE}Build ID: $BUILD_ID${NC}"
    
    # Get build URL
    BUILD_URL="https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME/build/$BUILD_ID"
    echo -e "${BLUE}🔗 Build URL: $BUILD_URL${NC}"
    
    # Monitor build briefly
    echo -e "${BLUE}📊 Monitoring build (30 seconds)...${NC}"
    sleep 30
    
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region $AWS_REGION)
    echo -e "${BLUE}Current Status: $BUILD_STATUS${NC}"
    
else
    echo -e "${RED}❌ Failed to start build${NC}"
fi

# Cleanup
rm -f /tmp/github-codebuild-project.json

echo ""
echo -e "${GREEN}🎉 GitHub Integration Setup Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "• Project: $PROJECT_NAME"
echo "• GitHub Repo: $GITHUB_REPO"
echo "• Webhook: Configured for push/PR events"
echo "• Build Status: $BUILD_STATUS"
echo ""
echo "🔗 Links:"
echo "• CodeBuild Project: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME"
echo "• Build Details: $BUILD_URL"
echo "• GitHub Repository: $GITHUB_REPO"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Push code to trigger automatic builds"
echo "2. Monitor builds: ./scripts/manage-cicd.sh logs"
echo "3. Check status: ./scripts/manage-cicd.sh status"
echo ""
echo -e "${GREEN}✅ Now when you push to GitHub, builds will trigger automatically!${NC}"
