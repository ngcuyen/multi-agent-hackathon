#!/bin/bash

# VPBank K-MULT Agent Studio - Background Monitoring Script
# Monitors services and automatically restarts if needed

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_DIR/tools/monitoring/logs/background_monitor.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if service is healthy
check_service_health() {
    local service_name=$1
    local health_url=$2
    
    if curl -s -f "$health_url" > /dev/null 2>&1; then
        return 0  # Healthy
    else
        return 1  # Unhealthy
    fi
}

# Check Docker container status
check_container_status() {
    local container_name=$1
    local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
    
    if [ "$status" = "running" ]; then
        return 0  # Running
    else
        return 1  # Not running
    fi
}

# Restart services if needed
restart_services() {
    log "🔄 Restarting VPBank K-MULT Agent Studio services..."
    cd "$PROJECT_DIR"
    ./deployment/scripts/manage.sh restart >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ Services restarted successfully"
        return 0
    else
        log "❌ Failed to restart services"
        return 1
    fi
}

# Main monitoring loop
monitor_services() {
    log "🚀 Starting VPBank K-MULT Background Monitor"
    log "📍 Project Directory: $PROJECT_DIR"
    log "📝 Log File: $LOG_FILE"
    
    while true; do
        local restart_needed=false
        
        # Check backend container
        if ! check_container_status "vpbank-kmult-backend"; then
            log "⚠️  Backend container not running"
            restart_needed=true
        elif ! check_service_health "backend" "http://localhost:8080/mutil_agent/public/api/v1/health-check/health"; then
            log "⚠️  Backend service unhealthy"
            restart_needed=true
        fi
        
        # Check frontend container
        if ! check_container_status "vpbank-kmult-frontend"; then
            log "⚠️  Frontend container not running"
            restart_needed=true
        elif ! check_service_health "frontend" "http://localhost:3000"; then
            log "⚠️  Frontend service unhealthy"
            restart_needed=true
        fi
        
        # Restart if needed
        if [ "$restart_needed" = true ]; then
            log "🔧 Services need restart - attempting recovery..."
            if restart_services; then
                log "✅ Recovery successful"
                # Wait a bit longer after restart
                sleep 30
            else
                log "❌ Recovery failed - will retry in next cycle"
            fi
        else
            log "✅ All services healthy"
        fi
        
        # Wait before next check (5 minutes)
        sleep 300
    done
}

# Handle script termination
cleanup() {
    log "🛑 Background monitor stopping..."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Start monitoring
monitor_services
