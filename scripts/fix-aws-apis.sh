#!/bin/bash

# Fix AWS Production APIs by updating ECS task definition
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 FIXING AWS PRODUCTION APIs${NC}"
echo "=================================="

# Step 1: Get current task definition
echo -e "${BLUE}📋 Getting current task definition...${NC}"
CURRENT_TASK_DEF=$(aws ecs describe-task-definition --task-definition VPBankKMultStackBackendServiceTaskDef5AD716F9:3 --region us-east-1)

# Step 2: Create new task definition with proper environment variables
echo -e "${BLUE}🔨 Creating new task definition with AI service configuration...${NC}"

cat > /tmp/new-task-definition.json << 'EOF'
{
    "family": "VPBankKMultStackBackendServiceTaskDef5AD716F9",
    "taskRoleArn": "arn:aws:iam::536697254280:role/VPBankKMultStack-BackendServiceTaskDefTaskRoleD63B9-kcC5J4ETPRbP",
    "executionRoleArn": "arn:aws:iam::536697254280:role/VPBankKMultStack-BackendServiceTaskDefExecutionRole-dDvtLST1KzjM",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "containerDefinitions": [
        {
            "name": "web",
            "image": "536697254280.dkr.ecr.us-east-1.amazonaws.com/vpbank-kmult-backend:latest",
            "cpu": 0,
            "portMappings": [
                {
                    "containerPort": 8080,
                    "hostPort": 8080,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "environment": [
                {
                    "name": "AWS_DEFAULT_REGION",
                    "value": "us-east-1"
                },
                {
                    "name": "AWS_REGION",
                    "value": "us-east-1"
                },
                {
                    "name": "AWS_BEDROCK_REGION",
                    "value": "us-east-1"
                },
                {
                    "name": "ENVIRONMENT",
                    "value": "production"
                },
                {
                    "name": "DEFAULT_MODEL_NAME",
                    "value": "claude-37-sonnet"
                },
                {
                    "name": "CONVERSATION_CHAT_MODEL_NAME",
                    "value": "claude-37-sonnet"
                },
                {
                    "name": "CONVERSATION_CHAT_TOP_P",
                    "value": "0.9"
                },
                {
                    "name": "CONVERSATION_CHAT_TEMPERATURE",
                    "value": "0.7"
                },
                {
                    "name": "VERIFY_HTTPS",
                    "value": "True"
                }
            ],
            "secrets": [
                {
                    "name": "AWS_ACCESS_KEY_ID",
                    "valueFrom": "arn:aws:secretsmanager:us-east-1:536697254280:secret:vpbank-kmult/app-secrets-rjeryB:AWS_ACCESS_KEY_ID::"
                },
                {
                    "name": "AWS_SECRET_ACCESS_KEY",
                    "valueFrom": "arn:aws:secretsmanager:us-east-1:536697254280:secret:vpbank-kmult/app-secrets-rjeryB:AWS_SECRET_ACCESS_KEY::"
                },
                {
                    "name": "REDIS_HOST",
                    "valueFrom": "arn:aws:secretsmanager:us-east-1:536697254280:secret:vpbank-kmult/app-secrets-rjeryB:REDIS_HOST::"
                },
                {
                    "name": "REDIS_PORT",
                    "valueFrom": "arn:aws:secretsmanager:us-east-1:536697254280:secret:vpbank-kmult/app-secrets-rjeryB:REDIS_PORT::"
                },
                {
                    "name": "DOCUMENTS_TABLE",
                    "valueFrom": "arn:aws:secretsmanager:us-east-1:536697254280:secret:vpbank-kmult/app-secrets-rjeryB:DOCUMENTS_TABLE::"
                },
                {
                    "name": "CONVERSATIONS_TABLE",
                    "valueFrom": "arn:aws:secretsmanager:us-east-1:536697254280:secret:vpbank-kmult/app-secrets-rjeryB:CONVERSATIONS_TABLE::"
                },
                {
                    "name": "DOCUMENTS_BUCKET",
                    "valueFrom": "arn:aws:secretsmanager:us-east-1:536697254280:secret:vpbank-kmult/app-secrets-rjeryB:DOCUMENTS_BUCKET::"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "VPBankKMultStack-BackendServiceTaskDefwebLogGroup614D1BFF-vFTUzXdLSDlz",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "vpbank-kmult-backend"
                }
            },
            "healthCheck": {
                "command": [
                    "CMD-SHELL",
                    "curl -f http://localhost:8080/mutil_agent/public/api/v1/health-check/health || exit 1"
                ],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF

# Step 3: Register new task definition
echo -e "${BLUE}📝 Registering new task definition...${NC}"
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file:///tmp/new-task-definition.json --region us-east-1 --query 'taskDefinition.taskDefinitionArn' --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ New task definition registered: $NEW_TASK_DEF_ARN${NC}"
else
    echo -e "${RED}❌ Failed to register new task definition${NC}"
    exit 1
fi

# Step 4: Update ECS service with new task definition
echo -e "${BLUE}🔄 Updating ECS service with new task definition...${NC}"
aws ecs update-service \
    --cluster vpbank-kmult-cluster \
    --service vpbank-kmult-backend \
    --task-definition $NEW_TASK_DEF_ARN \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ECS service update initiated${NC}"
else
    echo -e "${RED}❌ Failed to update ECS service${NC}"
    exit 1
fi

# Step 5: Wait for deployment to complete
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
echo "This may take 3-5 minutes..."

for i in {1..20}; do
    DEPLOYMENT_STATUS=$(aws ecs describe-services --cluster vpbank-kmult-cluster --services vpbank-kmult-backend --region us-east-1 --query 'services[0].deployments[0].status' --output text)
    RUNNING_COUNT=$(aws ecs describe-services --cluster vpbank-kmult-cluster --services vpbank-kmult-backend --region us-east-1 --query 'services[0].runningCount' --output text)
    
    echo -e "${BLUE}[$i/20] Deployment Status: $DEPLOYMENT_STATUS | Running Tasks: $RUNNING_COUNT${NC}"
    
    if [ "$DEPLOYMENT_STATUS" = "PRIMARY" ] && [ "$RUNNING_COUNT" = "1" ]; then
        echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
        break
    fi
    
    sleep 30
done

# Step 6: Test APIs after deployment
echo -e "${BLUE}🧪 Testing APIs after deployment...${NC}"
sleep 60  # Wait for service to be fully ready

echo -e "${BLUE}Testing health check...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com/mutil_agent/public/api/v1/health-check/health)

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Health check: OK${NC}"
    
    echo -e "${BLUE}Testing document summary API...${NC}"
    SUMMARY_RESPONSE=$(curl -s -X POST -F "file=@/home/ubuntu/multi-agent-hackathon/data/test_document.txt" -F "summary_type=general" -F "language=vietnamese" http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com/mutil_agent/api/v1/text/summary/document)
    
    if echo "$SUMMARY_RESPONSE" | grep -q '"status":"success"'; then
        echo -e "${GREEN}✅ Document summary API: WORKING${NC}"
        echo -e "${BLUE}Sample response:${NC}"
        echo "$SUMMARY_RESPONSE" | jq '.data.summary' | head -3
    else
        echo -e "${RED}❌ Document summary API still has issues${NC}"
        echo "Response: $SUMMARY_RESPONSE"
    fi
else
    echo -e "${RED}❌ Health check failed: $HEALTH_STATUS${NC}"
fi

# Cleanup
rm -f /tmp/new-task-definition.json

echo ""
echo -e "${GREEN}🎉 AWS API Fix Process Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "• New task definition registered with AI service configuration"
echo "• ECS service updated with proper environment variables"
echo "• Secrets manager integration configured"
echo "• Health checks and API testing completed"
echo ""
echo "🔗 Links:"
echo "• Application: http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com"
echo "• Health Check: http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com/mutil_agent/public/api/v1/health-check/health"
echo "• ECS Service: https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/vpbank-kmult-cluster/services/vpbank-kmult-backend"
