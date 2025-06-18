#!/bin/bash

# WireGuard VPN Server Auto Setup Script
# Author: vanhoangkha
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as ubuntu user."
fi

# Check Ubuntu version
if ! grep -q "Ubuntu" /etc/os-release; then
    error "This script is designed for Ubuntu. Please run on Ubuntu 20.04 or later."
fi

log "Starting WireGuard VPN Server Setup..."

# Step 1: Update system
log "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install essential packages
log "Step 2: Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    vim \
    htop \
    net-tools \
    ufw \
    unzip \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Step 3: Install Docker
log "Step 3: Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Remove old Docker versions
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    log "Docker installed successfully"
else
    log "Docker is already installed"
fi

# Step 4: Install Docker Compose
log "Step 4: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    log "Docker Compose installed successfully"
else
    log "Docker Compose is already installed"
fi

# Step 5: Configure system for VPN
log "Step 5: Configuring system for VPN..."
# Enable IP forwarding
if ! grep -q "net.ipv4.ip_forward=1" /etc/sysctl.conf; then
    echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
fi
if ! grep -q "net.ipv6.conf.all.forwarding=1" /etc/sysctl.conf; then
    echo 'net.ipv6.conf.all.forwarding=1' | sudo tee -a /etc/sysctl.conf
fi
sudo sysctl -p

# Step 6: Configure UFW firewall
log "Step 6: Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 51820/udp
sudo ufw --force enable

# Step 7: Create WireGuard project structure
log "Step 7: Creating WireGuard project structure..."
PROJECT_DIR="$HOME/wireguard-vpn"
mkdir -p $PROJECT_DIR/{config,db,logs,backup}
cd $PROJECT_DIR

# Step 8: Generate secure passwords
log "Step 8: Generating secure configuration..."
ADMIN_PASSWORD=$(openssl rand -base64 16)
SESSION_SECRET=$(openssl rand -base64 32)

# Step 9: Create Docker Compose configuration
log "Step 9: Creating Docker Compose configuration..."
cat > docker-compose.yaml << EOF
version: "3.8"

services:
  # WireGuard VPN Server
  wireguard:
    image: linuxserver/wireguard:v1.0.20210914-ls6
    container_name: wireguard-server
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Ho_Chi_Minh
    volumes:
      - ./config:/config
      - /lib/modules:/lib/modules:ro
    ports:
      - "80:5000"
      - "51820:51820/udp"
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
    restart: unless-stopped
    networks:
      - wireguard-net

  # WireGuard Web UI
  wireguard-ui:
    image: ngoduykhanh/wireguard-ui:latest
    container_name: wireguard-ui
    depends_on:
      - wireguard
    cap_add:
      - NET_ADMIN
    network_mode: service:wireguard
    environment:
      - SENDGRID_API_KEY=
      - EMAIL_FROM_ADDRESS=
      - EMAIL_FROM_NAME=WireGuard VPN
      - SESSION_SECRET=$SESSION_SECRET
      - WGUI_USERNAME=admin
      - WGUI_PASSWORD=$ADMIN_PASSWORD
      - WG_CONF_TEMPLATE=
      - WGUI_MANAGE_START=true
      - WGUI_MANAGE_RESTART=true
      - WGUI_LOG_LEVEL=INFO
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "3"
    volumes:
      - ./db:/app/db
      - ./config:/etc/wireguard
    restart: unless-stopped

networks:
  wireguard-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF

# Step 10: Create environment file
log "Step 10: Creating environment configuration..."
cat > .env << EOF
# WireGuard UI Configuration
WGUI_USERNAME=admin
WGUI_PASSWORD=$ADMIN_PASSWORD
SESSION_SECRET=$SESSION_SECRET

# Email Configuration (Optional)
EMAIL_FROM_ADDRESS=
EMAIL_FROM_NAME=WireGuard VPN

# Timezone
TZ=Asia/Ho_Chi_Minh

# Logging
WGUI_LOG_LEVEL=INFO
EOF

chmod 600 .env

# Step 11: Create monitoring script
log "Step 11: Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash

echo "=== WireGuard Server Status ==="
echo "Date: $(date)"
echo

echo "=== Docker Containers ==="
docker-compose ps

echo "=== WireGuard Interface ==="
sudo wg show 2>/dev/null || echo "WireGuard interface not active"

echo "=== Active Connections ==="
sudo ss -tuln | grep -E ':(80|51820)'

echo "=== System Resources ==="
free -h
df -h /

echo "=== Network Traffic ==="
cat /proc/net/dev | grep -E '(eth0|wg0)' || echo "No WireGuard traffic yet"
EOF

chmod +x monitor.sh

# Step 12: Create backup script
log "Step 12: Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="$HOME/wireguard-backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configurations
tar -czf $BACKUP_DIR/wireguard-config-$DATE.tar.gz \
    -C ~/wireguard-vpn \
    config/ db/ docker-compose.yaml .env 2>/dev/null || true

# Keep only last 7 backups
find $BACKUP_DIR -name "wireguard-config-*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo "Backup completed: $BACKUP_DIR/wireguard-config-$DATE.tar.gz"
EOF

chmod +x backup.sh

# Step 13: Start WireGuard services
log "Step 13: Starting WireGuard services..."
docker-compose pull
docker-compose up -d

# Wait for services to start
sleep 10

# Step 14: Get public IP and display access information
log "Step 14: Getting server information..."
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com/ || curl -s http://ipinfo.io/ip || echo "Unable to detect public IP")

# Step 15: Display setup completion information
log "Setup completed successfully!"
echo
echo -e "${BLUE}==================== SETUP COMPLETE ====================${NC}"
echo -e "${GREEN}WireGuard VPN Server is now running!${NC}"
echo
echo -e "${YELLOW}Access Information:${NC}"
echo -e "  URL: ${BLUE}http://$PUBLIC_IP${NC}"
echo -e "  Username: ${GREEN}admin${NC}"
echo -e "  Password: ${GREEN}$ADMIN_PASSWORD${NC}"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Open browser and go to: http://$PUBLIC_IP"
echo "  2. Login with the credentials above"
echo "  3. Configure WireGuard server settings"
echo "  4. Create client configurations"
echo "  5. Download client config files"
echo
echo -e "${YELLOW}Important Files:${NC}"
echo "  - Project directory: $PROJECT_DIR"
echo "  - Configuration: $PROJECT_DIR/docker-compose.yaml"
echo "  - Environment: $PROJECT_DIR/.env"
echo "  - Monitor script: $PROJECT_DIR/monitor.sh"
echo "  - Backup script: $PROJECT_DIR/backup.sh"
echo
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  - Check status: cd $PROJECT_DIR && docker-compose ps"
echo "  - View logs: cd $PROJECT_DIR && docker-compose logs -f"
echo "  - Restart services: cd $PROJECT_DIR && docker-compose restart"
echo "  - Monitor server: cd $PROJECT_DIR && ./monitor.sh"
echo "  - Create backup: cd $PROJECT_DIR && ./backup.sh"
echo
echo -e "${RED}Security Notes:${NC}"
echo "  - Change the default password after first login"
echo "  - Configure AWS Security Group to allow ports 80 and 51820"
echo "  - Consider restricting port 80 access to your IP only"
echo "  - Regularly update the system and Docker images"
echo
echo -e "${BLUE}======================================================${NC}"

# Save credentials to file
cat > $PROJECT_DIR/credentials.txt << EOF
WireGuard VPN Server Access Information
======================================

URL: http://$PUBLIC_IP
Username: admin
Password: $ADMIN_PASSWORD

Generated on: $(date)

IMPORTANT: Change the password after first login!
EOF

chmod 600 $PROJECT_DIR/credentials.txt

log "Credentials saved to: $PROJECT_DIR/credentials.txt"
log "Setup script completed. Please configure AWS Security Group if needed."
