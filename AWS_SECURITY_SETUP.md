# AWS Security Group Configuration Guide

## 📋 Mục Lục

- [Tổng Quan Security Groups](#tổng-quan-security-groups)
- [Cấu Hình Qua AWS Console](#cấu-hình-qua-aws-console)
- [Cấu Hình Qua AWS CLI](#cấu-hình-qua-aws-cli)
- [Cấu Hình Qua Terraform](#cấu-hình-qua-terraform)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🔒 Tổng Quan Security Groups

Security Groups hoạt động như firewall ảo cho EC2 instances, kiểm soát inbound và outbound traffic.

### Ports Cần Thiết cho WireGuard:

| Port | Protocol | Purpose | Source |
|------|----------|---------|---------|
| 22 | TCP | SSH Access | Your IP only |
| 80 | TCP | WireGuard UI | Your IP only (recommended) |
| 443 | TCP | HTTPS (optional) | 0.0.0.0/0 |
| 51820 | UDP | WireGuard VPN | 0.0.0.0/0 |

## 🖥️ Cấu Hình Qua AWS Console

### Bước 1: Truy Cập EC2 Dashboard

1. **Đăng nhập AWS Console**
2. **Chọn region** (ví dụ: ap-southeast-1)
3. **Vào EC2 Dashboard**
4. **Click "Security Groups"** trong menu bên trái

### Bước 2: Tìm Security Group của Instance

1. **Vào "Instances"** → Chọn EC2 instance của bạn
2. **Trong tab "Security"** → Note Security Group ID
3. **Quay lại "Security Groups"** → Tìm Security Group theo ID

### Bước 3: Cấu Hình Inbound Rules

1. **Chọn Security Group** → Tab "Inbound rules"
2. **Click "Edit inbound rules"**
3. **Thêm các rules sau:**

#### Rule 1: SSH Access
- **Type**: SSH
- **Protocol**: TCP
- **Port Range**: 22
- **Source**: My IP (hoặc Custom với IP cụ thể)
- **Description**: SSH access

#### Rule 2: WireGuard UI (HTTP)
- **Type**: HTTP
- **Protocol**: TCP
- **Port Range**: 80
- **Source**: My IP (khuyến nghị) hoặc Anywhere (0.0.0.0/0)
- **Description**: WireGuard UI access

#### Rule 3: WireGuard VPN
- **Type**: Custom UDP
- **Protocol**: UDP
- **Port Range**: 51820
- **Source**: Anywhere (0.0.0.0/0)
- **Description**: WireGuard VPN server

#### Rule 4: HTTPS (Optional)
- **Type**: HTTPS
- **Protocol**: TCP
- **Port Range**: 443
- **Source**: Anywhere (0.0.0.0/0)
- **Description**: HTTPS access

4. **Click "Save rules"**

### Bước 4: Verify Configuration

1. **Kiểm tra Inbound rules** đã được thêm
2. **Test connectivity** từ máy local
3. **Check WireGuard UI** accessibility

## 💻 Cấu Hình Qua AWS CLI

### Bước 1: Install và Configure AWS CLI

```bash
# Install AWS CLI (if not installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter: Access Key ID, Secret Access Key, Region, Output format
```

### Bước 2: Get Instance Information

```bash
# Get current instance ID
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
echo "Instance ID: $INSTANCE_ID"

# Get Security Group ID
SECURITY_GROUP_ID=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
    --output text \
    --region ap-southeast-1)
echo "Security Group ID: $SECURITY_GROUP_ID"

# Get current public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com/)
echo "Public IP: $PUBLIC_IP"

# Get your current IP for SSH/HTTP access
YOUR_IP=$(curl -s http://checkip.amazonaws.com/)
echo "Your IP: $YOUR_IP"
```

### Bước 3: Add Security Group Rules

```bash
# Set region
REGION="ap-southeast-1"

# Add SSH access (restrict to your IP)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr $YOUR_IP/32 \
    --region $REGION \
    --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Name,Value=SSH-Access}]'

# Add HTTP access for WireGuard UI (restrict to your IP - recommended)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr $YOUR_IP/32 \
    --region $REGION \
    --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Name,Value=WireGuard-UI}]'

# Add WireGuard VPN port (allow from anywhere)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol udp \
    --port 51820 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Name,Value=WireGuard-VPN}]'

# Add HTTPS access (optional)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Name,Value=HTTPS-Access}]'
```

### Bước 4: Verify Rules

```bash
# List all security group rules
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --region $REGION \
    --output table

# Check specific inbound rules
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --query 'SecurityGroups[0].IpPermissions[*].[IpProtocol,FromPort,ToPort,IpRanges[0].CidrIp]' \
    --output table \
    --region $REGION
```

### Bước 5: Create Automated Script

```bash
# Create security group configuration script
cat > ~/configure-security-group.sh << 'EOF'
#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Configuration
REGION="ap-southeast-1"

# Get instance information
log "Getting instance information..."
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
SECURITY_GROUP_ID=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
    --output text \
    --region $REGION)
YOUR_IP=$(curl -s http://checkip.amazonaws.com/)

log "Instance ID: $INSTANCE_ID"
log "Security Group ID: $SECURITY_GROUP_ID"
log "Your IP: $YOUR_IP"

# Function to add security group rule
add_rule() {
    local protocol=$1
    local port=$2
    local cidr=$3
    local description=$4
    
    log "Adding rule: $protocol/$port from $cidr"
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol $protocol \
        --port $port \
        --cidr $cidr \
        --region $REGION 2>/dev/null || warn "Rule may already exist: $protocol/$port"
}

# Add rules
add_rule "tcp" "22" "$YOUR_IP/32" "SSH Access"
add_rule "tcp" "80" "$YOUR_IP/32" "WireGuard UI"
add_rule "udp" "51820" "0.0.0.0/0" "WireGuard VPN"
add_rule "tcp" "443" "0.0.0.0/0" "HTTPS Access"

log "Security group configuration completed!"

# Display current rules
log "Current security group rules:"
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --query 'SecurityGroups[0].IpPermissions[*].[IpProtocol,FromPort,ToPort,IpRanges[0].CidrIp]' \
    --output table \
    --region $REGION
EOF

chmod +x ~/configure-security-group.sh

# Run the script
~/configure-security-group.sh
```

## 🏗️ Cấu Hình Qua Terraform

### Bước 1: Create Terraform Configuration

```bash
# Create Terraform directory
mkdir -p ~/terraform-wireguard
cd ~/terraform-wireguard

# Create main.tf
cat > main.tf << 'EOF'
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source to get current IP
data "http" "current_ip" {
  url = "http://checkip.amazonaws.com/"
}

locals {
  current_ip = chomp(data.http.current_ip.response_body)
}

# Security Group for WireGuard
resource "aws_security_group" "wireguard" {
  name_prefix = "wireguard-vpn-"
  description = "Security group for WireGuard VPN server"

  # SSH access from your IP only
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${local.current_ip}/32"]
    description = "SSH access from current IP"
  }

  # WireGuard UI access from your IP only
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["${local.current_ip}/32"]
    description = "WireGuard UI access from current IP"
  }

  # WireGuard VPN access from anywhere
  ingress {
    from_port   = 51820
    to_port     = 51820
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "WireGuard VPN access"
  }

  # HTTPS access from anywhere (optional)
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "WireGuard VPN Security Group"
    Environment = var.environment
    Project     = "WireGuard"
  }
}

# Output security group ID
output "security_group_id" {
  value       = aws_security_group.wireguard.id
  description = "ID of the WireGuard security group"
}

output "current_ip" {
  value       = local.current_ip
  description = "Current public IP address"
}
EOF

# Create variables.tf
cat > variables.tf << 'EOF'
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}
EOF

# Create terraform.tfvars
cat > terraform.tfvars << 'EOF'
aws_region  = "ap-southeast-1"
environment = "development"
EOF
```

### Bước 2: Deploy Terraform Configuration

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply -auto-approve

# Get outputs
terraform output
```

## 🔐 Best Practices

### 1. Principle of Least Privilege

```bash
# Restrict HTTP access to your IP only
YOUR_IP=$(curl -s http://checkip.amazonaws.com/)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr $YOUR_IP/32 \
    --region ap-southeast-1
```

### 2. Use Named Security Groups

```bash
# Create dedicated security group for WireGuard
aws ec2 create-security-group \
    --group-name wireguard-vpn-sg \
    --description "WireGuard VPN Server Security Group" \
    --region ap-southeast-1
```

### 3. Tag Your Resources

```bash
# Add tags to security group
aws ec2 create-tags \
    --resources $SECURITY_GROUP_ID \
    --tags Key=Name,Value="WireGuard VPN" \
           Key=Environment,Value="Production" \
           Key=Project,Value="VPN Infrastructure" \
    --region ap-southeast-1
```

### 4. Regular Security Audits

```bash
# Create audit script
cat > ~/security-audit.sh << 'EOF'
#!/bin/bash

REGION="ap-southeast-1"

echo "=== Security Group Audit ==="
echo "Date: $(date)"
echo

# List all security groups
aws ec2 describe-security-groups \
    --query 'SecurityGroups[*].[GroupId,GroupName,Description]' \
    --output table \
    --region $REGION

echo
echo "=== Open Security Groups (0.0.0.0/0) ==="

# Find security groups with open access
aws ec2 describe-security-groups \
    --query 'SecurityGroups[?IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`]]].[GroupId,GroupName,IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`]].[IpProtocol,FromPort,ToPort]]' \
    --output table \
    --region $REGION
EOF

chmod +x ~/security-audit.sh
```

### 5. Backup Security Group Configuration

```bash
# Backup security group rules
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --region ap-southeast-1 \
    --output json > security-group-backup-$(date +%Y%m%d).json
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Cannot Access WireGuard UI

**Problem**: Browser shows "This site can't be reached"

**Solutions**:
```bash
# Check if port 80 is allowed in security group
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --query 'SecurityGroups[0].IpPermissions[?FromPort==`80`]' \
    --region ap-southeast-1

# Check your current IP
curl -s http://checkip.amazonaws.com/

# Update security group rule with new IP
aws ec2 revoke-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr OLD_IP/32 \
    --region ap-southeast-1

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr NEW_IP/32 \
    --region ap-southeast-1
```

#### 2. VPN Connection Fails

**Problem**: WireGuard client cannot connect

**Solutions**:
```bash
# Check if UDP port 51820 is allowed
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --query 'SecurityGroups[0].IpPermissions[?FromPort==`51820`]' \
    --region ap-southeast-1

# Test UDP connectivity
nc -u EC2_PUBLIC_IP 51820
```

#### 3. SSH Access Denied

**Problem**: Cannot SSH to instance

**Solutions**:
```bash
# Check SSH rule
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --query 'SecurityGroups[0].IpPermissions[?FromPort==`22`]' \
    --region ap-southeast-1

# Add SSH access for your current IP
YOUR_IP=$(curl -s http://checkip.amazonaws.com/)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr $YOUR_IP/32 \
    --region ap-southeast-1
```

### Debugging Commands

```bash
# List all security group rules
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --region ap-southeast-1

# Check instance security groups
aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups' \
    --region ap-southeast-1

# Test connectivity
telnet EC2_PUBLIC_IP 80
nc -zv EC2_PUBLIC_IP 80
nc -u EC2_PUBLIC_IP 51820
```

### Emergency Access Recovery

```bash
# If locked out, create temporary rule for emergency access
EMERGENCY_IP=$(curl -s http://checkip.amazonaws.com/)

# Add temporary SSH access
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr $EMERGENCY_IP/32 \
    --region ap-southeast-1

# Add temporary HTTP access
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr $EMERGENCY_IP/32 \
    --region ap-southeast-1
```

## 📚 Additional Resources

- [AWS Security Groups Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [AWS CLI Security Groups Reference](https://docs.aws.amazon.com/cli/latest/reference/ec2/describe-security-groups.html)
- [Terraform AWS Security Group Resource](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group)

---

**🔒 Security Reminder**: Luôn luôn áp dụng nguyên tắc "least privilege" - chỉ mở những port cần thiết và hạn chế access từ IP cụ thể khi có thể.
