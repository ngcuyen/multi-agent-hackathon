#!/bin/bash

# Deploy using S3 source (no GitHub token needed)
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 S3 Source CI/CD Deployment (No GitHub Token Required)${NC}"
echo "================================================================"

# Configuration
BUCKET_NAME="vpbank-kmult-source-$(date +%s)"
PROJECT_NAME="VPBankKMult-S3-Build"
AWS_REGION="us-east-1"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "• S3 Bucket: $BUCKET_NAME"
echo "• CodeBuild Project: $PROJECT_NAME"
echo "• Region: $AWS_REGION"
echo ""

# Step 1: Create S3 bucket for source
echo -e "${BLUE}🪣 Creating S3 bucket for source code...${NC}"
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ S3 bucket created: $BUCKET_NAME${NC}"
else
    echo -e "${RED}❌ Failed to create S3 bucket${NC}"
    exit 1
fi

# Step 2: Create source archive
echo -e "${BLUE}📁 Creating source archive...${NC}"
cd /home/ubuntu/multi-agent-hackathon

# Create clean archive excluding unnecessary files
tar -czf /tmp/source.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='venv' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='source.tar.gz' \
    .

echo -e "${GREEN}✅ Source archive created${NC}"

# Step 3: Upload to S3
echo -e "${BLUE}⬆️  Uploading source to S3...${NC}"
aws s3 cp /tmp/source.tar.gz s3://$BUCKET_NAME/source.tar.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Source uploaded to S3${NC}"
else
    echo -e "${RED}❌ Failed to upload source${NC}"
    exit 1
fi

# Step 4: Create CodeBuild project with S3 source
echo -e "${BLUE}🔨 Creating CodeBuild project with S3 source...${NC}"

cat > /tmp/s3-codebuild-project.json << EOF
{
    "name": "$PROJECT_NAME",
    "description": "VPBank K-MULT build using S3 source (no GitHub token required)",
    "source": {
        "type": "S3",
        "location": "$BUCKET_NAME/source.tar.gz"
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
                "name": "S3_BUCKET",
                "value": "$BUCKET_NAME",
                "type": "PLAINTEXT"
            }
        ]
    },
    "serviceRole": "arn:aws:iam::536697254280:role/VPBankKMult-CodeBuild-Role",
    "timeoutInMinutes": 30
}
EOF

# Check if project already exists
PROJECT_EXISTS=$(aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].name' --output text --region $AWS_REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$PROJECT_EXISTS" != "NOT_FOUND" ] && [ "$PROJECT_EXISTS" != "None" ]; then
    echo -e "${YELLOW}⚠️  Project exists, updating...${NC}"
    aws codebuild update-project --cli-input-json file:///tmp/s3-codebuild-project.json --region $AWS_REGION
else
    echo -e "${BLUE}🆕 Creating new project...${NC}"
    aws codebuild create-project --cli-input-json file:///tmp/s3-codebuild-project.json --region $AWS_REGION
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CodeBuild project configured successfully${NC}"
else
    echo -e "${RED}❌ Failed to configure CodeBuild project${NC}"
    exit 1
fi

# Step 5: Start build
echo -e "${BLUE}🚀 Starting build...${NC}"
BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --region $AWS_REGION --query 'build.id' --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build started successfully!${NC}"
    echo -e "${BLUE}Build ID: $BUILD_ID${NC}"
    
    # Monitor build
    echo -e "${BLUE}📊 Monitoring build progress...${NC}"
    while true; do
        BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region $AWS_REGION)
        
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
                # Get logs
                LOG_GROUP=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].logs.groupName' --output text --region $AWS_REGION)
                echo -e "${BLUE}📋 Check logs at: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/$(echo $LOG_GROUP | sed 's/\//%2F/g')${NC}"
                break
                ;;
            *)
                echo -e "${RED}❌ Build status: $BUILD_STATUS${NC}"
                break
                ;;
        esac
        
        sleep 30
    done
else
    echo -e "${RED}❌ Failed to start build${NC}"
    exit 1
fi

# Cleanup
rm -f /tmp/source.tar.gz /tmp/s3-codebuild-project.json

echo ""
echo -e "${GREEN}🎉 S3 Source CI/CD Setup Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "• S3 Bucket: $BUCKET_NAME"
echo "• CodeBuild Project: $PROJECT_NAME"
echo "• Build ID: $BUILD_ID"
echo "• No GitHub token required!"
echo ""
echo "🔗 Links:"
echo "• CodeBuild: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME"
echo "• S3 Bucket: https://console.aws.amazon.com/s3/buckets/$BUCKET_NAME"
echo ""
echo -e "${BLUE}🔄 To update and rebuild:${NC}"
echo "  ./scripts/deploy-s3-source.sh"
