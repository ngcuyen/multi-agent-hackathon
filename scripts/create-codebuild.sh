#!/bin/bash

# Create CodeBuild project for VPBank K-MULT
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Creating VPBank K-MULT CodeBuild Project...${NC}"

# Variables
PROJECT_NAME="VPBankKMult-Build"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="vpbank-kmult-backend"

# Create IAM role for CodeBuild
echo -e "${BLUE}Creating IAM role for CodeBuild...${NC}"

# Trust policy for CodeBuild
cat > /tmp/codebuild-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name VPBankKMult-CodeBuild-Role \
  --assume-role-policy-document file:///tmp/codebuild-trust-policy.json \
  --description "Role for VPBank K-MULT CodeBuild project" || echo "Role may already exist"

# Attach managed policies
aws iam attach-role-policy \
  --role-name VPBankKMult-CodeBuild-Role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess || echo "Policy already attached"

# Create custom policy for ECR and S3
cat > /tmp/codebuild-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:GetAuthorizationToken",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::vpbank-kmult-*/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name VPBankKMult-CodeBuild-Role \
  --policy-name VPBankKMult-CodeBuild-Policy \
  --policy-document file:///tmp/codebuild-policy.json

echo -e "${GREEN}IAM role created successfully${NC}"

# Create CodeBuild project
echo -e "${BLUE}Creating CodeBuild project...${NC}"

cat > /tmp/codebuild-project.json << EOF
{
  "name": "$PROJECT_NAME",
  "description": "Build project for VPBank K-MULT application",
  "source": {
    "type": "GITHUB",
    "location": "https://github.com/ngcuyen/multi-agent-hackathon.git",
    "buildspec": "buildspec.yml"
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
        "value": "$REGION"
      },
      {
        "name": "AWS_ACCOUNT_ID",
        "value": "$ACCOUNT_ID"
      },
      {
        "name": "IMAGE_REPO_NAME",
        "value": "$ECR_REPO"
      }
    ]
  },
  "serviceRole": "arn:aws:iam::$ACCOUNT_ID:role/VPBankKMult-CodeBuild-Role",
  "timeoutInMinutes": 30
}
EOF

aws codebuild create-project --cli-input-json file:///tmp/codebuild-project.json

echo -e "${GREEN}CodeBuild project created successfully!${NC}"

# Get project URL
PROJECT_URL="https://console.aws.amazon.com/codesuite/codebuild/projects/$PROJECT_NAME/view/new"
echo -e "${BLUE}Project URL: $PROJECT_URL${NC}"

# Start a build
echo -e "${BLUE}Starting initial build...${NC}"
BUILD_ID=$(aws codebuild start-build --project-name $PROJECT_NAME --query 'build.id' --output text)
echo -e "${GREEN}Build started with ID: $BUILD_ID${NC}"

# Clean up temp files
rm -f /tmp/codebuild-*.json

echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit the CodeBuild console: $PROJECT_URL"
echo "2. Monitor the build progress"
echo "3. Set up GitHub webhook for automatic builds"
echo "4. Configure deployment to ECS"
