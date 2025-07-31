# Background Service Setup Guide
## VPBank K-MULT Agent Studio - Multi-Agent Hackathon 2025

<div align="center">

[![Background Running](https://img.shields.io/badge/Status-Running_in_Background-green.svg?style=flat-square)](.)
[![Services](https://img.shields.io/badge/Services-2_Active-blue.svg?style=flat-square)](.)
[![Uptime](https://img.shields.io/badge/Uptime-24%2F7-success.svg?style=flat-square)](.)

**Complete Background Service Management Setup**

</div>

---

## ✅ **Background Services Now Running**

Your VPBank K-MULT Agent Studio is now running in **detached mode** (background) and will continue running even after you close your terminal session.

### **🔍 Current Status**
```bash
✅ Frontend: Running on http://localhost:3000 (HTTP 200)
✅ Backend: Running on http://localhost:8080 (HTTP 200)
✅ Multi-Agent System: 6/6 agents active and operational
✅ Container Health: Both services healthy
```

---

## 🛠️ **Management Tools Created**

### **1. Service Monitor Script**
**Location**: `/home/ubuntu/multi-agent-hackathon/monitor_services.sh`

**Usage**:
```bash
./monitor_services.sh
```

**Shows**:
- Container status and health
- Service accessibility (HTTP status codes)
- Multi-agent system status
- Resource usage (memory, disk)
- Access URLs and quick commands

### **2. Background Management Script**
**Location**: `/home/ubuntu/multi-agent-hackathon/manage_background.sh`

**Commands**:
```bash
./manage_background.sh start     # Start services in background
./manage_background.sh stop      # Stop all services
./manage_background.sh restart   # Restart all services
./manage_background.sh status    # Show detailed status
./manage_background.sh logs      # Show service logs
./manage_background.sh health    # Quick health check
./manage_background.sh update    # Pull latest code and rebuild
```

### **3. Convenient Aliases**
After reloading your shell (`source ~/.bashrc`), you can use:

```bash
vpbank start        # Start services
vpbank stop         # Stop services
vpbank status       # Check status
vpbank-logs         # View logs
```

---

## 🌐 **Access Information**

### **Service URLs**
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/mutil_agent/public/api/v1/health-check/health

### **Key Features Available**
- **Homepage**: Real-time agent dashboard
- **Text Summary**: Vietnamese document processing
- **Agent Dashboard**: Multi-agent coordination
- **LC Processing**: Banking compliance validation
- **System Monitoring**: Live health metrics

---

## 📋 **Common Management Tasks**

### **Check Service Status**
```bash
# Quick status check
docker ps | grep vpbank

# Detailed status with monitoring script
./monitor_services.sh

# Health check only
./manage_background.sh health
```

### **View Service Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend

# Using management script
./manage_background.sh logs
./manage_background.sh logs backend
```

### **Restart Services**
```bash
# Restart all services
docker-compose restart

# Using management script
./manage_background.sh restart
```

### **Stop Services**
```bash
# Stop all services
docker-compose down

# Using management script
./manage_background.sh stop
```

### **Update and Rebuild**
```bash
# Pull latest code and rebuild
git pull origin fix-api-mapping
docker-compose build
docker-compose up -d

# Using management script (does all above)
./manage_background.sh update
```

---

## 🔧 **Troubleshooting**

### **If Services Stop Working**
```bash
# Check container status
docker ps | grep vpbank

# Check logs for errors
docker-compose logs --tail=50

# Restart services
./manage_background.sh restart

# If still issues, rebuild
docker-compose down
docker-compose build
docker-compose up -d
```

### **If Port Conflicts**
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080

# Stop conflicting services or change ports in docker-compose.yml
```

### **Resource Issues**
```bash
# Check system resources
free -h
df -h

# Clean up Docker if needed
docker system prune -f
docker image prune -f
```

---

## 🚀 **Auto-Start on Boot (Optional)**

### **Enable Systemd Service**
```bash
# Copy service file
sudo cp /tmp/vpbank-kmult.service /etc/systemd/system/

# Enable auto-start
sudo systemctl enable vpbank-kmult.service

# Start service
sudo systemctl start vpbank-kmult.service

# Check status
sudo systemctl status vpbank-kmult.service
```

### **Disable Auto-Start**
```bash
sudo systemctl disable vpbank-kmult.service
sudo systemctl stop vpbank-kmult.service
```

---

## 📊 **Monitoring and Maintenance**

### **Regular Health Checks**
```bash
# Set up a cron job for monitoring (optional)
echo "*/5 * * * * /home/ubuntu/multi-agent-hackathon/manage_background.sh health >> /var/log/vpbank-health.log" | crontab -
```

### **Log Rotation**
```bash
# Docker handles log rotation automatically, but you can configure it in docker-compose.yml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### **Backup Important Data**
```bash
# Backup configuration and data
tar -czf vpbank-backup-$(date +%Y%m%d).tar.gz \
  /home/ubuntu/multi-agent-hackathon/docker-compose.yml \
  /home/ubuntu/multi-agent-hackathon/src \
  /home/ubuntu/multi-agent-hackathon/data
```

---

## 🎯 **Hackathon Demo Preparation**

### **Pre-Demo Checklist**
```bash
# 1. Verify all services are running
./manage_background.sh status

# 2. Test key endpoints
curl http://localhost:3000
curl http://localhost:8080/mutil_agent/public/api/v1/health-check/health

# 3. Check agent coordination
curl -X POST http://localhost:8080/mutil_agent/api/v1/agents/coordinate \
  -H "Content-Type: application/json" \
  -d '{"task_type": "demo", "priority": "high"}'

# 4. Test Vietnamese processing
curl -X POST http://localhost:8080/mutil_agent/api/v1/text/summary/text \
  -H "Content-Type: application/json" \
  -d '{"text": "VPBank demo test", "summary_type": "general"}'
```

### **Demo URLs Ready**
- **Main Dashboard**: http://localhost:3000
- **Agent Monitoring**: http://localhost:3000/agent-dashboard
- **Text Processing**: http://localhost:3000/text-summary
- **System Health**: http://localhost:3000/system

---

## 📱 **Remote Access (If Needed)**

### **SSH Tunneling for Remote Demo**
```bash
# From your local machine, create SSH tunnel
ssh -L 3000:localhost:3000 -L 8080:localhost:8080 ubuntu@your-server-ip

# Then access locally at:
# http://localhost:3000 (Frontend)
# http://localhost:8080 (Backend)
```

### **Nginx Reverse Proxy (Advanced)**
```bash
# Install nginx
sudo apt install nginx

# Configure reverse proxy for external access
# (Configure SSL certificates for production)
```

---

<div align="center">

## ✅ **Background Setup Complete**

**VPBank K-MULT Agent Studio - Multi-Agent Hackathon 2025**

**🏃‍♂️ Running in Background | 🔧 Management Tools Ready | 🎯 Demo Prepared**

**Services will continue running 24/7 until manually stopped**

**Access: http://localhost:3000 | Monitor: ./monitor_services.sh**

</div>

---

## 📞 **Quick Reference**

| Task | Command |
|------|---------|
| **Check Status** | `./monitor_services.sh` |
| **View Logs** | `docker-compose logs -f` |
| **Restart** | `./manage_background.sh restart` |
| **Stop** | `./manage_background.sh stop` |
| **Health Check** | `./manage_background.sh health` |
| **Update Code** | `./manage_background.sh update` |

**🎉 Your VPBank K-MULT Agent Studio is now running 24/7 in the background!**
