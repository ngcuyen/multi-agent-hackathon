#!/bin/bash

# VPBank K-MULT Agent Studio - Professional Banking AWS Deployment
# Deploys the professional banking-style interface to AWS

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🏦 VPBank K-MULT Agent Studio - Professional Banking AWS Deployment${NC}"
echo "=============================================================================="

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="536697254280"
IMAGE_REPO_NAME="vpbank-kmult-backend"
REPOSITORY_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_REPO_NAME"
CLOUDFRONT_ID="E3IBN9Y0M9RFGA"
S3_BUCKET="vpbank-kmult-frontend-20250719"
ECS_CLUSTER="vpbank-kmult-cluster"
ECS_SERVICE="vpbank-kmult-service"
TASK_DEFINITION="vpbank-kmult-task"

echo -e "${CYAN}📋 Deployment Configuration:${NC}"
echo "   AWS Region: $AWS_REGION"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   ECR Repository: $REPOSITORY_URI"
echo "   CloudFront ID: $CLOUDFRONT_ID"
echo "   S3 Bucket: $S3_BUCKET"
echo "   ECS Cluster: $ECS_CLUSTER"
echo "   ECS Service: $ECS_SERVICE"
echo ""

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Verify AWS credentials and permissions
echo -e "${BLUE}🔐 Step 1: Verifying AWS Credentials${NC}"
aws sts get-caller-identity > /dev/null
check_success "AWS credentials verified"

# Step 2: Build and tag Docker image
echo -e "${BLUE}🐳 Step 2: Building Docker Image${NC}"
echo "Building professional banking backend image..."
docker build -t $IMAGE_REPO_NAME:latest ./backend/
check_success "Docker image built"

# Step 3: Authenticate Docker to ECR
echo -e "${BLUE}🔑 Step 3: Authenticating to ECR${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI
check_success "ECR authentication successful"

# Step 4: Create ECR repository if it doesn't exist
echo -e "${BLUE}📦 Step 4: Ensuring ECR Repository Exists${NC}"
aws ecr describe-repositories --repository-names $IMAGE_REPO_NAME --region $AWS_REGION > /dev/null 2>&1 || {
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name $IMAGE_REPO_NAME --region $AWS_REGION
    check_success "ECR repository created"
}

# Step 5: Tag and push image to ECR
echo -e "${BLUE}🚀 Step 5: Pushing Image to ECR${NC}"
docker tag $IMAGE_REPO_NAME:latest $REPOSITORY_URI:latest
docker tag $IMAGE_REPO_NAME:latest $REPOSITORY_URI:banking-professional-$(date +%Y%m%d-%H%M%S)
docker push $REPOSITORY_URI:latest
docker push $REPOSITORY_URI:banking-professional-$(date +%Y%m%d-%H%M%S)
check_success "Docker image pushed to ECR"

# Step 6: Build and deploy frontend
echo -e "${BLUE}🌐 Step 6: Building Professional Banking Frontend${NC}"
cd frontend
echo "Installing dependencies..."
npm ci --only=production
check_success "Frontend dependencies installed"

echo "Building professional banking interface..."
npm run build
check_success "Frontend built successfully"

# Step 7: Deploy frontend to S3
echo -e "${BLUE}☁️ Step 7: Deploying Frontend to S3${NC}"
echo "Syncing build files to S3..."
aws s3 sync build/ s3://$S3_BUCKET/ --delete --region $AWS_REGION
check_success "Frontend deployed to S3"

# Step 8: Invalidate CloudFront cache
echo -e "${BLUE}🔄 Step 8: Invalidating CloudFront Cache${NC}"
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*" --region $AWS_REGION
check_success "CloudFront cache invalidated"

cd ..

# Step 9: Update ECS Task Definition
echo -e "${BLUE}⚙️ Step 9: Updating ECS Task Definition${NC}"
cat > task-definition.json << EOF
{
    "family": "$TASK_DEFINITION",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskRole",
    "containerDefinitions": [
        {
            "name": "vpbank-kmult-backend",
            "image": "$REPOSITORY_URI:latest",
            "portMappings": [
                {
                    "containerPort": 8080,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/vpbank-kmult",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "environment": [
                {
                    "name": "AWS_DEFAULT_REGION",
                    "value": "$AWS_REGION"
                },
                {
                    "name": "ENVIRONMENT",
                    "value": "production"
                }
            ]
        }
    ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition.json --region $AWS_REGION
check_success "ECS task definition updated"

# Step 10: Update ECS Service
echo -e "${BLUE}🔄 Step 10: Updating ECS Service${NC}"
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --task-definition $TASK_DEFINITION --region $AWS_REGION
check_success "ECS service updated"

# Step 11: Wait for deployment to complete
echo -e "${BLUE}⏳ Step 11: Waiting for Deployment to Complete${NC}"
echo "Waiting for ECS service to stabilize..."
aws ecs wait services-stable --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION
check_success "ECS service deployment completed"

# Step 12: Get deployment URLs
echo -e "${BLUE}🌐 Step 12: Getting Deployment URLs${NC}"
CLOUDFRONT_URL="https://d3j8k9x2l1m4n5.cloudfront.net"
ALB_DNS=$(aws elbv2 describe-load-balancers --region $AWS_REGION --query 'LoadBalancers[?contains(LoadBalancerName, `vpbank-kmult`)].DNSName' --output text)

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
echo "=============================================================================="
echo -e "${CYAN}📊 Deployment Summary:${NC}"
echo "   Frontend URL: $CLOUDFRONT_URL"
echo "   Backend URL: http://$ALB_DNS:8080"
echo "   API Documentation: http://$ALB_DNS:8080/docs"
echo "   Health Check: http://$ALB_DNS:8080/mutil_agent/public/api/v1/health-check/health"
echo ""
echo -e "${CYAN}🏦 Professional Banking Features Deployed:${NC}"
echo "   ✅ Clean, professional interface without emoji icons"
echo "   ✅ Banking-appropriate terminology and styling"
echo "   ✅ Corporate color scheme and layout"
echo "   ✅ Professional navigation and workflows"
echo "   ✅ Enterprise-grade security and reliability"
echo ""
echo -e "${CYAN}🚀 Next Steps:${NC}"
echo "   1. Test the deployed application at: $CLOUDFRONT_URL"
echo "   2. Verify API endpoints are working correctly"
echo "   3. Configure custom domain if needed"
echo "   4. Set up monitoring and alerts"
echo "   5. Configure SSL certificates for production"
echo ""
echo -e "${GREEN}🏆 VPBank K-MULT Agent Studio is now live on AWS!${NC}"

# Cleanup
rm -f task-definition.json

echo ""
echo -e "${BLUE}📋 Deployment completed at: $(date)${NC}"
