# VPBank K-MULT Development Makefile

.PHONY: help install dev test build deploy clean lint format security

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

## Help
help: ## Show this help message
	@echo "$(BLUE)VPBank K-MULT Development Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

## Development Setup
install: ## Install development dependencies
	@echo "$(BLUE)Installing development dependencies...$(RESET)"
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && npm install
	pre-commit install

setup-dev: ## Setup development environment
	@echo "$(BLUE)Setting up development environment...$(RESET)"
	cp .env.dev.example .env.dev
	docker-compose -f docker-compose.dev.yml build
	@echo "$(GREEN)Development environment setup complete!$(RESET)"

## Development
dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(RESET)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Development environment started!$(RESET)"
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:3000"
	@echo "Grafana: http://localhost:3001"

dev-logs: ## Show development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	@echo "$(BLUE)Stopping development environment...$(RESET)"
	docker-compose -f docker-compose.dev.yml down

dev-clean: ## Clean development environment
	@echo "$(BLUE)Cleaning development environment...$(RESET)"
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

## Testing
test: ## Run all tests
	@echo "$(BLUE)Running tests...$(RESET)"
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=html

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(RESET)"
	cd backend && python -m pytest tests/ -v -m "unit"

test-integration: ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(RESET)"
	cd backend && python -m pytest tests/ -v -m "integration"

test-api: ## Run API tests only
	@echo "$(BLUE)Running API tests...$(RESET)"
	cd backend && python -m pytest tests/ -v -m "api"

test-coverage: ## Generate test coverage report
	@echo "$(BLUE)Generating coverage report...$(RESET)"
	cd backend && python -m pytest tests/ --cov=app --cov-report=html --cov-report=term
	@echo "$(GREEN)Coverage report generated in backend/htmlcov/$(RESET)"

## Code Quality
lint: ## Run linting
	@echo "$(BLUE)Running linting...$(RESET)"
	cd backend && flake8 app/ tests/
	cd backend && mypy app/

format: ## Format code
	@echo "$(BLUE)Formatting code...$(RESET)"
	cd backend && black app/ tests/
	cd backend && isort app/ tests/

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(RESET)"
	cd backend && black --check app/ tests/
	cd backend && isort --check-only app/ tests/

## Security
security: ## Run security checks
	@echo "$(BLUE)Running security checks...$(RESET)"
	cd backend && safety check
	cd backend && bandit -r app/

security-deps: ## Check for vulnerable dependencies
	@echo "$(BLUE)Checking for vulnerable dependencies...$(RESET)"
	cd backend && safety check --json
	cd frontend && npm audit

## Building
build: ## Build production images
	@echo "$(BLUE)Building production images...$(RESET)"
	docker build -f backend/Dockerfile.prod -t vpbank-kmult-backend:latest backend/
	cd frontend && npm run build

build-dev: ## Build development images
	@echo "$(BLUE)Building development images...$(RESET)"
	docker-compose -f docker-compose.dev.yml build

## Deployment
deploy-pipeline: ## Deploy CI/CD pipeline
	@echo "$(BLUE)Deploying CI/CD pipeline...$(RESET)"
	./scripts/deploy-pipeline.sh

deploy-staging: ## Deploy to staging
	@echo "$(BLUE)Deploying to staging...$(RESET)"
	@echo "$(YELLOW)Triggering GitHub Actions workflow...$(RESET)"
	gh workflow run ci-cd.yml --ref develop

deploy-prod: ## Deploy to production
	@echo "$(BLUE)Deploying to production...$(RESET)"
	@echo "$(YELLOW)Triggering GitHub Actions workflow...$(RESET)"
	gh workflow run ci-cd.yml --ref main

## Database
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(RESET)"
	# Add migration commands here

db-seed: ## Seed database with test data
	@echo "$(BLUE)Seeding database...$(RESET)"
	# Add seeding commands here

## Monitoring
logs: ## Show application logs
	@echo "$(BLUE)Showing application logs...$(RESET)"
	docker-compose -f docker-compose.dev.yml logs -f backend-dev

logs-prod: ## Show production logs
	@echo "$(BLUE)Showing production logs...$(RESET)"
	aws logs tail /aws/ecs/vpbank-kmult-backend --follow

metrics: ## Open metrics dashboard
	@echo "$(BLUE)Opening metrics dashboard...$(RESET)"
	open http://localhost:3001

## Cleanup
clean: ## Clean up development environment
	@echo "$(BLUE)Cleaning up...$(RESET)"
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
	cd backend && rm -rf htmlcov/ .coverage .pytest_cache/
	cd frontend && rm -rf build/ node_modules/.cache/

clean-all: ## Clean everything including images
	@echo "$(BLUE)Cleaning everything...$(RESET)"
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -af
	cd backend && rm -rf htmlcov/ .coverage .pytest_cache/ __pycache__/
	cd frontend && rm -rf build/ node_modules/

## Documentation
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(RESET)"
	cd docs && mkdocs build

docs-serve: ## Serve documentation locally
	@echo "$(BLUE)Serving documentation...$(RESET)"
	cd docs && mkdocs serve

## Git Hooks
hooks-install: ## Install git hooks
	@echo "$(BLUE)Installing git hooks...$(RESET)"
	pre-commit install

hooks-run: ## Run git hooks on all files
	@echo "$(BLUE)Running git hooks...$(RESET)"
	pre-commit run --all-files

## Health Checks
health: ## Check application health
	@echo "$(BLUE)Checking application health...$(RESET)"
	curl -f http://localhost:8080/mutil_agent/public/api/v1/health-check/health || echo "$(RED)Health check failed$(RESET)"

health-prod: ## Check production health
	@echo "$(BLUE)Checking production health...$(RESET)"
	curl -f http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com/mutil_agent/public/api/v1/health-check/health || echo "$(RED)Production health check failed$(RESET)"

## Performance
load-test: ## Run load tests
	@echo "$(BLUE)Running load tests...$(RESET)"
	cd backend && locust -f tests/load_test.py --host=http://localhost:8080

benchmark: ## Run performance benchmarks
	@echo "$(BLUE)Running performance benchmarks...$(RESET)"
	# Add benchmark commands here
