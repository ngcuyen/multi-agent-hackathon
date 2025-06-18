# Hướng Dẫn Cài Đặt WireGuard Đơn Giản

## 🚀 Cài Đặt Nhanh

### 1. Kết nối EC2
```bash
ssh -i hospital-key.pem ubuntu@EC2_IP
```

### 2. Chạy script
```bash
# Tải script
wget https://raw.githubusercontent.com/your-repo/cai-dat-wireguard-don-gian.sh

# Cài đặt
chmod +x cai-dat-wireguard-don-gian.sh
sudo ./cai-dat-wireguard-don-gian.sh
```

**Thời gian**: 5-10 phút

## 📋 Thông Tin Truy Cập

Sau khi cài đặt xong:
- **URL**: `http://EC2_PUBLIC_IP`
- **Username**: `admin`
- **Password**: `admin123`

## 👥 Tạo VPN Client

1. Truy cập `http://EC2_PUBLIC_IP`
2. Đăng nhập: admin/admin123
3. Click **"Clients"** → **"Add Client"**
4. Nhập tên client → **"Submit"**
5. Download file `.conf` hoặc scan QR code

## 📱 Kết Nối

### Desktop:
1. Tải WireGuard từ wireguard.com
2. Import file `.conf`
3. Connect

### Mobile:
1. Tải WireGuard app
2. Scan QR code
3. Connect

## 🔧 Quản Lý

```bash
cd /opt/wireguard

# Xem trạng thái
docker-compose ps

# Xem logs
docker-compose logs -f

# Khởi động lại
docker-compose restart

# Dừng
docker-compose down

# Khởi động
docker-compose up -d
```

## ✅ Kiểm Tra

```bash
# Trên server
sudo docker exec wireguard wg show

# Từ client test ping
ping 10.0.0.2
```

## 🔒 Security Groups

Đảm bảo EC2 Security Group có:
```
Inbound:
- SSH (22): Your IP
- WireGuard (51820/UDP): 0.0.0.0/0
- HTTP (80): Your IP (cho quản lý)
```

Đơn giản vậy thôi! 🎉
