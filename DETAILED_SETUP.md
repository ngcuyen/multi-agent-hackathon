# WireGuard VPN Server - Detailed Setup Guide

## 📋 Mục Lục Chi Tiết

- [Chuẩn Bị Hệ Thống](#chuẩn-bị-hệ-thống)
- [Thiết Lập EC2 Instance](#thiết-lập-ec2-instance)
- [Cài Đặt Dependencies](#cài-đặt-dependencies)
- [Cấu Hình WireGuard Server](#cấu-hình-wireguard-server)
- [Thiết Lập Security Groups](#thiết-lập-security-groups)
- [Cấu Hình WireGuard UI](#cấu-hình-wireguard-ui)
- [Tạo Client Configurations](#tạo-client-configurations)
- [Cài Đặt Client](#cài-đặt-client)
- [Testing và Verification](#testing-và-verification)
- [Monitoring và Maintenance](#monitoring-và-maintenance)

## 🚀 Chuẩn Bị Hệ Thống

### Yêu Cầu Tối Thiểu:
- **AWS Account** với quyền EC2 full access
- **EC2 Instance**: Ubuntu 24.04 LTS, t2.micro trở lên
- **Storage**: Tối thiểu 8GB (khuyến nghị 20GB)
- **RAM**: Tối thiểu 1GB (khuyến nghị 2GB)
- **Network**: VPC với Internet Gateway
- **SSH Key Pair** để truy cập instance

### Kiến Thức Cần Có:
- Cơ bản về Linux command line
- Hiểu biết về Docker và containers
- Cơ bản về networking và VPN
- AWS EC2 và Security Groups

## 🖥️ Thiết Lập EC2 Instance

### Bước 1: Launch EC2 Instance

1. **Đăng nhập AWS Console** → EC2 Dashboard
2. **Click "Launch Instance"**
3. **Chọn AMI**: Ubuntu Server 24.04 LTS (Free tier eligible)
4. **Instance Type**: 
   - Development: t2.micro (1 vCPU, 1GB RAM)
   - Production: t3.small (2 vCPU, 2GB RAM) hoặc lớn hơn
5. **Key Pair**: 
   - Tạo mới hoặc chọn existing key pair
   - Download và lưu trữ an toàn .pem file
6. **Network Settings**:
   - VPC: Default VPC hoặc custom VPC
   - Subnet: Public subnet (có Internet Gateway)
   - Auto-assign Public IP: Enable
7. **Security Group**: Tạo mới với tên "wireguard-sg"
   - SSH (22): Your IP only
   - HTTP (80): 0.0.0.0/0 (tạm thời)
   - Custom UDP (51820): 0.0.0.0/0
8. **Storage**: 
   - Root volume: 20GB gp3 (khuyến nghị)
   - Encryption: Enable (khuyến nghị)

### Bước 2: Connect to Instance

```bash
# Thay đổi quyền key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR-EC2-PUBLIC-IP

# Verify connection
whoami
pwd
```

### Bước 3: Initial System Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y \
    curl \
    wget \
    vim \
    htop \
    net-tools \
    ufw \
    unzip

# Set timezone (optional)
sudo timedatectl set-timezone Asia/Ho_Chi_Minh

# Check system info
uname -a
free -h
df -h
```

## 🔧 Cài Đặt Dependencies

### Bước 1: Install Docker

```bash
# Remove old Docker versions
sudo apt remove -y docker docker-engine docker.io containerd runc

# Install Docker dependencies
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index
sudo apt update

# Install Docker Engine
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Verify Docker installation
sudo docker --version
sudo docker run hello-world
```

### Bước 2: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Create symlink (optional)
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installation
docker-compose --version

# Test Docker Compose
docker-compose version
```

### Bước 3: System Optimization

```bash
# Enable IP forwarding (required for VPN)
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
echo 'net.ipv6.conf.all.forwarding=1' | sudo tee -a /etc/sysctl.conf

# Apply sysctl changes
sudo sysctl -p

# Verify IP forwarding
cat /proc/sys/net/ipv4/ip_forward  # Should return 1

# Configure firewall (UFW)
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 51820/udp
sudo ufw --force enable

# Check UFW status
sudo ufw status verbose
```

## 🔧 Cấu Hình WireGuard Server

### Bước 1: Create Project Structure

```bash
# Create project directory
mkdir -p ~/wireguard-vpn
cd ~/wireguard-vpn

# Create subdirectories
mkdir -p {config,db,logs,backup}

# Set proper permissions
chmod 755 ~/wireguard-vpn
```

### Bước 2: Create Docker Compose Configuration

```bash
# Create docker-compose.yaml
cat > docker-compose.yaml << 'EOF'
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
      - "80:5000"      # WireGuard UI
      - "51820:51820/udp"  # WireGuard VPN
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
      - SESSION_SECRET=your-secret-key-here
      - WGUI_USERNAME=admin
      - WGUI_PASSWORD=your-strong-password-here
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
```

### Bước 3: Environment Configuration

```bash
# Create environment file
cat > .env << 'EOF'
# WireGuard UI Configuration
WGUI_USERNAME=admin
WGUI_PASSWORD=ChangeThisPassword123!
SESSION_SECRET=$(openssl rand -base64 32)

# Email Configuration (Optional)
EMAIL_FROM_ADDRESS=
EMAIL_FROM_NAME=WireGuard VPN

# Timezone
TZ=Asia/Ho_Chi_Minh

# Logging
WGUI_LOG_LEVEL=INFO
EOF

# Generate secure session secret
SESSION_SECRET=$(openssl rand -base64 32)
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env

# Set proper permissions
chmod 600 .env
```

### Bước 4: Start WireGuard Services

```bash
# Pull Docker images
docker-compose pull

# Start services in background
docker-compose up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check individual container logs
docker logs wireguard-server
docker logs wireguard-ui
```

### Bước 5: Verify Installation

```bash
# Check if containers are running
docker ps

# Check port binding
sudo netstat -tlnp | grep :80
sudo netstat -ulnp | grep :51820

# Test local connectivity
curl -I http://localhost:80

# Check WireGuard kernel module
lsmod | grep wireguard

# Check IP forwarding
cat /proc/sys/net/ipv4/ip_forward
```

## 🔒 Thiết Lập Security Groups

### Bước 1: Configure AWS Security Group

```bash
# Get instance information
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
SECURITY_GROUP_ID=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text --region ap-southeast-1)

echo "Instance ID: $INSTANCE_ID"
echo "Security Group ID: $SECURITY_GROUP_ID"
```

### Bước 2: Add Security Group Rules

```bash
# Add HTTP access (port 80) - Restrict to your IP for security
YOUR_IP=$(curl -s http://checkip.amazonaws.com/)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr $YOUR_IP/32 \
    --region ap-southeast-1

# Add WireGuard VPN port (51820/UDP)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol udp \
    --port 51820 \
    --cidr 0.0.0.0/0 \
    --region ap-southeast-1

# Add HTTPS (optional)
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region ap-southeast-1

# Verify security group rules
aws ec2 describe-security-groups \
    --group-ids $SECURITY_GROUP_ID \
    --region ap-southeast-1
```

### Bước 3: Configure UFW Firewall

```bash
# Reset UFW rules
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow WireGuard UI (restrict to your IP)
sudo ufw allow from $YOUR_IP to any port 80

# Allow WireGuard VPN
sudo ufw allow 51820/udp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable UFW
sudo ufw --force enable

# Check status
sudo ufw status numbered
```

## 🌐 Cấu Hình WireGuard UI

### Bước 1: Access WireGuard UI

```bash
# Get EC2 public IP
EC2_PUBLIC_IP=$(curl -s http://checkip.amazonaws.com/)
echo "WireGuard UI URL: http://$EC2_PUBLIC_IP"
```

1. **Mở trình duyệt** và truy cập: `http://YOUR-EC2-PUBLIC-IP`
2. **Đăng nhập** với credentials từ file .env:
   - Username: `admin`
   - Password: `ChangeThisPassword123!` (hoặc password bạn đã đặt)

### Bước 2: Configure WireGuard Server

1. **Vào tab "Wireguard Server"**
2. **Cấu hình Post Up Script:**
   ```bash
   iptables -A FORWARD -i wg0 -j ACCEPT
   iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
   ip6tables -A FORWARD -i wg0 -j ACCEPT
   ip6tables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
   ```

3. **Cấu hình Post Down Script:**
   ```bash
   iptables -D FORWARD -i wg0 -j ACCEPT
   iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
   ip6tables -D FORWARD -i wg0 -j ACCEPT
   ip6tables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
   ```

4. **Click "Save" và "Apply Config"**

### Bước 3: Configure Global Settings

1. **Vào tab "Global Settings"**
2. **Cấu hình các thông số:**
   - **Endpoint Address**: `YOUR-EC2-PUBLIC-IP:51820`
   - **DNS Server**: `1.1.1.1, 8.8.8.8`
   - **MTU**: `1420`
   - **Persistent Keepalive**: `25`
   - **Config File Path**: `/etc/wireguard/wg0.conf`

3. **Save và Apply Config**

### Bước 4: Advanced Server Configuration

```bash
# Create custom WireGuard config template
cat > ~/wireguard-vpn/config/wg0.conf.template << 'EOF'
[Interface]
Address = 10.252.1.1/24
ListenPort = 51820
PrivateKey = SERVER_PRIVATE_KEY
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client configurations will be added here automatically
EOF
```

## 👥 Tạo Client Configurations

### Bước 1: Create Client via UI

1. **Click "New Client"** trong WireGuard UI
2. **Nhập thông tin client:**
   - **Name**: `laptop-ubuntu` hoặc `laptop-windows`
   - **Email**: Email của bạn (optional)
   - **Allocated IPs**: Để trống (auto-assign)
   - **Allowed IPs**: `0.0.0.0/0` (route all traffic)
   - **Extra Allowed IPs**: Để trống
   - **Use Server DNS**: Enable
   - **Enable after creation**: Enable

3. **Click "Submit"**

### Bước 2: Download Client Configuration

1. **Vào tab "Wireguard Clients"**
2. **Click "Download"** để tải file `.conf`
3. **Hoặc click vào client name** để xem QR code

### Bước 3: Manual Client Configuration (Advanced)

```bash
# Generate client keys manually
cd ~/wireguard-vpn
docker exec wireguard-server wg genkey | tee client-private.key | docker exec -i wireguard-server wg pubkey > client-public.key

# Create client config manually
cat > client-config.conf << EOF
[Interface]
PrivateKey = $(cat client-private.key)
Address = 10.252.1.2/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = $EC2_PUBLIC_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF

# Clean up key files
rm client-private.key client-public.key
```

## 💻 Cài Đặt Client

### Ubuntu Client Setup

#### Bước 1: Install WireGuard

```bash
# Update package list
sudo apt update

# Install WireGuard
sudo apt install -y wireguard wireguard-tools

# Verify installation
wg --version
```

#### Bước 2: Configure Client

```bash
# Copy downloaded config file
sudo cp ~/Downloads/client-config.conf /etc/wireguard/wg0.conf

# Set proper permissions
sudo chmod 600 /etc/wireguard/wg0.conf
sudo chown root:root /etc/wireguard/wg0.conf

# Verify config
sudo cat /etc/wireguard/wg0.conf
```

#### Bước 3: Connect to VPN

```bash
# Start VPN connection
sudo wg-quick up wg0

# Check connection status
sudo wg show

# Check IP address
curl ifconfig.me

# Check routing table
ip route show

# Test DNS resolution
nslookup google.com
```

#### Bước 4: Manage VPN Connection

```bash
# Stop VPN connection
sudo wg-quick down wg0

# Enable auto-start on boot
sudo systemctl enable wg-quick@wg0

# Start service
sudo systemctl start wg-quick@wg0

# Check service status
sudo systemctl status wg-quick@wg0

# View service logs
sudo journalctl -u wg-quick@wg0 -f
```

### Windows Client Setup

#### Bước 1: Download WireGuard

1. **Truy cập**: https://www.wireguard.com/install/
2. **Download**: "WireGuard for Windows"
3. **Install** với quyền Administrator

#### Bước 2: Import Configuration

1. **Mở WireGuard application**
2. **Click "Add Tunnel"**
3. **Chọn "Import tunnel(s) from file"**
4. **Browse và chọn** file `.conf` đã download
5. **Click "OK"**

#### Bước 3: Connect and Test

1. **Click "Activate"** để kết nối
2. **Kiểm tra status**: Should show "Active"
3. **Test IP**: Truy cập https://whatismyipaddress.com/
4. **Test DNS**: `nslookup google.com` trong Command Prompt

#### Bước 4: Advanced Windows Configuration

```powershell
# Run as Administrator in PowerShell

# Check WireGuard service
Get-Service -Name "WireGuardTunnel*"

# View network adapters
Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*WireGuard*"}

# Check routing table
route print

# Test connectivity
Test-NetConnection -ComputerName 8.8.8.8 -Port 53
```

## 🧪 Testing và Verification

### Bước 1: Basic Connectivity Tests

```bash
# Test 1: Check IP address change
echo "IP before VPN:"
curl -s ifconfig.me

# Connect to VPN (Ubuntu)
sudo wg-quick up wg0

echo "IP after VPN:"
curl -s ifconfig.me

# Should show EC2 public IP
```

### Bước 2: DNS Resolution Tests

```bash
# Test DNS resolution
nslookup google.com
nslookup facebook.com
nslookup github.com

# Test with different DNS servers
nslookup google.com 1.1.1.1
nslookup google.com 8.8.8.8
```

### Bước 3: Performance Tests

```bash
# Speed test
curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -

# Ping test
ping -c 10 8.8.8.8

# Traceroute test
traceroute google.com
```

### Bước 4: Security Tests

```bash
# Check for DNS leaks
curl -s https://1.1.1.1/cdn-cgi/trace

# Check WebRTC leaks (in browser)
# Visit: https://browserleaks.com/webrtc

# Check IP geolocation
curl -s http://ip-api.com/json/
```

### Bước 5: WireGuard Status Monitoring

```bash
# Check WireGuard interface status
sudo wg show

# Check detailed statistics
sudo wg show all

# Monitor real-time traffic
watch -n 1 'sudo wg show'

# Check system logs
sudo journalctl -u wg-quick@wg0 -f
```

## 📊 Monitoring và Maintenance

### Bước 1: Server Monitoring

```bash
# Create monitoring script
cat > ~/wireguard-vpn/monitor.sh << 'EOF'
#!/bin/bash

echo "=== WireGuard Server Status ==="
echo "Date: $(date)"
echo

echo "=== Docker Containers ==="
docker-compose ps

echo "=== WireGuard Interface ==="
sudo wg show

echo "=== Active Connections ==="
sudo ss -tuln | grep -E ':(80|51820)'

echo "=== System Resources ==="
free -h
df -h /

echo "=== Network Traffic ==="
cat /proc/net/dev | grep -E '(eth0|wg0)'
EOF

chmod +x ~/wireguard-vpn/monitor.sh

# Run monitoring
./monitor.sh
```

### Bước 2: Log Management

```bash
# View WireGuard logs
sudo journalctl -u wg-quick@wg0 --since "1 hour ago"

# View Docker logs
docker-compose logs --tail=100 -f

# Create log rotation
sudo tee /etc/logrotate.d/wireguard << 'EOF'
/var/log/wireguard/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
```

### Bước 3: Backup Configuration

```bash
# Create backup script
cat > ~/wireguard-vpn/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="$HOME/wireguard-backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configurations
tar -czf $BACKUP_DIR/wireguard-config-$DATE.tar.gz \
    -C ~/wireguard-vpn \
    config/ db/ docker-compose.yaml .env

# Keep only last 7 backups
find $BACKUP_DIR -name "wireguard-config-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/wireguard-config-$DATE.tar.gz"
EOF

chmod +x ~/wireguard-vpn/backup.sh

# Run backup
./backup.sh

# Schedule daily backup (crontab)
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/wireguard-vpn/backup.sh") | crontab -
```

### Bước 4: Update và Maintenance

```bash
# Update Docker images
cd ~/wireguard-vpn
docker-compose pull
docker-compose up -d

# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart WireGuard service
docker-compose restart

# Clean up Docker
docker system prune -f
```

### Bước 5: Security Hardening

```bash
# Change default passwords
# Edit .env file and update docker-compose.yaml

# Restrict UI access to specific IPs
# Update security group rules

# Enable fail2ban for SSH
sudo apt install -y fail2ban

# Configure automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🔧 Troubleshooting Guide

### Common Issues và Solutions

#### Issue 1: Cannot access WireGuard UI

```bash
# Check containers
docker-compose ps

# Check logs
docker-compose logs wireguard-ui

# Restart services
docker-compose restart

# Check firewall
sudo ufw status
```

#### Issue 2: VPN connection fails

```bash
# Check server logs
docker logs wireguard-server

# Verify client config
sudo wg show

# Check routing
ip route show

# Test UDP connectivity
nc -u YOUR-EC2-IP 51820
```

#### Issue 3: No internet through VPN

```bash
# Check IP forwarding
cat /proc/sys/net/ipv4/ip_forward

# Verify iptables rules
sudo iptables -L -n -v
sudo iptables -t nat -L -n -v

# Restart WireGuard
sudo wg-quick down wg0
sudo wg-quick up wg0
```

## 📚 Additional Resources

- [WireGuard Official Documentation](https://www.wireguard.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

---

**🔒 Security Note**: Đây là hướng dẫn chi tiết cho mục đích học tập và phát triển. Trong môi trường production, cần thêm các biện pháp bảo mật như certificate SSL, monitoring nâng cao, và access control nghiêm ngặt.
