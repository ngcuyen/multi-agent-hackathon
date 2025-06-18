# Quick Test Guide

## 🚀 Quick Setup Commands

### On EC2 Server:
```bash
# 1. Install dependencies
sudo apt update
sudo apt install docker.io vim -y
sudo systemctl start docker
sudo systemctl enable docker

# 2. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Create WireGuard setup
mkdir wireguard && cd wireguard
# Copy docker-compose.yaml content from README

# 4. Start services
sudo docker-compose up -d

# 5. Check status
sudo docker ps
```

### Configure Security Group:
```bash
# Allow HTTP (port 80)
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0 --region your-region

# Allow WireGuard (port 51820/UDP)
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol udp --port 51820 --cidr 0.0.0.0/0 --region your-region
```

## 🌐 Access WireGuard UI

1. **URL**: http://YOUR-EC2-PUBLIC-IP
2. **Login**: admin / password
3. **Configure server** with iptables rules
4. **Create client** and download .conf file

## 💻 Client Test Commands

### Ubuntu Client:
```bash
# Install WireGuard
sudo apt install wireguard -y

# Copy config file
sudo cp client-config.conf /etc/wireguard/wg0.conf
sudo chmod 600 /etc/wireguard/wg0.conf

# Connect
sudo wg-quick up wg0

# Test IP change
curl ifconfig.me

# Check status
sudo wg show

# Disconnect
sudo wg-quick down wg0
```

### Windows Client:
1. Download WireGuard from https://www.wireguard.com/install/
2. Install and import .conf file
3. Click "Activate"
4. Check IP at https://whatismyipaddress.com/

## ✅ Verification Checklist

- [ ] EC2 instance running
- [ ] Docker containers up
- [ ] Security group configured
- [ ] WireGuard UI accessible
- [ ] Server configured with iptables
- [ ] Client created and config downloaded
- [ ] Client connected successfully
- [ ] IP address changed to EC2 IP
- [ ] Internet access through VPN working

## 🔧 Quick Troubleshooting

```bash
# Restart containers
sudo docker-compose down && sudo docker-compose up -d

# Check logs
sudo docker logs wireguard
sudo docker logs wireguard-ui

# Check ports
sudo netstat -tlnp | grep :80
sudo netstat -ulnp | grep :51820

# Test local access
curl -I http://localhost:80
```

## 📊 Test Results Template

**Server Info:**
- EC2 Public IP: `_____________`
- WireGuard UI: `http://_____________`
- Server Status: ✅ / ❌

**Client Test:**
- OS: Ubuntu / Windows
- Connection Status: ✅ / ❌
- IP Before VPN: `_____________`
- IP After VPN: `_____________`
- Internet Access: ✅ / ❌

**Performance:**
- Connection Speed: `_____________`
- Latency: `_____________`
- DNS Resolution: ✅ / ❌
