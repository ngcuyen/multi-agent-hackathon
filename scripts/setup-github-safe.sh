#!/bin/bash

# Safe GitHub Setup for CI/CD
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}🚨 SECURITY WARNING: Never share GitHub tokens in chat or code!${NC}"
echo ""
echo -e "${BLUE}🔐 Safe GitHub Token Setup${NC}"
echo "=================================================="

echo -e "${YELLOW}⚠️  IMPORTANT SECURITY STEPS:${NC}"
echo "1. REVOKE the exposed token immediately at: https://github.com/settings/tokens"
echo "2. Create a NEW token with minimal permissions"
echo "3. Store token securely (never in plain text)"
echo ""

read -p "Have you revoked the exposed token? (y/N): " -r REVOKED
if [[ ! "$REVOKED" =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please revoke the exposed token first!${NC}"
    echo "Go to: https://github.com/settings/tokens"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Setting up GitHub integration safely...${NC}"

# Check if we can access the repository
echo -e "${BLUE}🔍 Checking repository access...${NC}"
REPO_URL="https://github.com/ngcuyen/multi-agent-hackathon"

# Test repository access
curl -s -o /dev/null -w "%{http_code}" "$REPO_URL" > /tmp/repo_status.txt
REPO_STATUS=$(cat /tmp/repo_status.txt)

if [ "$REPO_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Repository is publicly accessible${NC}"
    REPO_PUBLIC=true
elif [ "$REPO_STATUS" = "404" ]; then
    echo -e "${YELLOW}⚠️  Repository is private or doesn't exist${NC}"
    REPO_PUBLIC=false
else
    echo -e "${RED}❌ Cannot access repository (status: $REPO_STATUS)${NC}"
    REPO_PUBLIC=false
fi

# Setup based on repository access
if [ "$REPO_PUBLIC" = true ]; then
    echo -e "${BLUE}🔧 Setting up public repository integration...${NC}"
    
    # Update CodeBuild project to use public repository
    cat > /tmp/update-codebuild.json << EOF
{
    "name": "VPBankKMult-Build",
    "source": {
        "type": "GITHUB",
        "location": "$REPO_URL",
        "buildspec": "buildspec.yml",
        "reportBuildStatus": true,
        "insecureSsl": false
    }
}
EOF

    aws codebuild update-project --cli-input-json file:///tmp/update-codebuild.json --region us-east-1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ CodeBuild updated for public repository${NC}"
    else
        echo -e "${RED}❌ Failed to update CodeBuild${NC}"
    fi
    
else
    echo -e "${BLUE}🔐 Private repository detected - token required${NC}"
    echo ""
    echo "To setup private repository access:"
    echo "1. Create a NEW GitHub token at: https://github.com/settings/tokens"
    echo "2. Select minimal scopes: 'repo' only"
    echo "3. Set expiration: 30 days maximum"
    echo "4. Run: aws codebuild import-source-credentials --server-type GITHUB --auth-type PERSONAL_ACCESS_TOKEN --token YOUR_NEW_TOKEN"
    echo ""
fi

# Setup webhook for automatic builds
echo -e "${BLUE}🔗 Setting up webhook for automatic builds...${NC}"

# Check if webhook exists
WEBHOOK_EXISTS=$(aws codebuild list-webhooks --region us-east-1 --query "webhooks[?projectName=='VPBankKMult-Build'].url" --output text 2>/dev/null || echo "")

if [ -z "$WEBHOOK_EXISTS" ]; then
    echo -e "${BLUE}📡 Creating webhook...${NC}"
    
    aws codebuild create-webhook \
        --project-name VPBankKMult-Build \
        --region us-east-1 \
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
            ]
        ]' 2>/dev/null || echo -e "${YELLOW}⚠️  Webhook creation may require authentication${NC}"
else
    echo -e "${GREEN}✅ Webhook already exists${NC}"
fi

# Show current setup
echo ""
echo -e "${BLUE}📊 Current CI/CD Setup:${NC}"
echo "=================================================="

# Check GitHub Actions
if [ -d "/home/ubuntu/multi-agent-hackathon/.github/workflows" ]; then
    WORKFLOW_COUNT=$(find /home/ubuntu/multi-agent-hackathon/.github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
    echo -e "${GREEN}✅ GitHub Actions: $WORKFLOW_COUNT workflows${NC}"
else
    echo -e "${YELLOW}⚠️  No GitHub Actions workflows found${NC}"
fi

# Check CodeBuild
BUILD_PROJECT=$(aws codebuild batch-get-projects --names VPBankKMult-Build --query 'projects[0].name' --output text 2>/dev/null || echo "NOT_FOUND")
if [ "$BUILD_PROJECT" != "NOT_FOUND" ]; then
    echo -e "${GREEN}✅ CodeBuild: VPBankKMult-Build${NC}"
else
    echo -e "${RED}❌ CodeBuild project not found${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Push code to trigger builds:"
echo "   git add ."
echo "   git commit -m 'Update CI/CD pipeline'"
echo "   git push origin main"
echo ""
echo "2. Monitor builds:"
echo "   ./scripts/manage-cicd.sh logs"
echo ""
echo "3. Check build status:"
echo "   ./scripts/manage-cicd.sh status"

# Cleanup
rm -f /tmp/repo_status.txt /tmp/update-codebuild.json

echo ""
echo -e "${RED}🔒 SECURITY REMINDER:${NC}"
echo "• Never share tokens in chat, code, or logs"
echo "• Use environment variables for sensitive data"
echo "• Regularly rotate access tokens"
echo "• Monitor repository access logs"
