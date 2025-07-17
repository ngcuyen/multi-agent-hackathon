#!/bin/bash

# Deploy using S3 source with inline buildspec
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 S3 Source with Inline Buildspec (No GitHub Token)${NC}"
echo "======================================================="

# Configuration
BUCKET_NAME="vpbank-kmult-inline-$(date +%s)"
PROJECT_NAME="VPBankKMult-Inline-Build"
AWS_REGION="us-east-1"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "• S3 Bucket: $BUCKET_NAME"
echo "• CodeBuild Project: $PROJECT_NAME"
echo "• Region: $AWS_REGION"
echo ""

# Step 1: Create S3 bucket
echo -e "${BLUE}🪣 Creating S3 bucket...${NC}"
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Step 2: Create and upload source
echo -e "${BLUE}📁 Creating source archive...${NC}"
cd /home/ubuntu/multi-agent-hackathon

tar -czf /tmp/source.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='venv' \
    --exclude='dist' \
    --exclude='build' \
    .

aws s3 cp /tmp/source.tar.gz s3://$BUCKET_NAME/source.tar.gz
echo -e "${GREEN}✅ Source uploaded to S3${NC}"

# Step 3: Create CodeBuild project with inline buildspec
echo -e "${BLUE}🔨 Creating CodeBuild project with inline buildspec...${NC}"

cat > /tmp/inline-buildspec-project.json << 'EOF'
{
    "name": "VPBankKMult-Inline-Build",
    "description": "VPBank K-MULT with inline buildspec (no GitHub token)",
    "source": {
        "type": "S3",
        "location": "BUCKET_PLACEHOLDER/source.tar.gz",
        "buildspec": "version: 0.2\n\nphases:\n  pre_build:\n    commands:\n      - echo Logging in to Amazon ECR...\n      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com\n      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME\n      - IMAGE_TAG=s3-build-$(date +%Y%m%d-%H%M%S)\n      - echo Build started on $(date)\n  \n  build:\n    commands:\n      - echo Building Docker image...\n      - ls -la\n      - cd backend\n      - docker build -f Dockerfile.prod -t $REPOSITORY_URI:$IMAGE_TAG .\n      - docker tag $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:latest\n  \n  post_build:\n    commands:\n      - echo Build completed on $(date)\n      - echo Pushing Docker images...\n      - docker push $REPOSITORY_URI:$IMAGE_TAG\n      - docker push $REPOSITORY_URI:latest\n      - echo Image pushed successfully\n      - printf '[{\"name\":\"web\",\"imageUri\":\"%s\"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json\n\nartifacts:\n  files:\n    - imagedefinitions.json"
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

# Replace bucket placeholder
sed -i "s/BUCKET_PLACEHOLDER/$BUCKET_NAME/g" /tmp/inline-buildspec-project.json

# Create project
aws codebuild create-project --cli-input-json file:///tmp/inline-buildspec-project.json --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CodeBuild project created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create CodeBuild project${NC}"
    exit 1
fi

# Step 4: Start build
echo -e "${BLUE}🚀 Starting build...${NC}"
BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --region $AWS_REGION --query 'build.id' --output text)

echo -e "${GREEN}✅ Build started: $BUILD_ID${NC}"

# Monitor build
echo -e "${BLUE}📊 Monitoring build...${NC}"
for i in {1..20}; do
    BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text --region $AWS_REGION)
    
    case $BUILD_STATUS in
        "IN_PROGRESS")
            echo -e "${BLUE}⏳ Build in progress... ($i/20)${NC}"
            ;;
        "SUCCEEDED")
            echo -e "${GREEN}✅ Build completed successfully!${NC}"
            break
            ;;
        "FAILED")
            echo -e "${RED}❌ Build failed!${NC}"
            break
            ;;
        *)
            echo -e "${YELLOW}⚠️  Build status: $BUILD_STATUS${NC}"
            break
            ;;
    esac
    
    sleep 30
done

# Cleanup
rm -f /tmp/source.tar.gz /tmp/inline-buildspec-project.json

echo ""
echo -e "${GREEN}🎉 S3 Inline Buildspec Setup Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "• S3 Bucket: $BUCKET_NAME"
echo "• CodeBuild Project: $PROJECT_NAME"
echo "• Build ID: $BUILD_ID"
echo "• Uses inline buildspec (no external file dependency)"
echo ""
echo "🔗 Links:"
echo "• CodeBuild: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME"
echo "• Build Details: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME/build/$BUILD_ID"
