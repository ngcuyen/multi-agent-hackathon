# 🏗️ VPBank K-MULT Agent Studio - Project Structure

## 📁 **Enterprise Project Organization**

```
vpbank-kmult-agent-studio/
├── 📋 README.md                           # Main project documentation
├── 📋 PROJECT_STATUS.md                   # Current project status
├── 📋 QUICKSTART.md                       # Quick start guide
├── 📋 PROJECT_STRUCTURE.md                # This file
├── 🔧 .gitignore                          # Git ignore rules
├── 🔧 .python-version                     # Python version specification
│
├── 📂 src/                                # Source Code
│   ├── 📂 backend/                        # Backend Services
│   │   ├── 📂 agents/                     # Multi-Agent System
│   │   ├── 📂 api/                        # REST API Services
│   │   ├── 📂 core/                       # Core Business Logic
│   │   └── 📂 utils/                      # Utility Functions
│   │
│   ├── 📂 frontend/                       # React Frontend Application
│   │   ├── 📂 src/                        # Frontend Source
│   │   │   ├── 📂 components/             # React Components
│   │   │   ├── 📂 pages/                  # Page Components
│   │   │   ├── 📂 services/               # API Services
│   │   │   └── 📂 types/                  # TypeScript Types
│   │   ├── 📂 public/                     # Static Assets
│   │   └── 📋 package.json                # Frontend Dependencies
│   │
│   ├── 📂 frontend-backup-main/           # Frontend Backup
│   │
│   ├── 📂 agents/                         # Specialized Banking Agents
│   │   ├── 📂 supervisor/                 # Supervisor Agent
│   │   ├── 📂 document-intelligence/      # Document Processing
│   │   ├── 📂 lc-processing/              # Letter of Credit
│   │   ├── 📂 credit-analysis/            # Credit Risk Assessment
│   │   ├── 📂 compliance/                 # Regulatory Compliance
│   │   ├── 📂 risk-assessment/            # Risk Analysis
│   │   └── 📂 decision-synthesis/         # Decision Making
│   │
│   ├── 📂 shared/                         # Shared Libraries
│   │   ├── 📂 models/                     # Data Models
│   │   ├── 📂 utils/                      # Common Utilities
│   │   └── 📂 constants/                  # Application Constants
│   │
│   ├── 📂 data/                           # Data Files
│   │   ├── 📂 samples/                    # Sample Data
│   │   ├── 📂 schemas/                    # Data Schemas
│   │   └── 📂 fixtures/                   # Test Fixtures
│   │
│   └── 📂 tools/                          # Development Tools
│       ├── 📂 generators/                 # Code Generators
│       ├── 📂 validators/                 # Data Validators
│       └── 📂 migrators/                  # Data Migration Tools
│
├── 📂 docs/                               # Documentation
│   ├── 📂 architecture/                   # Architecture Diagrams
│   │   ├── 🖼️ *.png                       # PNG Diagrams
│   │   └── 📐 *.drawio                    # Editable Diagrams
│   │
│   ├── 📂 api/                            # API Documentation
│   │   ├── 📋 openapi.yaml                # OpenAPI Specification
│   │   └── 📋 endpoints.md                # API Endpoints Guide
│   │
│   ├── 📂 user-guide/                     # User Documentation
│   │   ├── 📋 installation.md             # Installation Guide
│   │   ├── 📋 configuration.md            # Configuration Guide
│   │   └── 📋 troubleshooting.md          # Troubleshooting Guide
│   │
│   ├── 📂 examples/                       # Code Examples
│   │   ├── 📂 api-usage/                  # API Usage Examples
│   │   └── 📂 agent-configs/              # Agent Configuration Examples
│   │
│   ├── 📋 BANKING_COMPLIANCE.md           # Banking Compliance Guide
│   ├── 📋 SECURITY.md                     # Security Documentation
│   └── 📋 PERFORMANCE.md                  # Performance Guidelines
│
├── 📂 config/                             # Configuration Files
│   ├── 🔧 docker-compose.yml              # Docker Compose Configuration
│   ├── 🔧 task-definition.json            # ECS Task Definition
│   ├── 🔧 bedrock-policy.json             # AWS Bedrock Policy
│   ├── 🔧 bucket-policy.json              # S3 Bucket Policy
│   └── 🔧 *.json                          # Other Configuration Files
│
├── 📂 scripts/                            # Automation Scripts
│   ├── 🚀 setup.sh                        # Project Setup Script
│   ├── 🚀 run.sh                          # Application Runner
│   ├── 🚀 build.sh                        # Build Script
│   ├── 🚀 test.sh                         # Test Runner
│   ├── 🚀 deploy.sh                       # Deployment Script
│   └── 🚀 export-diagrams.sh              # Diagram Export Utility
│
├── 📂 tests/                              # Test Suite
│   ├── 📂 unit/                           # Unit Tests
│   ├── 📂 integration/                    # Integration Tests
│   ├── 📂 e2e/                            # End-to-End Tests
│   ├── 📂 performance/                    # Performance Tests
│   └── 📂 fixtures/                       # Test Data
│
├── 📂 deployments/                        # Deployment Configurations
│   ├── 📂 aws/                            # AWS Deployment
│   │   ├── 📂 cloudformation/             # CloudFormation Templates
│   │   ├── 📂 terraform/                  # Terraform Configurations
│   │   └── 📂 cdk/                        # AWS CDK Code
│   │
│   ├── 📂 docker/                         # Docker Configurations
│   │   ├── 🐳 Dockerfile                  # Main Dockerfile
│   │   └── 🐳 docker-compose.prod.yml     # Production Docker Compose
│   │
│   └── 📂 infrastructure/                 # Infrastructure as Code
│       ├── 📂 networking/                 # Network Configuration
│       ├── 📂 security/                   # Security Configuration
│       └── 📂 monitoring/                 # Monitoring Setup
│
├── 📂 monitoring/                         # Monitoring & Observability
│   ├── 📂 logs/                           # Application Logs
│   ├── 📂 metrics/                        # Performance Metrics
│   ├── 📂 alerts/                         # Alert Configurations
│   └── 📂 dashboards/                     # Monitoring Dashboards
│
├── 📂 assets/                             # Static Assets
│   ├── 📂 images/                         # Image Assets
│   ├── 📂 icons/                          # Icon Assets
│   └── 📂 fonts/                          # Font Assets
│
└── 📂 public/                             # Public Assets
    ├── 📂 static/                         # Static Files
    └── 📂 uploads/                        # Upload Directory
```

## 🎯 **Directory Purposes**

### **📂 src/** - Source Code
- **backend/**: FastAPI backend services and multi-agent system
- **frontend/**: React frontend application with banking interface
- **agents/**: Specialized banking agents (7 agents + Strands orchestration)
- **shared/**: Common libraries and utilities
- **data/**: Data files, schemas, and samples
- **tools/**: Development and utility tools

### **📂 docs/** - Documentation
- **architecture/**: Complete architecture diagrams (PNG + .drawio)
- **api/**: API documentation and specifications
- **user-guide/**: User and administrator guides
- **examples/**: Code examples and tutorials

### **📂 config/** - Configuration
- **docker-compose.yml**: Container orchestration
- **task-definition.json**: ECS task configuration
- ***.json**: AWS policies and configurations

### **📂 scripts/** - Automation
- **setup.sh**: One-time project setup
- **run.sh**: Development server runner
- **deploy.sh**: Production deployment
- **test.sh**: Test suite runner

### **📂 tests/** - Testing
- **unit/**: Individual component tests
- **integration/**: Service integration tests
- **e2e/**: End-to-end workflow tests
- **performance/**: Load and performance tests

### **📂 deployments/** - Infrastructure
- **aws/**: AWS-specific deployment configurations
- **docker/**: Container deployment files
- **infrastructure/**: Infrastructure as Code (IaC)

### **📂 monitoring/** - Observability
- **logs/**: Application and system logs
- **metrics/**: Performance and business metrics
- **alerts/**: Alert rules and configurations
- **dashboards/**: Monitoring dashboards

## 🚀 **Quick Navigation**

| Component | Location | Description |
|-----------|----------|-------------|
| 🏗️ **Architecture** | `docs/architecture/` | Complete system architecture diagrams |
| 🤖 **Agents** | `src/agents/` | 7 specialized banking agents |
| 🌐 **Frontend** | `src/frontend/` | React banking interface |
| ⚙️ **Backend** | `src/backend/` | FastAPI services and APIs |
| 🚀 **Scripts** | `scripts/` | Setup, build, test, deploy scripts |
| 📋 **Config** | `config/` | Docker, AWS, and application configs |
| 🧪 **Tests** | `tests/` | Complete test suite |
| 🚀 **Deploy** | `deployments/` | AWS, Docker, and IaC configurations |

## 📋 **Getting Started**

```bash
# 1. Setup project
./scripts/setup.sh

# 2. Start development
./scripts/run.sh up

# 3. Run tests
./scripts/test.sh all

# 4. Deploy to AWS
./scripts/deploy.sh production ap-southeast-1
```

## 🎯 **Enterprise Standards**

- ✅ **Separation of Concerns**: Clear separation between source, docs, config, and deployment
- ✅ **Scalable Structure**: Organized for team collaboration and growth
- ✅ **Documentation First**: Comprehensive documentation at all levels
- ✅ **Infrastructure as Code**: All infrastructure defined in code
- ✅ **Automated Testing**: Complete test coverage with multiple test types
- ✅ **Monitoring Ready**: Built-in observability and monitoring
- ✅ **Security Focused**: Security configurations and best practices
- ✅ **Banking Compliance**: Structured for regulatory compliance and audits

This structure follows enterprise software development best practices and is optimized for the VPBank K-MULT Agent Studio multi-agent banking platform.
