# WireGuard VPN Server on AWS EC2

A complete guide to set up WireGuard VPN server on AWS EC2 (Ubuntu) with Docker and connect from local machines (Ubuntu/Windows).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [EC2 Setup](#ec2-setup)
- [WireGuard Installation](#wireguard-installation)
- [Security Group Configuration](#security-group-configuration)
- [Client Setup](#client-setup)
  - [Ubuntu Client](#ubuntu-client)
  - [Windows Client](#windows-client)
- [Testing Connection](#testing-connection)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## 🚀 Prerequisites

- AWS Account with EC2 access
- Ubuntu EC2 instance (t2.micro or larger)
- Basic knowledge of Linux commands
- SSH access to EC2 instance

## 🖥️ EC2 Setup

### 1. Launch EC2 Instance

1. **Launch Ubuntu Server 24.04 LTS**
2. **Instance Type**: t2.micro (or larger)
3. **Key Pair**: Create or use existing key pair
4. **Security Group**: Create new or use existing (we'll configure later)
5. **Storage**: 8GB (default is sufficient)

### 2. Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## 🔧 WireGuard Installation

### 1. Update System and Install Dependencies

```bash
# Update package lists
sudo apt update

# Install required packages
sudo apt install vim -y

# Install Docker (if not already installed)
sudo apt install docker.io -y

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
sudo docker-compose --version
```

### 2. Create WireGuard Configuration

```bash
# Create directory for WireGuard
mkdir wireguard
cd wireguard

# Create docker-compose.yaml file
vi docker-compose.yaml
```

### 3. Docker Compose Configuration

Copy and paste the following content into `docker-compose.yaml`:

```yaml
version: "3"

services:

  # WireGuard VPN service
  wireguard:
    image: linuxserver/wireguard:v1.0.20210914-ls6
    container_name: wireguard
    cap_add:
      - NET_ADMIN
    volumes:
      - ./config:/config
    ports:
      # Port for WireGuard-UI
      - "80:5000"
      # Port of the WireGuard VPN server
      - "51820:51820/udp"

  # WireGuard-UI service
  wireguard-ui:
    image: ngoduykhanh/wireguard-ui:latest
    container_name: wireguard-ui
    depends_on:
      - wireguard
    cap_add:
      - NET_ADMIN
    # Use the network of the 'wireguard' service
    # This enables to show active clients in the status page
    network_mode: service:wireguard
    environment:
      - SENDGRID_API_KEY
      - EMAIL_FROM_ADDRESS
      - EMAIL_FROM_NAME
      - SESSION_SECRET
      - WGUI_USERNAME=admin
      - WGUI_PASSWORD=password
      - WG_CONF_TEMPLATE
      - WGUI_MANAGE_START=true
      - WGUI_MANAGE_RESTART=true
    logging:
      driver: json-file
      options:
        max-size: 50m
    volumes:
      - ./db:/app/db
      - ./config:/etc/wireguard
```

### 4. Start WireGuard Services

```bash
# Start containers in detached mode
sudo docker-compose up -d

# Check if containers are running
sudo docker ps
```

You should see output similar to:
```
CONTAINER ID   IMAGE                                     COMMAND       CREATED         STATUS         PORTS                                                                                      NAMES
b6d236fd6abe   ngoduykhanh/wireguard-ui:latest           "./init.sh"   7 seconds ago   Up 7 seconds                                                                                              wireguard-ui
920d0078bdf8   linuxserver/wireguard:v1.0.20210914-ls6   "/init"       8 seconds ago   Up 7 seconds   0.0.0.0:51820->51820/udp, [::]:51820->51820/udp, 0.0.0.0:80->5000/tcp, [::]:80->5000/tcp   wireguard
```

## 🔒 Security Group Configuration

Configure AWS Security Group to allow necessary ports:

### Required Ports:
- **Port 22 (TCP)**: SSH access
- **Port 80 (TCP)**: WireGuard UI (HTTP)
- **Port 51820 (UDP)**: WireGuard VPN server
- **Port 443 (TCP)**: HTTPS (optional)

### AWS CLI Commands:

```bash
# Get your security group ID
aws ec2 describe-instances --region your-region

# Add HTTP port 80
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region your-region

# Add WireGuard UDP port 51820
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol udp \
    --port 51820 \
    --cidr 0.0.0.0/0 \
    --region your-region

# Add HTTPS port 443 (optional)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region your-region
```

## 🌐 WireGuard UI Configuration

### 1. Access WireGuard UI

Open your browser and navigate to:
```
http://YOUR-EC2-PUBLIC-IP
```

**Default Login Credentials:**
- Username: `admin`
- Password: `password`

### 2. Configure WireGuard Server

1. **Go to "Wireguard Server" tab**
2. **Configure Post Up Script:**
   ```bash
   iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
   ```
3. **Configure Post Down Script:**
   ```bash
   iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
   ```
4. **Click "Save" then "Apply Config"**

### 3. Configure Global Settings

1. **Go to "Global Settings" tab**
2. **Verify "Endpoint Address"** shows your EC2 public IP
3. **Set DNS Server** to `1.1.1.1` (default)
4. **Save and Apply Config**

### 4. Create Client Configuration

1. **Click "New Client"**
2. **Enter client name** (e.g., "My-Laptop")
3. **Enter email** (optional)
4. **Click "Submit"**
5. **Go to "Wireguard Clients" tab**
6. **Click "Download"** to get the `.conf` file

## 💻 Client Setup

### Ubuntu Client

#### 1. Install WireGuard

```bash
# Update package lists
sudo apt update

# Install WireGuard
sudo apt install wireguard -y
```

#### 2. Configure Client

```bash
# Copy the downloaded config file to WireGuard directory
sudo cp your-client-config.conf /etc/wireguard/wg0.conf

# Set proper permissions
sudo chmod 600 /etc/wireguard/wg0.conf
```

#### 3. Connect to VPN

```bash
# Start VPN connection
sudo wg-quick up wg0

# Check connection status
sudo wg show

# Stop VPN connection
sudo wg-quick down wg0
```

#### 4. Enable Auto-start (Optional)

```bash
# Enable WireGuard to start on boot
sudo systemctl enable wg-quick@wg0

# Start the service
sudo systemctl start wg-quick@wg0

# Check status
sudo systemctl status wg-quick@wg0
```

### Windows Client

#### 1. Download WireGuard

1. **Visit**: https://www.wireguard.com/install/
2. **Download**: "WireGuard for Windows"
3. **Install** the application

#### 2. Import Configuration

1. **Open WireGuard application**
2. **Click "Add Tunnel"**
3. **Select "Import tunnel(s) from file"**
4. **Choose** your downloaded `.conf` file
5. **Click "Activate"** to connect

#### 3. Alternative: QR Code Method

1. **In WireGuard UI**, go to "Wireguard Clients"
2. **Click on client name** to view QR code
3. **Use WireGuard mobile app** to scan QR code

## 🧪 Testing Connection

### 1. Check IP Address

Before connecting to VPN:
```bash
curl ifconfig.me
```

After connecting to VPN:
```bash
curl ifconfig.me
```

The IP should change to your EC2 instance's public IP.

### 2. Test DNS Resolution

```bash
# Test DNS resolution
nslookup google.com

# Test connectivity
ping google.com
```

### 3. Check WireGuard Status

**On Ubuntu Client:**
```bash
sudo wg show
```

**Expected output:**
```
interface: wg0
  public key: [your-public-key]
  private key: (hidden)
  listening port: [port]

peer: [server-public-key]
  endpoint: [ec2-ip]:51820
  allowed ips: 0.0.0.0/0
  latest handshake: [timestamp]
  transfer: [data transferred]
```

### 4. Monitor in WireGuard UI

1. **Go to "Status" tab** in WireGuard UI
2. **Check active connections**
3. **Monitor data transfer**

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Cannot Access WireGuard UI

**Problem**: Browser cannot load `http://your-ec2-ip`

**Solutions:**
```bash
# Check if containers are running
sudo docker ps

# Check container logs
sudo docker logs wireguard
sudo docker logs wireguard-ui

# Restart containers
cd /home/ubuntu/wireguard
sudo docker-compose down
sudo docker-compose up -d

# Check if port 80 is listening
sudo netstat -tlnp | grep :80
```

#### 2. VPN Connection Fails

**Problem**: Client cannot connect to VPN server

**Solutions:**
```bash
# Check security group allows port 51820/UDP
# Verify endpoint address in Global Settings
# Check WireGuard server logs
sudo docker logs wireguard

# Test UDP connectivity from client
nc -u your-ec2-ip 51820
```

#### 3. No Internet Access Through VPN

**Problem**: Connected to VPN but no internet access

**Solutions:**
1. **Verify Post Up/Down scripts** are configured correctly
2. **Check DNS settings** in Global Settings
3. **Restart WireGuard server**:
   ```bash
   sudo docker-compose restart
   ```

#### 4. Ubuntu Client Connection Issues

```bash
# Check WireGuard configuration
sudo wg show

# Check routing table
ip route

# Check if wg0 interface exists
ip addr show wg0

# Restart WireGuard
sudo wg-quick down wg0
sudo wg-quick up wg0
```

### Log Files

**Container logs:**
```bash
sudo docker logs wireguard
sudo docker logs wireguard-ui
```

**Ubuntu client logs:**
```bash
sudo journalctl -u wg-quick@wg0
```

## 🔐 Security Considerations

### 1. Change Default Credentials

**Immediately change default password:**

1. **Stop containers:**
   ```bash
   sudo docker-compose down
   ```

2. **Edit docker-compose.yaml:**
   ```bash
   vi docker-compose.yaml
   ```

3. **Change password:**
   ```yaml
   - WGUI_PASSWORD=your_strong_password_here
   ```

4. **Restart containers:**
   ```bash
   sudo docker-compose up -d
   ```

### 2. Firewall Configuration

**Restrict access to WireGuard UI:**
```bash
# Allow only specific IP to access UI (replace with your IP)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr YOUR-IP/32 \
    --region your-region
```

### 3. Regular Updates

```bash
# Update containers regularly
sudo docker-compose pull
sudo docker-compose up -d
```

### 4. Monitor Access

- **Check WireGuard UI "Status" tab** regularly
- **Monitor unusual connection patterns**
- **Review client configurations** periodically

## 📚 Additional Resources

- [WireGuard Official Documentation](https://www.wireguard.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is licensed under the MIT License.

---

**⚠️ Important Security Note**: This setup is for educational and development purposes. For production use, implement additional security measures including proper authentication, monitoring, and access controls.
