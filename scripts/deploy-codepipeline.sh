#!/bin/bash

# Deploy VPBank K-MULT CodePipeline with GitHub Source
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying VPBank K-MULT CodePipeline${NC}"
echo "=============================================="

# Configuration
STACK_NAME="vpbank-kmult-codepipeline"
TEMPLATE_FILE="/home/ubuntu/multi-agent-hackathon/infrastructure/codepipeline-github.yml"
AWS_REGION="us-east-1"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "• Stack Name: $STACK_NAME"
echo "• Template: $TEMPLATE_FILE"
echo "• Region: $AWS_REGION"
echo ""

# Step 1: Validate template
echo -e "${BLUE}✅ Validating CloudFormation template...${NC}"
aws cloudformation validate-template --template-body file://$TEMPLATE_FILE --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Template validation successful${NC}"
else
    echo -e "${RED}❌ Template validation failed${NC}"
    exit 1
fi

# Step 2: Check if GitHub token exists in Secrets Manager
echo -e "${BLUE}🔍 Checking GitHub token in Secrets Manager...${NC}"
if aws secretsmanager describe-secret --secret-id github-token --region $AWS_REGION >/dev/null 2>&1; then
    echo -e "${GREEN}✅ GitHub token found in Secrets Manager${NC}"
else
    echo -e "${RED}❌ GitHub token not found in Secrets Manager${NC}"
    echo -e "${YELLOW}💡 Run: ./scripts/setup-github-token-secret.sh${NC}"
    exit 1
fi

# Step 3: Deploy or update stack
echo -e "${BLUE}🔨 Deploying CodePipeline stack...${NC}"

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query 'Stacks[0].StackName' --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$STACK_EXISTS" = "NOT_FOUND" ]; then
    echo -e "${BLUE}🆕 Creating new stack: $STACK_NAME${NC}"
    
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameters \
            ParameterKey=GitHubOwner,ParameterValue=ngcuyen \
            ParameterKey=GitHubRepo,ParameterValue=multi-agent-hackathon \
            ParameterKey=GitHubBranch,ParameterValue=main \
        --region $AWS_REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack creation initiated${NC}"
        
        echo -e "${BLUE}⏳ Waiting for stack creation to complete...${NC}"
        aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $AWS_REGION
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Stack created successfully!${NC}"
        else
            echo -e "${RED}❌ Stack creation failed or timed out${NC}"
            
            # Get stack events for debugging
            echo -e "${BLUE}📋 Recent stack events:${NC}"
            aws cloudformation describe-stack-events --stack-name $STACK_NAME --region $AWS_REGION --query 'StackEvents[0:5].[Timestamp,ResourceStatus,ResourceStatusReason]' --output table
            exit 1
        fi
    else
        echo -e "${RED}❌ Failed to initiate stack creation${NC}"
        exit 1
    fi
    
else
    echo -e "${YELLOW}⚠️  Stack exists, updating: $STACK_NAME${NC}"
    
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameters \
            ParameterKey=GitHubOwner,ParameterValue=ngcuyen \
            ParameterKey=GitHubRepo,ParameterValue=multi-agent-hackathon \
            ParameterKey=GitHubBranch,ParameterValue=main \
        --region $AWS_REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack update initiated${NC}"
        
        echo -e "${BLUE}⏳ Waiting for stack update to complete...${NC}"
        aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $AWS_REGION
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Stack updated successfully!${NC}"
        else
            echo -e "${RED}❌ Stack update failed or timed out${NC}"
            exit 1
        fi
    else
        # Check if no updates needed
        if [[ $? -eq 255 ]]; then
            echo -e "${YELLOW}⚠️  No updates needed${NC}"
        else
            echo -e "${RED}❌ Failed to initiate stack update${NC}"
            exit 1
        fi
    fi
fi

# Step 4: Get stack outputs
echo -e "${BLUE}📊 Getting stack outputs...${NC}"
PIPELINE_NAME=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`PipelineName`].OutputValue' --output text)
PIPELINE_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`PipelineUrl`].OutputValue' --output text)
ARTIFACTS_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query 'Stacks[0].Outputs[?OutputKey==`ArtifactsBucket`].OutputValue' --output text)

# Step 5: Start initial pipeline execution
echo -e "${BLUE}🚀 Starting initial pipeline execution...${NC}"
EXECUTION_ID=$(aws codepipeline start-pipeline-execution --name $PIPELINE_NAME --region $AWS_REGION --query 'pipelineExecutionId' --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pipeline execution started: $EXECUTION_ID${NC}"
else
    echo -e "${YELLOW}⚠️  Could not start pipeline execution (may start automatically)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CodePipeline Deployment Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "• Pipeline Name: $PIPELINE_NAME"
echo "• Artifacts Bucket: $ARTIFACTS_BUCKET"
echo "• Execution ID: $EXECUTION_ID"
echo ""
echo "🔗 Links:"
echo "• Pipeline Console: $PIPELINE_URL"
echo "• CodeBuild Project: https://console.aws.amazon.com/codesuite/codebuild/projects/VPBankKMult-Pipeline-Build"
echo "• S3 Artifacts: https://console.aws.amazon.com/s3/buckets/$ARTIFACTS_BUCKET"
echo ""
echo -e "${BLUE}🚀 Pipeline Features:${NC}"
echo "• ✅ Automatic trigger on GitHub push"
echo "• ✅ Multi-stage: Source → Build → Deploy"
echo "• ✅ Docker image build and push to ECR"
echo "• ✅ ECS service deployment"
echo "• ✅ Artifact storage and versioning"
echo ""
echo -e "${GREEN}✅ Push code to GitHub will now trigger the full CI/CD pipeline!${NC}"
