#!/bin/bash

# Check VPBank K-MULT CI/CD Pipeline Status
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 VPBank K-MULT CI/CD Pipeline Status Check${NC}"
echo "=================================================="

# Check CodeBuild Project
echo -e "${BLUE}📦 CodeBuild Project Status:${NC}"
BUILD_STATUS=$(aws codebuild batch-get-projects --names VPBankKMult-Build --query 'projects[0].name' --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$BUILD_STATUS" != "NOT_FOUND" ]; then
    echo -e "${GREEN}✅ CodeBuild project exists: VPBankKMult-Build${NC}"
    
    # Get recent builds
    echo -e "${BLUE}📋 Recent builds:${NC}"
    aws codebuild list-builds-for-project --project-name VPBankKMult-Build --query 'ids[0:3]' --output table 2>/dev/null || echo "No builds found"
else
    echo -e "${RED}❌ CodeBuild project not found${NC}"
fi

echo ""

# Check ECR Repository
echo -e "${BLUE}🐳 ECR Repository Status:${NC}"
ECR_REPO=$(aws ecr describe-repositories --repository-names vpbank-kmult-backend --query 'repositories[0].repositoryName' --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$ECR_REPO" != "NOT_FOUND" ]; then
    echo -e "${GREEN}✅ ECR repository exists: vpbank-kmult-backend${NC}"
    
    # Get image count
    IMAGE_COUNT=$(aws ecr describe-images --repository-name vpbank-kmult-backend --query 'length(imageDetails)' --output text 2>/dev/null || echo "0")
    echo -e "${BLUE}📊 Docker images: $IMAGE_COUNT${NC}"
    
    if [ "$IMAGE_COUNT" -gt 0 ]; then
        echo -e "${BLUE}🏷️  Latest images:${NC}"
        aws ecr describe-images --repository-name vpbank-kmult-backend --query 'imageDetails[0:3].[imageTags[0],imagePushedAt]' --output table 2>/dev/null || echo "No image details available"
    fi
else
    echo -e "${RED}❌ ECR repository not found${NC}"
fi

echo ""

# Check IAM Role
echo -e "${BLUE}🔐 IAM Role Status:${NC}"
IAM_ROLE=$(aws iam get-role --role-name VPBankKMult-CodeBuild-Role --query 'Role.RoleName' --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$IAM_ROLE" != "NOT_FOUND" ]; then
    echo -e "${GREEN}✅ IAM role exists: VPBankKMult-CodeBuild-Role${NC}"
else
    echo -e "${RED}❌ IAM role not found${NC}"
fi

echo ""

# Check S3 Artifacts Bucket
echo -e "${BLUE}🪣 S3 Artifacts Bucket Status:${NC}"
S3_BUCKET=$(aws s3api head-bucket --bucket vpbank-kmult-artifacts 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND")

if [ "$S3_BUCKET" = "EXISTS" ]; then
    echo -e "${GREEN}✅ S3 artifacts bucket exists: vpbank-kmult-artifacts${NC}"
    
    # Get bucket size
    BUCKET_SIZE=$(aws s3 ls s3://vpbank-kmult-artifacts --recursive --summarize --human-readable 2>/dev/null | grep "Total Size" | awk '{print $3 " " $4}' || echo "Unknown")
    echo -e "${BLUE}📊 Bucket size: $BUCKET_SIZE${NC}"
else
    echo -e "${RED}❌ S3 artifacts bucket not found${NC}"
fi

echo ""

# Check GitHub Actions (if .github/workflows exists)
echo -e "${BLUE}⚡ GitHub Actions Status:${NC}"
if [ -d "/home/ubuntu/multi-agent-hackathon/.github/workflows" ]; then
    WORKFLOW_COUNT=$(find /home/ubuntu/multi-agent-hackathon/.github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
    echo -e "${GREEN}✅ GitHub Actions workflows: $WORKFLOW_COUNT${NC}"
    
    echo -e "${BLUE}📋 Available workflows:${NC}"
    find /home/ubuntu/multi-agent-hackathon/.github/workflows -name "*.yml" -o -name "*.yaml" -exec basename {} \; | sed 's/^/  • /'
else
    echo -e "${YELLOW}⚠️  No GitHub Actions workflows found${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}📊 Pipeline Summary:${NC}"
echo "=================================================="

COMPONENTS=0
WORKING=0

# Count components
if [ "$BUILD_STATUS" != "NOT_FOUND" ]; then
    COMPONENTS=$((COMPONENTS + 1))
    WORKING=$((WORKING + 1))
fi

if [ "$ECR_REPO" != "NOT_FOUND" ]; then
    COMPONENTS=$((COMPONENTS + 1))
    WORKING=$((WORKING + 1))
fi

if [ "$IAM_ROLE" != "NOT_FOUND" ]; then
    COMPONENTS=$((COMPONENTS + 1))
    WORKING=$((WORKING + 1))
fi

if [ "$S3_BUCKET" = "EXISTS" ]; then
    COMPONENTS=$((COMPONENTS + 1))
    WORKING=$((WORKING + 1))
fi

echo "• Total components: $COMPONENTS"
echo "• Working components: $WORKING"

if [ $WORKING -eq $COMPONENTS ] && [ $COMPONENTS -gt 0 ]; then
    echo -e "${GREEN}🎉 All pipeline components are operational!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Ready to deploy:${NC}"
    echo "  ./scripts/deploy-with-codebuild.sh"
elif [ $WORKING -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Pipeline partially operational ($WORKING/$COMPONENTS components)${NC}"
else
    echo -e "${RED}❌ Pipeline not operational${NC}"
    echo ""
    echo -e "${BLUE}🔧 To set up the pipeline:${NC}"
    echo "  aws cloudformation create-stack --stack-name vpbank-kmult-cicd --template-body file://cloudformation/cicd-pipeline.yml"
fi

echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "• CodeBuild Console: https://console.aws.amazon.com/codesuite/codebuild/projects/VPBankKMult-Build"
echo "• ECR Console: https://console.aws.amazon.com/ecr/repositories/private/536697254280/vpbank-kmult-backend"
echo "• CloudFormation Console: https://console.aws.amazon.com/cloudformation/home?region=us-east-1"
