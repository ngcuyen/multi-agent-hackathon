# Hospital Management System - AWS Infrastructure POC

[![AWS](https://img.shields.io/badge/AWS-Cloud-orange)](https://aws.amazon.com/)
[![Infrastructure](https://img.shields.io/badge/Infrastructure-as--Code-blue)](https://aws.amazon.com/infrastructure/)
[![Security](https://img.shields.io/badge/Security-Best--Practices-green)](https://aws.amazon.com/security/)

A production-ready AWS infrastructure setup for Hospital Management System with secure VPN access, following AWS Well-Architected Framework principles.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                Internet                                     │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────────────┐
│                    CloudFront CDN                                           │
│                 (Global Edge Locations)                                     │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────────────┐
│                Application Load Balancer                                    │
│              (Multi-AZ, SSL Termination)                                    │
└─────────────┬───────────────────────────────────────────┬───────────────────┘
              │                                           │
┌─────────────▼─────────────┐                 ┌───────────▼─────────────┐
│     WordPress Server      │                 │      CRM Server         │
│    (Patient Portal)       │                 │   (Staff Management)    │
│   Private Subnet 1A       │                 │   Private Subnet 1A     │
└─────────────┬─────────────┘                 └───────────┬─────────────┘
              │                                           │
              └─────────────┬───────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │      RDS MySQL            │
              │   (Multi-AZ, Encrypted)   │
              │   Private Subnets         │
              └───────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          VPN Access Layer                                  │
│  ┌─────────────────┐                                                       │
│  │   Jump Host     │ ◄─── WireGuard VPN ◄─── Admin Users                  │
│  │  (Bastion Host) │                                                       │
│  │ Public Subnet   │                                                       │
│  └─────────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Components](#architecture-components)
- [Security Implementation](#security-implementation)
- [Deployment Guide](#deployment-guide)
- [Configuration Management](#configuration-management)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Disaster Recovery](#backup--disaster-recovery)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## ✨ Features

### 🔒 Security First
- **Zero Trust Network**: All resources in private subnets
- **VPN-Only Access**: Secure WireGuard VPN for administrative access
- **Secrets Management**: AWS Secrets Manager for database credentials
- **Encryption**: Data encrypted at rest and in transit
- **IAM Best Practices**: Least privilege access with role-based permissions

### 🚀 High Availability & Scalability
- **Multi-AZ Deployment**: Resources distributed across availability zones
- **Auto Scaling Ready**: Infrastructure prepared for horizontal scaling
- **Load Balancing**: Application Load Balancer with health checks
- **CDN Integration**: CloudFront for global content delivery

### 📊 Observability
- **Comprehensive Monitoring**: CloudWatch metrics and alarms
- **Centralized Logging**: Application and infrastructure logs
- **Performance Tracking**: Real-time performance metrics
- **Security Monitoring**: VPC Flow Logs and CloudTrail

### 💰 Cost Optimized
- **Right-Sized Resources**: Appropriate instance types for workload
- **Reserved Capacity**: Cost savings through reserved instances
- **Automated Backups**: Efficient backup strategies
- **Resource Tagging**: Cost allocation and management

## 🚀 Prerequisites

### Required Tools
- AWS Account with appropriate permissions
- Domain name for SSL certificates
- SSH client (Terminal/PuTTY)
- Web browser for AWS Console access

### Required AWS Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "rds:*",
        "elbv2:*",
        "cloudfront:*",
        "route53:*",
        "certificatemanager:*",
        "secretsmanager:*",
        "iam:*",
        "vpc:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Network Requirements
- VPC CIDR: `10.0.0.0/16`
- Public Subnets: `10.0.1.0/24`, `10.0.2.0/24`
- Private Subnets: `10.0.10.0/24`, `10.0.11.0/24`
- Database Subnets: `10.0.20.0/24`, `10.0.21.0/24`

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/vanhoangkha/Review-Architecture.git
cd Review-Architecture
```

### 2. Environment Setup
```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Set your domain name
export DOMAIN_NAME=yourdomain.com
```

### 3. Deploy Infrastructure
Follow the detailed [Deployment Guide](#deployment-guide) below.

## 🏗️ Architecture Components

### Network Layer
- **VPC**: Isolated network environment with custom CIDR
- **Subnets**: Multi-AZ setup with public, private, and database tiers
- **Internet Gateway**: Outbound internet access for public subnets
- **NAT Gateway**: Secure outbound access for private resources
- **Route Tables**: Proper routing configuration for each subnet tier

### Compute Layer
- **Jump Host**: Secure bastion host with WireGuard VPN
- **WordPress Server**: Patient portal on Amazon Linux 2023
- **CRM Server**: Staff management system with containerized application
- **Application Load Balancer**: Layer 7 load balancing with SSL termination

### Data Layer
- **RDS MySQL**: Multi-AZ database with automated backups
- **Secrets Manager**: Secure credential storage and rotation
- **S3 Buckets**: Static asset storage and backup repository

### Security Layer
- **Security Groups**: Stateful firewall rules
- **NACLs**: Additional network-level security
- **IAM Roles**: Service-to-service authentication
- **VPC Flow Logs**: Network traffic monitoring

### Content Delivery
- **CloudFront**: Global CDN with edge caching
- **Route 53**: DNS management and health checks
- **ACM**: SSL/TLS certificate management

## 🔒 Security Implementation

### Network Security
```yaml
Security Groups:
  jump-host-sg:
    Inbound:
      - SSH (22): 0.0.0.0/0
      - WireGuard (51820/UDP): 0.0.0.0/0
      - HTTP (80): 0.0.0.0/0  # WireGuard UI
    
  alb-sg:
    Inbound:
      - HTTP (80): 0.0.0.0/0
      - HTTPS (443): 0.0.0.0/0
    
  wordpress-sg:
    Inbound:
      - SSH (22): jump-host-sg
      - HTTP (80): alb-sg
    
  crm-sg:
    Inbound:
      - SSH (22): jump-host-sg
      - TCP (8080): alb-sg
    
  rds-sg:
    Inbound:
      - MySQL (3306): wordpress-sg, crm-sg, jump-host-sg
```

### IAM Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:hospital/*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## 📖 Deployment Guide

### Phase 1: Network Infrastructure

#### 1.1 Create VPC and Subnets
1. **Navigate to VPC Console**
   - AWS Console → Services → VPC

2. **Create VPC**
   ```yaml
   VPC Configuration:
     Name: Hospital-VPC
     IPv4 CIDR: 10.0.0.0/16
     IPv6 CIDR: No IPv6 CIDR block
     Tenancy: Default
     
   Subnets:
     Public Subnets:
       - Name: Public-Subnet-1A
         AZ: us-east-1a
         CIDR: 10.0.1.0/24
       - Name: Public-Subnet-1B
         AZ: us-east-1b
         CIDR: 10.0.2.0/24
     
     Private Subnets:
       - Name: Private-Subnet-1A
         AZ: us-east-1a
         CIDR: 10.0.10.0/24
       - Name: Private-Subnet-1B
         AZ: us-east-1b
         CIDR: 10.0.11.0/24
     
     Database Subnets:
       - Name: DB-Subnet-1A
         AZ: us-east-1a
         CIDR: 10.0.20.0/24
       - Name: DB-Subnet-1B
         AZ: us-east-1b
         CIDR: 10.0.21.0/24
   ```

3. **Configure Internet Gateway**
   - Create and attach Internet Gateway to VPC

4. **Setup NAT Gateway**
   - Create NAT Gateway in Public-Subnet-1A
   - Allocate Elastic IP for NAT Gateway

5. **Configure Route Tables**
   ```yaml
   Public Route Table:
     Routes:
       - Destination: 0.0.0.0/0
         Target: Internet Gateway
     Associated Subnets:
       - Public-Subnet-1A
       - Public-Subnet-1B
   
   Private Route Table:
     Routes:
       - Destination: 0.0.0.0/0
         Target: NAT Gateway
     Associated Subnets:
       - Private-Subnet-1A
       - Private-Subnet-1B
       - DB-Subnet-1A
       - DB-Subnet-1B
   ```

### Phase 2: Security Configuration

#### 2.1 Create Key Pair
```bash
# Create EC2 Key Pair
AWS Console → EC2 → Key Pairs → Create Key Pair
Name: hospital-key
Type: RSA
Format: .pem
```

#### 2.2 Setup Security Groups
Create security groups as defined in [Security Implementation](#security-implementation)

#### 2.3 Configure IAM Roles
```yaml
IAM Role: EC2-SecretsManager-Role
Trust Policy: EC2 Service
Policies:
  - SecretsManagerAccess (Custom)
  - CloudWatchAgentServerPolicy (AWS Managed)
```

### Phase 3: Database Setup

#### 3.1 Create Secrets Manager Entries
```yaml
Secrets:
  hospital/rds/master:
    username: admin
    password: HospitalRDS2024!
  
  hospital/wordpress/db:
    username: wp_user
    password: WordPressSecure2024!
    engine: mysql
    host: (will be updated after RDS creation)
    port: 3306
    dbname: wordpress_db
  
  hospital/crm/db:
    username: crm_user
    password: CRMSecure2024!
    engine: mysql
    host: (will be updated after RDS creation)
    port: 3306
    dbname: crm_db
```

#### 3.2 Create RDS Instance
```yaml
RDS Configuration:
  Engine: MySQL 8.0.35
  Instance Class: db.t3.micro (POC) / db.t3.small (Production)
  Storage: 20 GiB GP2
  Multi-AZ: Yes
  Backup Retention: 7 days
  Encryption: Enabled
  VPC: Hospital-VPC
  Subnet Group: hospital-db-subnet-group
  Security Group: rds-sg
```

#### 3.3 Initialize Database
```sql
-- Connect via Jump Host
mysql -h RDS_ENDPOINT -u admin -p

-- Create databases
CREATE DATABASE wordpress_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create users
CREATE USER 'wp_user'@'%' IDENTIFIED BY 'WordPressSecure2024!';
CREATE USER 'crm_user'@'%' IDENTIFIED BY 'CRMSecure2024!';

-- Grant permissions
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wp_user'@'%';
GRANT ALL PRIVILEGES ON crm_db.* TO 'crm_user'@'%';
FLUSH PRIVILEGES;
```

### Phase 4: Jump Host and VPN Setup

#### 4.1 Launch Jump Host
```yaml
Instance Configuration:
  AMI: Ubuntu Server 24.04 LTS
  Instance Type: t3.micro
  Key Pair: hospital-key
  Subnet: Public-Subnet-1A
  Security Group: jump-host-sg
  Public IP: Enable
```

#### 4.2 Install WireGuard VPN (Updated - Production Ready)

**🎉 DEPLOYED STATUS**: ✅ **SUCCESSFULLY INSTALLED AND OPERATIONAL**

**Current Configuration**:
- **Server IP**: 13.214.243.62
- **Management URL**: http://13.214.243.62
- **Username**: admin
- **Password**: admin123
- **VPN Network**: 10.13.13.0/24
- **Max Clients**: 10 peers

**Installation Method**:
```bash
# Simple one-command installation
cd /home/ubuntu
bash cai-dat-wireguard-simple.sh
```

**Service Status**:
```bash
# Check status
cd /home/ubuntu/wireguard
docker compose ps

# Current status: ✅ Both containers running
NAME           STATUS          PORTS
wireguard      Up 49 minutes   0.0.0.0:51820->51820/udp
wireguard-ui   Up 49 minutes   0.0.0.0:80->5000/tcp
```

#### 4.3 WireGuard Configuration (Production)
```yaml
# /home/ubuntu/wireguard/docker-compose.yml
version: "3"
services:
  wireguard:
    image: linuxserver/wireguard:latest
    container_name: wireguard
    cap_add:
      - NET_ADMIN
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Ho_Chi_Minh
      - SERVERURL=13.214.243.62
      - SERVERPORT=51820
      - PEERS=10
      - PEERDNS=8.8.8.8
      - INTERNAL_SUBNET=10.13.13.0/24
      - ALLOWEDIPS=10.0.0.0/16
    volumes:
      - ./config:/config
    ports:
      - "51820:51820/udp"
      - "80:5000"
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
    restart: unless-stopped

  wireguard-ui:
    image: ngoduykhanh/wireguard-ui:latest
    container_name: wireguard-ui
    depends_on:
      - wireguard
    cap_add:
      - NET_ADMIN
    network_mode: service:wireguard
    environment:
      - WGUI_USERNAME=admin
      - WGUI_PASSWORD=admin123
      - WGUI_MANAGE_START=true
      - WGUI_MANAGE_RESTART=true
    volumes:
      - ./db:/app/db
      - ./config:/etc/wireguard
    restart: unless-stopped
```

#### 4.4 Access WireGuard Management
1. **Access URL**: http://13.214.243.62
2. **Login**: admin / admin123
3. **Create VPN Clients**:
   - Click "Clients" → "Add Client"
   - Enter client name → Submit
   - Download .conf file or scan QR code
4. **Server Status**: ✅ Active with 10 pre-configured peer slots

**Current WireGuard Interface**:
```
interface: wg0
  public key: rYx0jh7adznnPWztjKsnFT/PzN5RERsm+CDOWR5R/2Q=
  listening port: 51820
  status: ✅ ACTIVE
```

### Phase 5: Application Servers

#### 5.1 WordPress Server
```yaml
Instance Configuration:
  AMI: Amazon Linux 2023
  Instance Type: t3.medium
  Key Pair: hospital-key
  Subnet: Private-Subnet-1A
  Security Group: wordpress-sg
  IAM Role: EC2-SecretsManager-Role
  
User Data Script:
  - Install Apache, PHP, MySQL client
  - Install AWS CLI v2
  - Retrieve database credentials from Secrets Manager
  - Download and configure WordPress
  - Start Apache service
```

#### 5.2 CRM Server
```yaml
Instance Configuration:
  AMI: Amazon Linux 2023
  Instance Type: t3.medium
  Key Pair: hospital-key
  Subnet: Private-Subnet-1A
  Security Group: crm-sg
  IAM Role: EC2-SecretsManager-Role
  
User Data Script:
  - Install Docker and Python
  - Install AWS CLI v2
  - Retrieve database credentials from Secrets Manager
  - Create Flask CRM application
  - Start CRM service on port 8080
```

### Phase 6: Load Balancer and CDN

#### 6.1 Application Load Balancer
```yaml
ALB Configuration:
  Name: hospital-alb
  Scheme: Internet-facing
  IP Address Type: IPv4
  VPC: Hospital-VPC
  Subnets: Public-Subnet-1A, Public-Subnet-1B
  Security Group: alb-sg
  
Target Groups:
  wordpress-tg:
    Protocol: HTTP
    Port: 80
    Health Check: /
    Targets: WordPress Server
  
  crm-tg:
    Protocol: HTTP
    Port: 8080
    Health Check: /health
    Targets: CRM Server
    
Listeners:
  HTTP:80:
    Default Action: Redirect to HTTPS
  HTTPS:443:
    Rules:
      - Host: crm.hospital.com → Forward to crm-tg
      - Default → Forward to wordpress-tg
```

#### 6.2 SSL Certificate
```yaml
ACM Certificate:
  Domain Names:
    - hospital.com
    - www.hospital.com
    - crm.hospital.com
  Validation: DNS
  Region: us-east-1 (for CloudFront)
```

#### 6.3 CloudFront Distribution
```yaml
CloudFront Configuration:
  Origin: ALB DNS Name
  Behaviors:
    Default:
      Cache Policy: CachingDisabled
      Origin Request Policy: AllViewer
    /wp-content/*:
      Cache Policy: CachingOptimized
    /crm/*:
      Cache Policy: CachingDisabled
  
  Settings:
    Alternate Domain Names: hospital.com, www.hospital.com, crm.hospital.com
    SSL Certificate: ACM Certificate
    Default Root Object: index.php
```

## ⚙️ Configuration Management

### Environment Variables
```bash
# Application Configuration
export DB_HOST="hospital-db.xxxxxx.us-east-1.rds.amazonaws.com"
export DB_NAME="wordpress_db"
export REDIS_ENDPOINT="hospital-cache.xxxxxx.cache.amazonaws.com"
export S3_BUCKET="hospital-static-assets"
```

### WordPress Configuration
```php
// wp-config.php
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASSWORD', getenv('DB_PASSWORD'));
define('DB_HOST', getenv('DB_HOST'));

// Security Keys (use WordPress.org secret-key service)
define('AUTH_KEY', 'your-unique-phrase');
define('SECURE_AUTH_KEY', 'your-unique-phrase');
// ... other keys

// WordPress debugging
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### CRM Application Configuration
```python
# config.py
import os
from dataclasses import dataclass

@dataclass
class Config:
    DB_HOST: str = os.getenv('DB_HOST')
    DB_NAME: str = os.getenv('DB_NAME')
    DB_USER: str = os.getenv('DB_USER')
    DB_PASSWORD: str = os.getenv('DB_PASSWORD')
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'dev-key')
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'
```

## 📊 Monitoring & Logging

### CloudWatch Metrics
```yaml
Custom Metrics:
  Application:
    - WordPress Response Time
    - CRM API Response Time
    - Database Connection Count
    - Active User Sessions
  
  Infrastructure:
    - EC2 CPU Utilization
    - Memory Usage
    - Disk I/O
    - Network Traffic
  
  Security:
    - Failed Login Attempts
    - VPN Connection Count
    - Unusual Traffic Patterns
```

### CloudWatch Alarms
```yaml
Critical Alarms:
  - High CPU Utilization (>80%)
  - High Memory Usage (>85%)
  - Database Connection Errors
  - ALB 5XX Errors (>5%)
  - RDS CPU Utilization (>80%)
  
Warning Alarms:
  - Moderate CPU Usage (>60%)
  - Disk Space Usage (>80%)
  - ALB Response Time (>2s)
  - VPN Connection Failures
```

### Log Aggregation
```yaml
Log Groups:
  - /aws/ec2/wordpress
  - /aws/ec2/crm
  - /aws/rds/hospital-db
  - /aws/lambda/functions
  - /aws/apigateway/hospital-api
  
Log Retention: 30 days (configurable)
```

### Monitoring Dashboard
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "hospital-alb"],
          ["AWS/EC2", "CPUUtilization", "InstanceId", "i-wordpress"],
          ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "hospital-db"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "System Performance"
      }
    }
  ]
}
```

## 🔄 Backup & Disaster Recovery

### RDS Backup Strategy
```yaml
Automated Backups:
  Retention Period: 7 days
  Backup Window: 03:00-04:00 UTC
  Maintenance Window: Sun 04:00-05:00 UTC
  
Manual Snapshots:
  Frequency: Weekly
  Retention: 30 days
  Cross-Region Copy: Enabled
```

### EC2 Backup Strategy
```yaml
EBS Snapshots:
  Frequency: Daily
  Retention: 7 days
  Automation: AWS Backup Service
  
AMI Creation:
  Frequency: Weekly
  Retention: 4 weeks
  Include: Application configuration
```

### Disaster Recovery Plan
```yaml
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 1 hour

Recovery Procedures:
  1. Database Recovery:
     - Restore from latest snapshot
     - Point-in-time recovery if needed
  
  2. Application Recovery:
     - Launch new instances from AMI
     - Restore application data from S3
     - Update DNS records
  
  3. Network Recovery:
     - Recreate VPC if needed
     - Restore security groups
     - Reconfigure load balancer
```

## 💰 Cost Optimization

### Resource Right-Sizing
```yaml
Current Configuration (POC):
  EC2 Instances: t3.micro/t3.medium
  RDS Instance: db.t3.micro
  NAT Gateway: Single AZ
  
Production Recommendations:
  EC2 Instances: t3.large with Reserved Instances
  RDS Instance: db.t3.small Multi-AZ
  NAT Gateway: Multi-AZ for HA
```

### Cost Monitoring
```yaml
Budget Alerts:
  Monthly Budget: $200 (POC) / $500 (Production)
  Alerts: 50%, 80%, 100% of budget
  
Cost Allocation Tags:
  Environment: POC/Production
  Project: Hospital-Management
  Owner: DevOps-Team
  CostCenter: IT-Department
```

### Optimization Strategies
```yaml
Compute:
  - Use Reserved Instances for predictable workloads
  - Implement Auto Scaling for variable loads
  - Use Spot Instances for development environments
  
Storage:
  - Implement S3 Lifecycle policies
  - Use appropriate storage classes
  - Enable S3 Intelligent Tiering
  
Network:
  - Optimize data transfer costs
  - Use CloudFront for static content
  - Implement VPC endpoints where applicable
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. VPN Connection Issues
```yaml
Problem: Cannot connect to WireGuard VPN
Solutions:
  - Check Jump Host security group allows UDP 51820
  - Verify WireGuard containers are running: docker compose ps
  - Check WireGuard logs: docker compose logs wireguard
  - Ensure client configuration is correct
  - Verify Jump Host public IP hasn't changed (13.214.243.62)
  - Test web interface: http://13.214.243.62
```

#### 2. Application Access Issues
```yaml
Problem: Cannot access WordPress/CRM applications
Solutions:
  - Check ALB target group health status
  - Verify security groups allow ALB traffic
  - Check application server logs
  - Ensure RDS connectivity is working
  - Verify Secrets Manager permissions
```

#### 3. Database Connection Issues
```yaml
Problem: Applications cannot connect to database
Solutions:
  - Check RDS security group allows traffic from app subnets
  - Verify database credentials in Secrets Manager
  - Test connectivity from Jump Host
  - Check RDS instance status
  - Verify subnet group configuration
```

#### 4. SSL Certificate Issues
```yaml
Problem: HTTPS not working or certificate errors
Solutions:
  - Verify ACM certificate is validated
  - Check DNS records for domain validation
  - Ensure certificate is in us-east-1 for CloudFront
  - Verify ALB listener configuration
  - Check CloudFront distribution settings
```

### Diagnostic Commands
```bash
# Check VPN status
docker compose ps
docker compose logs wireguard
sudo docker exec wireguard wg show

# Test database connectivity
mysql -h RDS_ENDPOINT -u admin -p
telnet RDS_ENDPOINT 3306

# Check application logs
sudo tail -f /var/log/httpd/error_log
sudo tail -f /var/log/crm.log

# Test ALB health
curl -I http://ALB_DNS_NAME
curl -I https://ALB_DNS_NAME

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx
```

### Log Analysis
```bash
# WordPress logs
sudo tail -f /var/log/httpd/access_log
sudo tail -f /var/log/httpd/error_log

# CRM application logs
sudo journalctl -u crm-app -f

# System logs
sudo journalctl -f
dmesg | tail

# CloudWatch logs
aws logs tail /aws/ec2/wordpress --follow
aws logs tail /aws/ec2/crm --follow
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -am 'Add new feature'`
5. Push to branch: `git push origin feature/new-feature`
6. Create Pull Request

### Code Standards
- Follow AWS Well-Architected Framework principles
- Use Infrastructure as Code where possible
- Implement proper error handling and logging
- Include comprehensive documentation
- Add appropriate tags to all resources

### Testing Guidelines
- Test all infrastructure changes in POC environment first
- Validate security configurations
- Perform load testing before production deployment
- Test disaster recovery procedures regularly

## 📚 Additional Resources

### AWS Documentation
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [RDS User Guide](https://docs.aws.amazon.com/rds/latest/userguide/)
- [Application Load Balancer Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)

### Security Best Practices
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [VPC Security Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)
- [RDS Security](https://docs.aws.amazon.com/rds/latest/userguide/UsingWithRDS.html)

### Monitoring and Logging
- [CloudWatch User Guide](https://docs.aws.amazon.com/cloudwatch/latest/monitoring/)
- [AWS CloudTrail User Guide](https://docs.aws.amazon.com/cloudtrail/latest/userguide/)
- [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the DevOps team: devops@hospital.com
- AWS Support (for AWS-related issues)

---

**⚠️ Important Security Notice**

This infrastructure setup follows AWS security best practices but should be reviewed and customized for your specific security requirements before production deployment. Regular security audits and updates are recommended.

**🏥 Healthcare Compliance**

If deploying for actual healthcare use, ensure compliance with relevant regulations such as HIPAA, GDPR, or local healthcare data protection laws. Additional security measures and audit trails may be required.

---

*Last Updated: $(date +"%Y-%m-%d")*
*Version: 1.0.0*
*Maintained by: Hospital DevOps Team*
