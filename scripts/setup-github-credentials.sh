#!/bin/bash

# Setup GitHub credentials for CodeBuild
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔐 Setting up GitHub credentials for CodeBuild${NC}"
echo "=================================================="

echo -e "${YELLOW}⚠️  IMPORTANT: You need a GitHub Personal Access Token${NC}"
echo ""
echo "To create a GitHub Personal Access Token:"
echo "1. Go to https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Select scopes: 'repo' (Full control of private repositories)"
echo "4. Copy the generated token"
echo ""

read -p "Enter your GitHub Personal Access Token: " -s GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ No token provided. Exiting.${NC}"
    exit 1
fi

echo -e "${BLUE}📝 Importing GitHub credentials to CodeBuild...${NC}"

# Import source credentials
aws codebuild import-source-credentials \
    --server-type GITHUB \
    --auth-type PERSONAL_ACCESS_TOKEN \
    --token "$GITHUB_TOKEN" \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ GitHub credentials imported successfully!${NC}"
    
    echo ""
    echo -e "${BLUE}🔍 Verifying credentials...${NC}"
    aws codebuild list-source-credentials --region us-east-1
    
    echo ""
    echo -e "${GREEN}🎉 Setup complete! You can now run builds.${NC}"
    echo ""
    echo -e "${BLUE}🚀 To deploy:${NC}"
    echo "  ./scripts/deploy-with-codebuild.sh"
    
else
    echo -e "${RED}❌ Failed to import GitHub credentials${NC}"
    exit 1
fi

# Clear token from memory
unset GITHUB_TOKEN
