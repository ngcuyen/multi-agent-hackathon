#!/bin/bash

# VPBank K-MULT Agent Studio - Comprehensive API Testing Script
# Tests all refactored API endpoints

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_BASE="http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com"

echo -e "${BLUE}🧪 VPBank K-MULT Agent Studio - API Testing${NC}"
echo "=============================================="
echo "API Base: $API_BASE"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description: "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$endpoint")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $status${NC}"
        return 0
    else
        echo -e "${RED}❌ $status (expected $expected_status)${NC}"
        return 1
    fi
}

# Function to test endpoint with JSON response
test_json_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo "Testing $description:"
    response=$(curl -s "$API_BASE$endpoint")
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$endpoint")
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✅ Status: $status${NC}"
        echo "$response" | jq . 2>/dev/null || echo "$response"
    else
        echo -e "${RED}❌ Status: $status${NC}"
        echo "$response"
    fi
    echo ""
}

echo -e "${BLUE}📋 1. Core API Endpoints${NC}"
echo "========================"

test_endpoint "/docs" "API Documentation (Swagger)"
test_endpoint "/redoc" "API Documentation (ReDoc)"
test_endpoint "/" "Root Endpoint"
test_endpoint "/health" "Root Health Check"

echo ""
echo -e "${BLUE}📋 2. Public API Endpoints${NC}"
echo "=========================="

test_json_endpoint "/mutil_agent/public/api/v1/health-check/health" "Public Health Check"

echo -e "${BLUE}📋 3. Private API Endpoints${NC}"
echo "==========================="

test_endpoint "/mutil_agent/api/v1/info" "API Information"

echo ""
echo -e "${BLUE}📋 4. Health Check Endpoints${NC}"
echo "============================"

test_endpoint "/mutil_agent/api/v1/health/health" "Comprehensive Health"
test_endpoint "/mutil_agent/api/v1/health/health/detailed" "Detailed Health"
test_endpoint "/mutil_agent/api/v1/health/health/document" "Document Service Health"
test_endpoint "/mutil_agent/api/v1/health/health/risk" "Risk Service Health"
test_endpoint "/mutil_agent/api/v1/health/health/compliance" "Compliance Service Health"
test_endpoint "/mutil_agent/api/v1/health/health/text" "Text Service Health"
test_endpoint "/mutil_agent/api/v1/health/health/agents" "Agents Service Health"
test_endpoint "/mutil_agent/api/v1/health/health/knowledge" "Knowledge Service Health"

echo ""
echo -e "${BLUE}📋 5. Service-Specific Health Endpoints${NC}"
echo "======================================="

test_endpoint "/mutil_agent/api/v1/risk/health" "Risk Assessment Health"
test_endpoint "/mutil_agent/api/v1/agents/health" "Multi-Agent Health"
test_endpoint "/mutil_agent/api/v1/knowledge/health" "Knowledge Base Health"
test_endpoint "/mutil_agent/api/v1/text/summary/health" "Text Processing Health"
test_endpoint "/mutil_agent/api/v1/compliance/health" "Compliance Health"

echo ""
echo -e "${BLUE}📋 6. Agent Coordination Endpoints${NC}"
echo "=================================="

test_endpoint "/mutil_agent/api/v1/agents/status" "Agent Status"
test_endpoint "/mutil_agent/api/v1/agents/list" "Agent List"

echo ""
echo -e "${BLUE}📋 7. Knowledge Base Endpoints${NC}"
echo "=============================="

test_endpoint "/mutil_agent/api/v1/knowledge/categories" "Knowledge Categories"
test_endpoint "/mutil_agent/api/v1/knowledge/stats" "Knowledge Statistics"

echo ""
echo -e "${BLUE}📋 8. Risk Assessment Endpoints${NC}"
echo "==============================="

test_endpoint "/mutil_agent/api/v1/risk/market-data" "Market Data"

echo ""
echo -e "${BLUE}📋 9. Text Processing Endpoints${NC}"
echo "==============================="

test_endpoint "/mutil_agent/api/v1/text/summary/health" "Text Summary Health"

echo ""
echo -e "${BLUE}📋 10. Compliance Endpoints${NC}"
echo "=========================="

test_endpoint "/mutil_agent/api/v1/compliance/health" "Compliance Health"

echo ""
echo -e "${BLUE}📊 Testing Summary${NC}"
echo "=================="

# Test some key JSON endpoints for detailed responses
echo -e "${YELLOW}🔍 Detailed Response Testing:${NC}"

echo ""
echo "1. API Information:"
curl -s "$API_BASE/mutil_agent/api/v1/info" | jq . 2>/dev/null || echo "Endpoint not available"

echo ""
echo "2. Agent Status:"
curl -s "$API_BASE/mutil_agent/api/v1/agents/status" | jq . 2>/dev/null || echo "Endpoint not available"

echo ""
echo "3. Knowledge Categories:"
curl -s "$API_BASE/mutil_agent/api/v1/knowledge/categories" | jq . 2>/dev/null || echo "Endpoint not available"

echo ""
echo "4. Risk Assessment Health:"
curl -s "$API_BASE/mutil_agent/api/v1/risk/health" | jq . 2>/dev/null || echo "Endpoint not available"

echo ""
echo -e "${GREEN}🎉 API Testing Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Access Points Summary:${NC}"
echo "   🌐 Frontend (CloudFront): https://d2bwc7cu1vx0pc.cloudfront.net"
echo "   🔗 Backend API: $API_BASE"
echo "   📚 API Docs: $API_BASE/docs"
echo "   📖 ReDoc: $API_BASE/redoc"
echo ""
echo -e "${YELLOW}💡 Note: Some endpoints may return 404 if the refactored routes haven't fully loaded yet.${NC}"
echo -e "${YELLOW}    Wait a few more minutes and test again if needed.${NC}"
