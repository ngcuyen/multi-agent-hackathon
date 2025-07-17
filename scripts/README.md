# 🚀 VPBank K-MULT CI/CD Scripts

This directory contains automation scripts for managing the VPBank K-MULT CI/CD pipeline.

## 📋 Available Scripts

### 🎯 Main Management Script
- **`manage-cicd.sh`** - Central management script for all CI/CD operations

### 🔧 Individual Scripts
- **`check-pipeline-status.sh`** - Check status of all CI/CD components
- **`deploy-local-build.sh`** - Build and push Docker image locally
- **`deploy-with-codebuild.sh`** - Deploy using AWS CodeBuild
- **`setup-github-credentials.sh`** - Setup GitHub authentication for CodeBuild
- **`create-s3-source-build.sh`** - Create S3-based CodeBuild project

## 🚀 Quick Start

### Check Pipeline Status
```bash
./scripts/manage-cicd.sh status
```

### Build and Deploy Locally
```bash
./scripts/manage-cicd.sh build-local
```

### Deploy CloudFormation Stack
```bash
./scripts/manage-cicd.sh deploy-stack
```

### View Help
```bash
./scripts/manage-cicd.sh help
```

## 📊 Pipeline Components

### ✅ Working Components
- **CodeBuild Project**: `VPBankKMult-Build`
- **ECR Repository**: `vpbank-kmult-backend`
- **IAM Role**: `VPBankKMult-CodeBuild-Role`
- **GitHub Actions**: 2 workflows configured

### 🔧 Component Details

#### CodeBuild Project
- **Name**: VPBankKMult-Build
- **Source**: GitHub repository
- **Environment**: Amazon Linux 2, Docker enabled
- **Build Spec**: `buildspec.yml`

#### ECR Repository
- **Name**: vpbank-kmult-backend
- **Region**: us-east-1
- **Images**: 5 stored images
- **Latest Tag**: `local-20250717-153038`

#### IAM Role
- **Name**: VPBankKMult-CodeBuild-Role
- **Permissions**: ECR push, CloudWatch logs, S3 access

## 🛠️ Usage Examples

### 1. Check Current Status
```bash
# Check all components
./scripts/manage-cicd.sh status

# Individual status check
./scripts/check-pipeline-status.sh
```

### 2. Local Development Build
```bash
# Build and push to ECR locally
./scripts/manage-cicd.sh build-local

# Direct script execution
./scripts/deploy-local-build.sh
```

### 3. CodeBuild Deployment
```bash
# Start CodeBuild (requires GitHub credentials)
./scripts/manage-cicd.sh build-codebuild

# Setup GitHub credentials first
./scripts/manage-cicd.sh setup-github
```

### 4. Infrastructure Management
```bash
# Deploy CloudFormation stack
./scripts/manage-cicd.sh deploy-stack

# Clean up resources
./scripts/manage-cicd.sh cleanup
```

## 🔐 Authentication Requirements

### AWS Credentials
- AWS CLI configured with appropriate permissions
- Access to ECR, CodeBuild, IAM, CloudFormation

### GitHub Access (for CodeBuild)
- Personal Access Token with `repo` scope
- Configure using: `./scripts/manage-cicd.sh setup-github`

## 📈 Build Process

### Local Build Flow
1. **Login to ECR** - Authenticate Docker with ECR
2. **Build Image** - Build Docker image using `Dockerfile.prod`
3. **Tag Image** - Tag with timestamp and `latest`
4. **Push to ECR** - Upload to ECR repository
5. **Cleanup** - Remove local images

### CodeBuild Flow
1. **Source Download** - Clone from GitHub
2. **Environment Setup** - Provision build environment
3. **Build Execution** - Run `buildspec.yml` commands
4. **Artifact Storage** - Store build outputs
5. **Notification** - Send build status

## 🔗 Useful Links

### AWS Console Links
- [CodeBuild Projects](https://console.aws.amazon.com/codesuite/codebuild/projects)
- [ECR Repositories](https://console.aws.amazon.com/ecr/repositories)
- [CloudFormation Stacks](https://console.aws.amazon.com/cloudformation/home?region=us-east-1)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups)

### GitHub Actions
- [Workflow Runs](https://github.com/ngcuyen/multi-agent-hackathon/actions)
- [Repository Settings](https://github.com/ngcuyen/multi-agent-hackathon/settings)

## 🐛 Troubleshooting

### Common Issues

#### 1. CodeBuild Authentication Error
```
Error: authentication required for primary source
```
**Solution**: Setup GitHub credentials
```bash
./scripts/manage-cicd.sh setup-github
```

#### 2. Docker Build Fails
```
Error: failed to read dockerfile
```
**Solution**: Ensure `Dockerfile.prod` exists in backend directory

#### 3. ECR Push Permission Denied
```
Error: denied: User is not authorized
```
**Solution**: Check AWS credentials and IAM permissions

#### 4. CloudFormation Stack Exists
```
Error: Stack already exists
```
**Solution**: Use update instead of create, or delete existing stack

### Debug Commands
```bash
# Check Docker daemon
docker info

# Verify AWS credentials
aws sts get-caller-identity

# Test ECR login
aws ecr get-login-password --region us-east-1

# Check CodeBuild logs
./scripts/manage-cicd.sh logs
```

## 📝 Script Maintenance

### Adding New Scripts
1. Create script in `/scripts/` directory
2. Make executable: `chmod +x script-name.sh`
3. Add to `manage-cicd.sh` if needed
4. Update this README

### Script Standards
- Use bash shebang: `#!/bin/bash`
- Set error handling: `set -e`
- Use color coding for output
- Include help/usage information
- Handle errors gracefully

## 🎯 Next Steps

1. **Setup GitHub Credentials** for CodeBuild
2. **Configure Webhooks** for automatic builds
3. **Add ECS Deployment** scripts
4. **Implement Blue/Green** deployment
5. **Add Monitoring** and alerting

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify AWS permissions and credentials
4. Check GitHub repository access

**Last Updated**: July 17, 2025
**Version**: 1.0.0
