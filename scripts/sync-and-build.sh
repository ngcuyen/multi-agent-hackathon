#!/bin/bash

# Sync local changes to S3 and trigger build
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 Local Git + S3 Sync CI/CD Workflow${NC}"
echo "=============================================="

# Configuration
BUCKET_NAME="vpbank-kmult-source-sync"
PROJECT_NAME="VPBankKMult-Sync-Build"

# Step 1: Check for local changes
echo -e "${BLUE}📋 Checking local changes...${NC}"
cd /home/ubuntu/multi-agent-hackathon

if [ -d ".git" ]; then
    # Check git status
    if git diff --quiet && git diff --staged --quiet; then
        echo -e "${GREEN}✅ No uncommitted changes${NC}"
    else
        echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
        echo -e "${BLUE}📝 Current status:${NC}"
        git status --short
        echo ""
        read -p "Commit changes before sync? (y/N): " -r COMMIT_CHANGES
        
        if [[ "$COMMIT_CHANGES" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}💾 Committing changes...${NC}"
            git add .
            read -p "Enter commit message: " COMMIT_MSG
            git commit -m "${COMMIT_MSG:-Auto-commit before CI/CD sync}"
        fi
    fi
    
    # Show recent commits
    echo -e "${BLUE}📜 Recent commits:${NC}"
    git log --oneline -5
else
    echo -e "${YELLOW}⚠️  Not a git repository${NC}"
fi

# Step 2: Create S3 bucket if not exists
echo -e "${BLUE}🪣 Ensuring S3 bucket exists...${NC}"
if ! aws s3 ls s3://$BUCKET_NAME 2>/dev/null; then
    aws s3 mb s3://$BUCKET_NAME --region us-east-1
    echo -e "${GREEN}✅ S3 bucket created: $BUCKET_NAME${NC}"
else
    echo -e "${GREEN}✅ S3 bucket exists: $BUCKET_NAME${NC}"
fi

# Step 3: Sync to S3
echo -e "${BLUE}📤 Syncing code to S3...${NC}"

# Create temporary archive
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="source-$TIMESTAMP.tar.gz"

tar -czf $ARCHIVE_NAME \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='venv' \
    --exclude='dist' \
    --exclude='build' \
    .

# Upload to S3
aws s3 cp $ARCHIVE_NAME s3://$BUCKET_NAME/
aws s3 cp $ARCHIVE_NAME s3://$BUCKET_NAME/source-latest.tar.gz

echo -e "${GREEN}✅ Code synced to S3${NC}"

# Step 4: Update CodeBuild project source
echo -e "${BLUE}🔧 Updating CodeBuild project...${NC}"

cat > /tmp/update-source.json << EOF
{
    "name": "$PROJECT_NAME",
    "source": {
        "type": "S3",
        "location": "$BUCKET_NAME/source-latest.tar.gz"
    }
}
EOF

# Check if project exists
PROJECT_EXISTS=$(aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].name' --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$PROJECT_EXISTS" = "NOT_FOUND" ]; then
    echo -e "${BLUE}🆕 Creating CodeBuild project...${NC}"
    
    cat > /tmp/create-project.json << EOF
{
    "name": "$PROJECT_NAME",
    "description": "VPBank K-MULT sync build from S3",
    "source": {
        "type": "S3",
        "location": "$BUCKET_NAME/source-latest.tar.gz"
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
    
    aws codebuild create-project --cli-input-json file:///tmp/create-project.json --region us-east-1
else
    echo -e "${BLUE}🔄 Updating existing project...${NC}"
    aws codebuild update-project --cli-input-json file:///tmp/update-source.json --region us-east-1
fi

# Step 5: Trigger build
echo -e "${BLUE}🚀 Starting build...${NC}"
BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --region us-east-1 --query 'build.id' --output text)

echo -e "${GREEN}✅ Build started: $BUILD_ID${NC}"
echo -e "${BLUE}🔗 Monitor at: https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME/build/$BUILD_ID${NC}"

# Cleanup
rm -f $ARCHIVE_NAME /tmp/update-source.json /tmp/create-project.json

echo ""
echo -e "${GREEN}🎉 Sync and Build Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "• Archive: $ARCHIVE_NAME"
echo "• S3 Location: s3://$BUCKET_NAME/source-latest.tar.gz"
echo "• Build ID: $BUILD_ID"
echo ""
echo -e "${BLUE}🔄 To sync again:${NC}"
echo "  ./scripts/sync-and-build.sh"
