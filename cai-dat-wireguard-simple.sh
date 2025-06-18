#!/bin/bash
# Script cài đặt WireGuard VPN siêu đơn giản

set -e

echo "=== Cài đặt WireGuard VPN siêu đơn giản ==="

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt"
    exit 1
fi

echo "✅ Docker đã sẵn sàng: $(docker --version)"

# Cấu hình firewall cơ bản (nếu cần)
if command -v ufw &> /dev/null; then
    echo "Cấu hình firewall..."
    sudo ufw allow 51820/udp 2>/dev/null || true
    sudo ufw allow 80/tcp 2>/dev/null || true
fi

# Bật IP forwarding
echo "Bật IP forwarding..."
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Tạo thư mục
echo "Tạo thư mục WireGuard..."
mkdir -p /home/ubuntu/wireguard
cd /home/ubuntu/wireguard

# Lấy IP công cộng
PUBLIC_IP=$(curl -s ifconfig.me || echo "127.0.0.1")
echo "IP công cộng: $PUBLIC_IP"

# Tạo docker-compose.yml siêu đơn giản
echo "Tạo cấu hình Docker Compose..."
cat > docker-compose.yml << EOF
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
      - SERVERURL=$PUBLIC_IP
      - SERVERPORT=51820
      - PEERS=10
      - PEERDNS=8.8.8.8
      - INTERNAL_SUBNET=10.13.13.0/24
      - ALLOWEDIPS=10.0.0.0/16
    volumes:
      - ./config:/config
    ports:
      - "51820:51820/udp"
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
    ports:
      - "80:5000"
    restart: unless-stopped
EOF

# Khởi động dịch vụ
echo "Khởi động WireGuard..."
docker compose up -d

# Chờ khởi động
echo "Chờ dịch vụ khởi động..."
sleep 30

# Kiểm tra trạng thái
if docker ps | grep -q wireguard; then
    echo
    echo "🎉 =================================="
    echo "✅ CÀI ĐẶT THÀNH CÔNG!"
    echo "🎉 =================================="
    echo
    echo "📋 THÔNG TIN TRUY CẬP:"
    echo "🌐 URL: http://$PUBLIC_IP"
    echo "👤 User: admin"
    echo "🔑 Pass: admin123"
    echo
    echo "🔧 LỆNH QUẢN LÝ:"
    echo "cd /home/ubuntu/wireguard"
    echo "docker compose ps        # Xem trạng thái"
    echo "docker compose logs -f   # Xem logs"
    echo "docker compose restart   # Khởi động lại"
    echo
    echo "📱 CÁCH TẠO VPN CLIENT:"
    echo "1. Truy cập: http://$PUBLIC_IP"
    echo "2. Đăng nhập: admin/admin123"
    echo "3. Click 'Clients' → 'Add Client'"
    echo "4. Nhập tên → Submit"
    echo "5. Download file .conf hoặc scan QR"
    echo
    echo "✅ WireGuard VPN sẵn sàng sử dụng!"
else
    echo "❌ Cài đặt thất bại!"
    echo "Xem logs: docker compose logs"
    exit 1
fi
