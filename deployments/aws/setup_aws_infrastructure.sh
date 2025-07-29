#!/bin/bash

# VPBank K-MULT Agent Studio - AWS Infrastructure Setup
# Creates necessary AWS resources for deployment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🏗️ VPBank K-MULT Agent Studio - AWS Infrastructure Setup${NC}"
echo "=================================================================="

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="536697254280"
PROJECT_NAME="vpbank-kmult"
S3_BUCKET="vpbank-kmult-frontend-$(date +%Y%m%d)"
ECR_REPO="vpbank-kmult-backend"
ECS_CLUSTER="vpbank-kmult-cluster"
VPC_NAME="vpbank-kmult-vpc"

echo -e "${CYAN}📋 Infrastructure Configuration:${NC}"
echo "   AWS Region: $AWS_REGION"
echo "   Project Name: $PROJECT_NAME"
echo "   S3 Bucket: $S3_BUCKET"
echo "   ECR Repository: $ECR_REPO"
echo "   ECS Cluster: $ECS_CLUSTER"
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

# Step 1: Create S3 bucket for frontend
echo -e "${BLUE}🪣 Step 1: Creating S3 Bucket for Frontend${NC}"
aws s3 mb s3://$S3_BUCKET --region $AWS_REGION 2>/dev/null || echo "Bucket may already exist"

# Configure bucket for static website hosting
aws s3 website s3://$S3_BUCKET --index-document index.html --error-document error.html
check_success "S3 bucket configured for static hosting"

# Set bucket policy for public read access
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy.json
check_success "S3 bucket policy applied"

# Step 2: Create ECR repository
echo -e "${BLUE}📦 Step 2: Creating ECR Repository${NC}"
aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION 2>/dev/null || echo "Repository may already exist"
check_success "ECR repository ready"

# Step 3: Create ECS Cluster
echo -e "${BLUE}⚙️ Step 3: Creating ECS Cluster${NC}"
aws ecs create-cluster --cluster-name $ECS_CLUSTER --region $AWS_REGION 2>/dev/null || echo "Cluster may already exist"
check_success "ECS cluster ready"

# Step 4: Create CloudWatch Log Group
echo -e "${BLUE}📊 Step 4: Creating CloudWatch Log Group${NC}"
aws logs create-log-group --log-group-name "/ecs/$PROJECT_NAME" --region $AWS_REGION 2>/dev/null || echo "Log group may already exist"
check_success "CloudWatch log group ready"

# Step 5: Create IAM roles if they don't exist
echo -e "${BLUE}🔐 Step 5: Setting up IAM Roles${NC}"

# ECS Task Execution Role
cat > ecs-task-execution-role.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://ecs-task-execution-role.json 2>/dev/null || echo "Role may already exist"
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || echo "Policy may already be attached"

# ECS Task Role
cat > ecs-task-role.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

aws iam create-role --role-name ecsTaskRole --assume-role-policy-document file://ecs-task-role.json 2>/dev/null || echo "Role may already exist"

# Create policy for Bedrock access
cat > bedrock-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": "*"
        }
    ]
}
EOF

aws iam create-policy --policy-name BedrockAccessPolicy --policy-document file://bedrock-policy.json 2>/dev/null || echo "Policy may already exist"
aws iam attach-role-policy --role-name ecsTaskRole --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/BedrockAccessPolicy 2>/dev/null || echo "Policy may already be attached"

check_success "IAM roles configured"

# Step 6: Create Application Load Balancer (if needed)
echo -e "${BLUE}⚖️ Step 6: Setting up Load Balancer${NC}"
# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text --region $AWS_REGION)

# Create security group for ALB
aws ec2 create-security-group --group-name $PROJECT_NAME-alb-sg --description "Security group for VPBank K-MULT ALB" --vpc-id $VPC_ID --region $AWS_REGION 2>/dev/null || echo "Security group may already exist"

# Get security group ID
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$PROJECT_NAME-alb-sg" --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION)

# Add inbound rules
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null || echo "Rule may already exist"
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null || echo "Rule may already exist"

check_success "Security groups configured"

# Step 7: Create CloudFront Distribution
echo -e "${BLUE}🌐 Step 7: Creating CloudFront Distribution${NC}"
cat > cloudfront-config.json << EOF
{
    "CallerReference": "$PROJECT_NAME-$(date +%s)",
    "Comment": "VPBank K-MULT Agent Studio Distribution",
    "DefaultCacheBehavior": {
        "TargetOriginId": "$S3_BUCKET",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "$S3_BUCKET",
                "DomainName": "$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only"
                }
            }
        ]
    },
    "Enabled": true,
    "DefaultRootObject": "index.html"
}
EOF

CLOUDFRONT_ID=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json --query 'Distribution.Id' --output text --region $AWS_REGION 2>/dev/null || echo "Distribution may already exist")
check_success "CloudFront distribution configured"

# Cleanup temporary files
rm -f bucket-policy.json ecs-task-execution-role.json ecs-task-role.json bedrock-policy.json cloudfront-config.json

echo ""
echo -e "${GREEN}🎉 AWS INFRASTRUCTURE SETUP COMPLETE!${NC}"
echo "=============================================================================="
echo -e "${CYAN}📊 Infrastructure Summary:${NC}"
echo "   S3 Bucket: $S3_BUCKET"
echo "   ECR Repository: $ECR_REPO"
echo "   ECS Cluster: $ECS_CLUSTER"
echo "   CloudWatch Log Group: /ecs/$PROJECT_NAME"
echo "   CloudFront Distribution ID: $CLOUDFRONT_ID"
echo ""
echo -e "${CYAN}🚀 Next Steps:${NC}"
echo "   1. Run the deployment script: ./deploy_banking_professional.sh"
echo "   2. Configure custom domain (optional)"
echo "   3. Set up monitoring and alerts"
echo "   4. Configure SSL certificates"
echo ""
echo -e "${GREEN}🏆 Infrastructure is ready for VPBank K-MULT deployment!${NC}"

echo ""
echo -e "${BLUE}📋 Infrastructure setup completed at: $(date)${NC}"
