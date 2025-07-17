#!/bin/bash

# Create CodeBuild project with S3 source
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 Creating S3-based CodeBuild project${NC}"

# Create S3 bucket for source code
BUCKET_NAME="vpbank-kmult-source-$(date +%s)"
echo -e "${BLUE}🪣 Creating S3 bucket: $BUCKET_NAME${NC}"

aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Create source archive
echo -e "${BLUE}📁 Creating source archive...${NC}"
cd /home/ubuntu/multi-agent-hackathon
tar -czf source.tar.gz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' .

# Upload to S3
echo -e "${BLUE}⬆️  Uploading source to S3...${NC}"
aws s3 cp source.tar.gz s3://$BUCKET_NAME/source.tar.gz

# Create new CodeBuild project with S3 source
echo -e "${BLUE}🔨 Creating CodeBuild project with S3 source...${NC}"

cat > /tmp/codebuild-s3-project.json << EOF
{
    "name": "VPBankKMult-S3-Build",
    "description": "Build project for VPBank K-MULT application using S3 source",
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

aws codebuild create-project --cli-input-json file:///tmp/codebuild-s3-project.json --region us-east-1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ S3-based CodeBuild project created successfully!${NC}"
    echo ""
    echo "📋 Project details:"
    echo "• Name: VPBankKMult-S3-Build"
    echo "• Source: S3 bucket ($BUCKET_NAME)"
    echo "• Build environment: Amazon Linux 2"
    echo ""
    echo -e "${BLUE}🚀 To deploy:${NC}"
    echo "  aws codebuild start-build --project-name VPBankKMult-S3-Build --region us-east-1"
else
    echo -e "${RED}❌ Failed to create CodeBuild project${NC}"
    exit 1
fi

# Cleanup
rm -f source.tar.gz /tmp/codebuild-s3-project.json
