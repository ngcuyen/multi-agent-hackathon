# 🚀 VPBank K-MULT Agent Studio - Deployment Guide

## 📋 **Tổng quan Deployment**

Hướng dẫn này cung cấp các phương pháp deployment cho VPBank K-MULT Agent Studio:
- **Local Development**: Phát triển và testing
- **Docker Compose**: Production-ready containers
- **AWS Cloud**: Scalable cloud deployment
- **CI/CD Pipeline**: Automated deployment

## 🏠 **Local Development**

### **Prerequisites**
```bash
# Required software
- Docker & Docker Compose
- Node.js 18+
- Python 3.12+
- AWS CLI configured
```

### **Environment Setup**
```bash
# Clone repository
git clone https://github.com/ngcuyen/multi-agent-hackathon.git
cd multi-agent-hackathon

# Configure environment
cp backend/app/mutil_agent/.env-template backend/app/mutil_agent/.env

# Edit .env file with your credentials
nano backend/app/mutil_agent/.env
```

### **Environment Variables**
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_BEDROCK_REGION=us-east-1

# AI Model Configuration
DEFAULT_MODEL_NAME=claude-37-sonnet
LLM_MAX_TOKENS=8192
LLM_TEMPERATURE=0.5

# Banking Configuration
UCP_VERSION=600
ISBP_VERSION=821
SBV_COMPLIANCE_ENABLED=true
```

### **Start Development**
```bash
# Start all services
./deployment/scripts/manage.sh start

# Check status
./deployment/scripts/manage.sh status

# View logs
./deployment/scripts/manage.sh logs
```

## 🐳 **Docker Compose Deployment**

### **Production Configuration**
```yaml
# docker-compose.yml
version: '3.8'
services:
  mutil-agent:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - mutil-agent
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### **Commands**
```bash
# Build and start
docker-compose up -d --build

# Scale services
docker-compose up -d --scale mutil-agent=3

# Update services
docker-compose pull && docker-compose up -d

# Stop services
docker-compose down
```

## ☁️ **AWS Cloud Deployment**

### **Architecture Overview**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Cloud Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│  CloudFront CDN  │  Application Load Balancer                   │
│  ├─ Frontend     │  ├─ ECS Fargate (Backend)                   │
│  └─ Static Assets│  └─ Auto Scaling Group                      │
├─────────────────────────────────────────────────────────────────┤
│                    Data & AI Services                          │
│  ├─ DynamoDB (Conversations) │  ├─ AWS Bedrock (Claude)        │
│  ├─ S3 (Document Storage)    │  ├─ Lambda (Processing)         │
│  └─ CloudWatch (Monitoring)  │  └─ API Gateway                 │
└─────────────────────────────────────────────────────────────────┘
```

### **AWS Services Used**
- **Compute**: ECS Fargate, Lambda
- **Storage**: S3, DynamoDB
- **AI/ML**: AWS Bedrock (Claude 3.7 Sonnet)
- **Networking**: CloudFront, ALB, API Gateway
- **Monitoring**: CloudWatch, X-Ray

### **Deployment Steps**

#### **1. Infrastructure Setup**
```bash
# Deploy infrastructure
cd deployment/aws
./deploy_refactored_aws.sh

# Verify deployment
aws ecs list-clusters
aws s3 ls
```

#### **2. Application Deployment**
```bash
# Build and push Docker images
docker build -t vpbank-kmult-backend ./backend
docker build -t vpbank-kmult-frontend ./frontend

# Tag for ECR
docker tag vpbank-kmult-backend:latest $ECR_REPO/backend:latest
docker tag vpbank-kmult-frontend:latest $ECR_REPO/frontend:latest

# Push to ECR
docker push $ECR_REPO/backend:latest
docker push $ECR_REPO/frontend:latest
```

#### **3. ECS Service Update**
```bash
# Update ECS service
aws ecs update-service \
  --cluster vpbank-kmult \
  --service kmult-backend \
  --force-new-deployment

aws ecs update-service \
  --cluster vpbank-kmult \
  --service kmult-frontend \
  --force-new-deployment
```

### **Cost Optimization**
```bash
# Monthly AWS costs (estimated)
- ECS Fargate: $150-300
- DynamoDB: $50-100
- S3 Storage: $20-50
- Bedrock API: $100-200
- CloudFront: $10-30
- Total: ~$330-680/month
```

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy VPBank K-MULT
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: ./testing/integration/test_refactored_apis.sh
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: ./deployment/aws/deploy_refactored_aws.sh
```

### **AWS CodeBuild**
```yaml
# buildspec.yml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  
  build:
    commands:
      - echo Build started on `date`
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG ./backend
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
  
  post_build:
    commands:
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
```

## 🔧 **Configuration Management**

### **Environment-specific Configs**
```bash
# Development
cp .env.development .env

# Staging
cp .env.staging .env

# Production
cp .env.production .env
```

### **Secrets Management**
```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name "vpbank-kmult/api-keys" \
  --description "API keys for VPBank K-MULT" \
  --secret-string '{"bedrock_key":"xxx","db_password":"yyy"}'

# Kubernetes Secrets
kubectl create secret generic vpbank-kmult-secrets \
  --from-literal=aws-access-key-id=$AWS_ACCESS_KEY_ID \
  --from-literal=aws-secret-access-key=$AWS_SECRET_ACCESS_KEY
```

## 📊 **Monitoring & Observability**

### **Health Checks**
```bash
# Application health
curl http://localhost:8080/health

# Service-specific health
curl http://localhost:8080/mutil_agent/public/api/v1/health-check/health

# Database connectivity
curl http://localhost:8080/mutil_agent/api/v1/health/database
```

### **Metrics Collection**
```bash
# CloudWatch metrics
aws logs create-log-group --log-group-name /aws/ecs/vpbank-kmult

# Custom metrics
aws cloudwatch put-metric-data \
  --namespace "VPBank/KMULT" \
  --metric-data MetricName=ProcessingTime,Value=2.5,Unit=Seconds
```

### **Alerting**
```bash
# CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "VPBank-KMULT-HighErrorRate" \
  --alarm-description "High error rate detected" \
  --metric-name ErrorRate \
  --namespace VPBank/KMULT \
  --statistic Average \
  --period 300 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold
```

## 🔒 **Security Configuration**

### **Network Security**
```bash
# Security groups
aws ec2 create-security-group \
  --group-name vpbank-kmult-sg \
  --description "Security group for VPBank K-MULT"

# Allow HTTPS only
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### **IAM Roles**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Container startup failures**
```bash
# Check logs
docker logs vpbank-kmult-backend

# Debug container
docker exec -it vpbank-kmult-backend /bin/bash

# Check resource usage
docker stats
```

#### **2. AWS deployment issues**
```bash
# Check ECS service status
aws ecs describe-services --cluster vpbank-kmult --services kmult-backend

# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name vpbank-kmult

# View ECS logs
aws logs get-log-events --log-group-name /aws/ecs/vpbank-kmult
```

#### **3. Performance issues**
```bash
# Check resource utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=kmult-backend \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## 📞 **Support & Maintenance**

### **Backup Procedures**
```bash
# Database backup
./tools/backup/backup_database.sh

# Configuration backup
./tools/backup/backup_configs.sh

# Full system backup
./tools/backup/full_backup.sh
```

### **Update Procedures**
```bash
# Rolling update
./deployment/scripts/rolling_update.sh

# Blue-green deployment
./deployment/scripts/blue_green_deploy.sh

# Rollback
./deployment/scripts/rollback.sh
```

### **Contact Information**
- **Team**: Multi-Agent Hackathon 2025 - Group 181
- **Support**: Technical documentation available at `/docs`
- **Emergency**: Check health dashboard at `/health`
