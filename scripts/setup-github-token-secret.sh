#!/bin/bash

# Setup GitHub token in AWS Secrets Manager for CodePipeline
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔐 Setting up GitHub Token for CodePipeline${NC}"
echo "================================================="

echo -e "${YELLOW}⚠️  IMPORTANT: You need a GitHub Personal Access Token${NC}"
echo ""
echo "To create a GitHub Personal Access Token:"
echo "1. Go to https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Select scopes:"
echo "   - repo (Full control of private repositories)"
echo "   - admin:repo_hook (Full control of repository hooks)"
echo "4. Copy the generated token"
echo ""

read -p "Enter your GitHub Personal Access Token: " -s GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ No token provided. Exiting.${NC}"
    exit 1
fi

echo -e "${BLUE}📝 Storing GitHub token in AWS Secrets Manager...${NC}"

# Create secret in Secrets Manager
aws secretsmanager create-secret \
    --name "github-token" \
    --description "GitHub Personal Access Token for CodePipeline" \
    --secret-string "{\"token\":\"$GITHUB_TOKEN\"}" \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ GitHub token stored successfully in Secrets Manager!${NC}"
    
    echo ""
    echo -e "${BLUE}🔍 Verifying secret...${NC}"
    aws secretsmanager describe-secret --secret-id github-token --region us-east-1 --query 'Name' --output text
    
    echo ""
    echo -e "${GREEN}🎉 Setup complete! CodePipeline can now access GitHub.${NC}"
    
else
    echo -e "${RED}❌ Failed to store GitHub token${NC}"
    
    # Check if secret already exists
    if aws secretsmanager describe-secret --secret-id github-token --region us-east-1 >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Secret already exists. Updating...${NC}"
        
        aws secretsmanager update-secret \
            --secret-id "github-token" \
            --secret-string "{\"token\":\"$GITHUB_TOKEN\"}" \
            --region us-east-1
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ GitHub token updated successfully!${NC}"
        else
            echo -e "${RED}❌ Failed to update GitHub token${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi

# Clear token from memory
unset GITHUB_TOKEN

echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Deploy CodePipeline CloudFormation stack"
echo "2. Pipeline will automatically trigger on GitHub pushes"
echo "3. Monitor pipeline execution in AWS Console"
