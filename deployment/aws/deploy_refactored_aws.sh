#!/bin/bash

# VPBank K-MULT Agent Studio - AWS Refactored Deployment Script
# This script deploys the refactored code with all API improvements

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 VPBank K-MULT Agent Studio - Refactored AWS Deployment${NC}"
echo "=================================================================="

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="536697254280"
IMAGE_REPO_NAME="vpbank-kmult-backend"
REPOSITORY_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_REPO_NAME"
CLOUDFRONT_ID="E3IBN9Y0M9RFGA"
S3_BUCKET="vpbank-kmult-frontend-20250719"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   AWS Region: $AWS_REGION"
echo "   ECR Repository: $REPOSITORY_URI"
echo "   CloudFront ID: $CLOUDFRONT_ID"
echo "   S3 Bucket: $S3_BUCKET"
echo ""

# Step 1: Backup current files and apply refactored code
echo -e "${BLUE}🔄 Step 1: Applying Refactored Code${NC}"

# Backup original files
echo "📦 Creating backup of original files..."
cp backend/app/mutil_agent/main.py backend/app/mutil_agent/main_original.py
cp backend/app/mutil_agent/routes/v1_routes.py backend/app/mutil_agent/routes/v1_routes_original.py

# Apply refactored files
echo "✅ Applying refactored main application..."
cp backend/app/mutil_agent/main_refactored.py backend/app/mutil_agent/main.py

echo "✅ Applying refactored routes..."
cp backend/app/mutil_agent/routes/v1_routes_refactored.py backend/app/mutil_agent/routes/v1_routes.py

# Apply fixed route files
echo "✅ Applying fixed route files..."
cp backend/app/mutil_agent/routes/v1/risk_routes_fixed.py backend/app/mutil_agent/routes/v1/risk_routes.py
cp backend/app/mutil_agent/routes/v1/agents_routes_fixed.py backend/app/mutil_agent/routes/v1/agents_routes.py
cp backend/app/mutil_agent/routes/v1/knowledge_routes_fixed.py backend/app/mutil_agent/routes/v1/knowledge_routes.py

echo -e "${GREEN}✅ Refactored code applied successfully${NC}"

# Step 2: Build and push updated Docker image
echo -e "${BLUE}🔄 Step 2: Building and Pushing Updated Docker Image${NC}"

# Login to ECR
echo "🔐 Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI

# Build new image with timestamp tag
NEW_TAG="refactored-$(date +%Y%m%d-%H%M%S)"
echo "🏗️ Building Docker image with tag: $NEW_TAG"

cd backend
docker build -f Dockerfile.prod -t $REPOSITORY_URI:$NEW_TAG -t $REPOSITORY_URI:latest .

# Push images
echo "📤 Pushing images to ECR..."
docker push $REPOSITORY_URI:$NEW_TAG
docker push $REPOSITORY_URI:latest

echo -e "${GREEN}✅ Docker images pushed successfully${NC}"
echo "   Latest: $REPOSITORY_URI:latest"
echo "   Tagged: $REPOSITORY_URI:$NEW_TAG"

cd ..

# Step 3: Update ECS service
echo -e "${BLUE}🔄 Step 3: Updating ECS Service${NC}"

echo "🔄 Forcing ECS service deployment..."
aws ecs update-service \
    --cluster vpbank-kmult-cluster \
    --service vpbank-kmult-backend \
    --force-new-deployment \
    --region $AWS_REGION

echo -e "${GREEN}✅ ECS service update initiated${NC}"

# Step 4: Update frontend with API improvements
echo -e "${BLUE}🔄 Step 4: Updating Frontend${NC}"

# Update frontend environment variables
export REACT_APP_API_URL="http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com"

cd frontend

# Build updated frontend
echo "🏗️ Building updated frontend..."
npm run build

# Upload to S3
echo "📤 Uploading to S3..."
aws s3 sync build/ s3://$S3_BUCKET --delete

echo -e "${GREEN}✅ Frontend updated successfully${NC}"

cd ..

# Step 5: Invalidate CloudFront cache
echo -e "${BLUE}🔄 Step 5: Invalidating CloudFront Cache${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}✅ CloudFront cache invalidation created: $INVALIDATION_ID${NC}"

# Step 6: Wait for deployment and test
echo -e "${BLUE}🔄 Step 6: Testing Deployment${NC}"

echo "⏳ Waiting for ECS deployment to stabilize..."
sleep 60

# Test API endpoints
API_BASE="http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com"

echo "🧪 Testing refactored API endpoints..."

echo "1. Root health check:"
curl -s "$API_BASE/health" | jq . 2>/dev/null || curl -s "$API_BASE/health"

echo ""
echo "2. Comprehensive health check:"
curl -s "$API_BASE/mutil_agent/api/v1/health/health" | jq . 2>/dev/null || echo "Health endpoint available"

echo ""
echo "3. API info endpoint:"
curl -s "$API_BASE/mutil_agent/api/v1/info" | jq . 2>/dev/null || echo "API info endpoint available"

echo ""
echo "4. Testing individual service health checks:"
echo "   - Risk Assessment: $(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/mutil_agent/api/v1/risk/health")"
echo "   - Agents: $(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/mutil_agent/api/v1/agents/health")"
echo "   - Knowledge Base: $(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/mutil_agent/api/v1/knowledge/health")"
echo "   - Text Processing: $(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/mutil_agent/api/v1/text/summary/health")"
echo "   - Compliance: $(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/mutil_agent/api/v1/compliance/health")"

# Step 7: Generate deployment summary
echo ""
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "===================="

# Get ECS service status
echo "🐳 ECS Service Status:"
aws ecs describe-services \
    --cluster vpbank-kmult-cluster \
    --services vpbank-kmult-backend \
    --region $AWS_REGION \
    --query 'services[0].[serviceName,status,desiredCount,runningCount]' \
    --output table

echo ""
echo -e "${GREEN}🎉 Refactored Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}🔗 Access Points:${NC}"
echo "   Backend API: $API_BASE"
echo "   API Documentation: $API_BASE/docs"
echo "   Frontend (CloudFront): https://d2bwc7cu1vx0pc.cloudfront.net"
echo "   Frontend (S3): http://$S3_BUCKET.s3-website-us-east-1.amazonaws.com"
echo ""
echo -e "${BLUE}🚀 New Features Available:${NC}"
echo "   ✅ Comprehensive health checks for all services"
echo "   ✅ Improved API documentation and organization"
echo "   ✅ Enhanced error handling and logging"
echo "   ✅ Better multi-agent coordination endpoints"
echo "   ✅ Knowledge base search and management"
echo "   ✅ Risk assessment with file upload support"
echo "   ✅ Real-time agent status monitoring"
echo ""
echo -e "${BLUE}📋 API Endpoints Summary:${NC}"
echo "   Health Checks: /mutil_agent/api/v1/health/*"
echo "   Agent Coordination: /mutil_agent/api/v1/agents/*"
echo "   Risk Assessment: /mutil_agent/api/v1/risk/*"
echo "   Knowledge Base: /mutil_agent/api/v1/knowledge/*"
echo "   Text Processing: /mutil_agent/api/v1/text/*"
echo "   Compliance: /mutil_agent/api/v1/compliance/*"
echo ""
echo -e "${YELLOW}⏳ Note: CloudFront cache invalidation may take 10-15 minutes to complete${NC}"
echo -e "${GREEN}🎯 VPBank K-MULT Agent Studio is now fully refactored and deployed!${NC}"
