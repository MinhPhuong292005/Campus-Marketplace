# MASTER TEST PLAN (KẾ HOẠCH KIỂM THỬ TỔNG THỂ)
## DỰ ÁN: CAMPUS MARKETPLACE

---

## 1. MỤC TIÊU KIỂM THỬ
Đảm bảo chất lượng toàn diện của hệ thống Campus Marketplace trước khi đưa vào vận hành tại các trường đại học, bao gồm:
- Tính đúng đắn của các nghiệp vụ giao dịch P2P: Bán, Thuê, Tặng, Đổi.
- Bảo mật thông tin sinh viên theo Nghị định 13/2023/NĐ-CP.
- Khả năng chịu tải và tốc độ phản hồi theo chỉ số SLA trong tài liệu SRS (< 1.5s load page, < 300ms chat).

---

## 2. PHẠM VI KIỂM THỬ (TEST SCOPE)

### 2.1 Kiểm thử chức năng (Functional Testing)
1. **Module Auth:** Đăng ký/đăng nhập email trường, xác thực OTP, Google SSO, OCR thẻ SV.
2. **Module Listing:** Tạo, sửa, xóa, tìm kiếm, lọc bài đăng theo danh mục và cơ sở.
3. **Module Giao dịch:**
   - Luồng Bán (Thương lượng giá, chốt đơn).
   - Luồng Thuê (Tính cọc, upload ảnh hiện trạng, xác nhận hoàn trả).
   - Luồng Tặng (Gửi lời nhắn, chọn người nhận).
   - Luồng Đổi đồ (Gửi bài đăng đối ứng, thỏa thuận bù tiền).
4. **Module Chat & Anti-Fraud:** Chat realtime, chặn từ khóa lừa đảo.
5. **Module Đánh giá & Karma:** Tích lũy và trừ điểm uy tín sinh viên.
6. **Module Quản trị:** Kiểm duyệt bài đăng, xử lý báo cáo vi phạm.

### 2.2 Kiểm thử phi chức năng (Non-Functional Testing)
1. **Bảo mật (Security Test):** SQL Injection, XSS, CSRF, IDOR, Rate Limiting OTP.
2. **Hiệu năng (Performance Test):** Giả lập 15.000 CCU truy cập đồng thời vào mùa cao điểm đầu năm học bằng k6 / JMeter.
3. **Responsive UI Test:** Kiểm tra hiển thị trên thiết bị di động (iOS Safari, Android Chrome).
