# 📖 VPBank K-MULT Agent Studio - User Manual

## 🎯 **Giới thiệu**

VPBank K-MULT Agent Studio là hệ thống đa tác nhân AI tiên tiến được thiết kế để tự động hóa các quy trình ngân hàng phức tạp, đặc biệt tập trung vào:

- **Xử lý Letter of Credit (LC)**: Giảm thời gian từ 8-12 giờ xuống dưới 30 phút
- **Đánh giá đề xuất tín dụng**: Phân tích rủi ro tự động và chấm điểm
- **Xử lý tài liệu thông minh**: OCR với độ chính xác 99.5% cho tiếng Việt
- **Kiểm tra tuân thủ**: Xác thực theo UCP 600, ISBP 821, quy định SBV

## 🚀 **Bắt đầu nhanh**

### **1. Truy cập hệ thống**
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/health

### **2. Đăng nhập và xác thực**
1. Mở trình duyệt và truy cập web interface
2. Nhập thông tin đăng nhập (nếu được yêu cầu)
3. Xác minh kết nối với backend API

### **3. Kiểm tra trạng thái hệ thống**
```bash
# Kiểm tra trạng thái tất cả services
./deployment/scripts/manage.sh status

# Xem logs ứng dụng
./deployment/scripts/manage.sh logs
```

## 🤖 **Sử dụng Multi-Agent System**

### **Pure Strands - Xử lý thông minh**

**Tính năng chính:**
- Định tuyến thông minh dựa trên nội dung tin nhắn
- Hỗ trợ xử lý file và text đồng thời
- Tích hợp NLP tiếng Việt chuyên sâu

**Cách sử dụng:**

1. **Xử lý chỉ text:**
   ```
   Tin nhắn: "Xin chào, bạn là ai?"
   → Hệ thống tự động định tuyến đến agent phù hợp
   ```

2. **Xử lý file + text:**
   ```
   Tin nhắn: "Tóm tắt tài liệu này"
   File: Upload PDF/DOCX/TXT
   → Hệ thống xử lý file và tạo tóm tắt
   ```

3. **Các từ khóa định tuyến:**
   - "tóm tắt" → Text Summary Agent
   - "kiểm tra", "tuân thủ" → Compliance Agent
   - "phân tích", "rủi ro" → Risk Analysis Agent

## 📄 **Xử lý tài liệu**

### **Tóm tắt tài liệu**

**Bước 1: Chuẩn bị tài liệu**
- Định dạng hỗ trợ: PDF, DOCX, TXT
- Kích thước tối đa: 50MB
- Ngôn ngữ: Tiếng Việt, Tiếng Anh

**Bước 2: Upload và xử lý**
1. Truy cập trang "Document Summarization"
2. Chọn file cần tóm tắt
3. Chọn loại tóm tắt:
   - **General**: Tóm tắt tổng quan
   - **Executive**: Tóm tắt điều hành
   - **Technical**: Tóm tắt kỹ thuật
4. Chọn ngôn ngữ output
5. Nhấn "Summarize"

**Bước 3: Xem kết quả**
- Tóm tắt được hiển thị với thông tin chi tiết
- Tỷ lệ nén và thời gian xử lý
- Tùy chọn download hoặc copy

### **OCR và trích xuất text**

**Tính năng:**
- OCR độ chính xác cao cho tiếng Việt
- Hỗ trợ nhiều định dạng ảnh
- Tự động phát hiện ngôn ngữ

**Cách sử dụng:**
1. Upload file ảnh (JPG, PNG, TIFF)
2. Chọn ngôn ngữ (Vietnamese/English)
3. Hệ thống tự động trích xuất text
4. Kết quả có thể edit và export

## 💰 **Đánh giá rủi ro tín dụng**

### **Quy trình đánh giá**

**Bước 1: Nhập thông tin cơ bản**
- Tên khách hàng/doanh nghiệp
- Số tiền vay yêu cầu
- Loại hình kinh doanh
- Mục đích vay

**Bước 2: Upload tài liệu tài chính**
- Báo cáo tài chính
- Bảng cân đối kế toán
- Báo cáo lưu chuyển tiền tệ
- Giấy tờ pháp lý

**Bước 3: Chọn loại đánh giá**
- **Basic**: Đánh giá cơ bản
- **Comprehensive**: Đánh giá toàn diện
- **Detailed**: Đánh giá chi tiết với mô hình ML

**Bước 4: Xem kết quả**
- Điểm tín dụng (Credit Score)
- Mức độ rủi ro (Risk Level)
- Khuyến nghị (Recommendations)
- Báo cáo chi tiết

### **Giải thích kết quả**

**Credit Score:**
- 800-900: Rủi ro thấp (Low Risk)
- 600-799: Rủi ro trung bình (Medium Risk)
- 400-599: Rủi ro cao (High Risk)
- <400: Rủi ro rất cao (Very High Risk)

**Risk Factors:**
- Tỷ lệ nợ/tài sản
- Khả năng thanh toán
- Lịch sử tín dụng
- Tình hình tài chính

## ⚖️ **Kiểm tra tuân thủ**

### **Letter of Credit (LC) Processing**

**Bước 1: Upload tài liệu LC**
- Thư tín dụng gốc
- Tài liệu vận chuyển
- Hóa đơn thương mại
- Chứng từ bảo hiểm

**Bước 2: Cấu hình kiểm tra**
- Số LC
- Loại kiểm tra: Full validation / Quick check
- Tiêu chuẩn tuân thủ:
  - UCP 600 (Uniform Customs and Practice)
  - ISBP 821 (International Standard Banking Practice)
  - SBV (State Bank of Vietnam regulations)

**Bước 3: Xem kết quả kiểm tra**
- Trạng thái tuân thủ tổng thể
- Chi tiết từng điều khoản
- Danh sách lỗi và cảnh báo
- Khuyến nghị khắc phục

### **Compliance Dashboard**

**Tính năng:**
- Theo dõi real-time compliance status
- Báo cáo tuân thủ định kỳ
- Cảnh báo vi phạm
- Audit trail đầy đủ

## 🔧 **Quản lý hệ thống**

### **Monitoring và Logs**

**Xem logs:**
```bash
# Logs tổng thể
./deployment/scripts/manage.sh logs

# Logs backend
./deployment/scripts/manage.sh logs mutil-agent

# Logs frontend
./deployment/scripts/manage.sh logs frontend
```

**Health Checks:**
```bash
# Kiểm tra trạng thái services
./deployment/scripts/manage.sh status

# Kiểm tra health endpoints
curl http://localhost:8080/mutil_agent/public/api/v1/health-check/health
```

### **Backup và Recovery**

**Backup dữ liệu:**
```bash
# Backup database
./tools/backup/backup_database.sh

# Backup configurations
./tools/backup/backup_configs.sh
```

**Recovery:**
```bash
# Restore từ backup
./tools/backup/restore_database.sh backup_file.sql
```

## 🚨 **Troubleshooting**

### **Lỗi thường gặp**

**1. Service không khởi động được**
```bash
# Kiểm tra logs
docker logs vpbank-kmult-backend

# Restart services
./deployment/scripts/manage.sh restart
```

**2. API trả về lỗi 404**
- Kiểm tra endpoint URL
- Xác minh service đang chạy
- Kiểm tra network connectivity

**3. File upload thất bại**
- Kiểm tra kích thước file (max 50MB)
- Xác minh định dạng file được hỗ trợ
- Kiểm tra disk space

**4. OCR không chính xác**
- Đảm bảo chất lượng ảnh tốt
- Chọn đúng ngôn ngữ
- Thử với file PDF thay vì ảnh

### **Performance Optimization**

**Tối ưu hóa xử lý:**
- Sử dụng file PDF thay vì ảnh scan
- Chia nhỏ tài liệu lớn
- Xử lý batch cho nhiều file

**Monitoring Performance:**
- Response time < 3 seconds
- Throughput > 1000 docs/hour
- Error rate < 1%

## 📞 **Hỗ trợ kỹ thuật**

### **Liên hệ**
- **Team**: Multi-Agent Hackathon 2025 - Group 181
- **Documentation**: http://localhost:8080/docs
- **Health Dashboard**: http://localhost:8080/health

### **Báo cáo lỗi**
1. Mô tả chi tiết lỗi
2. Cung cấp logs liên quan
3. Các bước tái tạo lỗi
4. Screenshots nếu có

### **Feature Requests**
- Gửi yêu cầu tính năng mới
- Đề xuất cải tiến
- Feedback về user experience
