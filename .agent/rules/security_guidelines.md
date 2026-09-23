# AGENT RULES: NGUYÊN TẮC BẢO MẬT & BẢO VỆ DỮ LIỆU CÁ NHÂN
## DỰ ÁN: CAMPUS MARKETPLACE

Hệ thống phục vụ sinh viên các trường đại học tại Việt Nam, bắt buộc tuân thủ pháp luật và các tiêu chuẩn bảo mật nghiêm ngặt.

---

## 1. TUÂN THỦ NGHỊ ĐỊNH 13/2023/NĐ-CP (BẢO VỆ DỮ LIỆU CÁ NHÂN)
1. **Dữ liệu nhạy cảm được che giấu (Masked Data):**
   - Không để lộ: Email cá nhân, Mã số sinh viên (MSSV), Số điện thoại, Địa chỉ phòng trọ chi tiết trong bất kỳ API public nào.
   - Chỉ trả về: Tên hiển thị (hoặc biệt danh), Tên trường, Tên cơ sở (Campus), Tên Khoa/Khóa, và Điểm Karma.
2. **Mã hóa dữ liệu lưu trữ:**
   - Số điện thoại và MSSV trong cơ sở dữ liệu phải được mã hóa cấp ứng dụng bằng thuật toán AES-256 trước khi lưu.
   - Mật khẩu đăng nhập mã hóa một chiều bằng BCrypt với work factor tối thiểu 12.

---

## 2. PHÒNG CHỐNG CÁC LỖ HỔNG WEB & API PHỔ BIẾN
- **Chống SQL Injection:** Sử dụng triệt để Spring Data JPA Parameterized Queries, cấm nối chuỗi raw SQL với input người dùng.
- **Chống XSS:** Luôn escape ký tự HTML ở phía client và sanitize đầu vào ở backend với HTML Sanitizer.
- **Chống CSRF:** Cấu hình SameSite Cookie nghiêm ngặt cho Refresh Token.
- **Chống IDOR (Insecure Direct Object Reference):**
  - Mọi thao tác sửa/xóa bài đăng hoặc tin nhắn phải kiểm tra quyền sở hữu (`userId == currentAuthenticatedUser.id` hoặc role `ROLE_SUPER_ADMIN`).
- **Rate Limiting:**
  - API gửi OTP: Tối đa 3 lần / 10 phút trên mỗi email hoặc IP.
  - API tạo bài đăng: Tối đa 10 bài / ngày cho mỗi tài khoản sinh viên.
