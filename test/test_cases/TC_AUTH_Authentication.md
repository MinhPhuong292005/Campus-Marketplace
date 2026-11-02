# TEST CASES: XÁC THỰC & HỒ SƠ SINH VIÊN (AUTH & PROFILE)
## DỰ ÁN: CAMPUS MARKETPLACE

| Test Case ID | Tên chức năng | Điều kiện tiên quyết | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|---|---|
| **TC_AUTH_01** | Đăng ký bằng email trường hợp lệ | Chưa có tài khoản | 1. Nhập email trường<br>2. Bấm "Gửi mã OTP"<br>3. Nhập OTP nhận được<br>4. Thiết lập mật khẩu | Email: `23010190@st.phenikaa-uni.edu.vn`<br>OTP: `6 số đúng` | Hệ thống tạo tài khoản, trả về JWT, cộng 20 điểm Karma, chuyển đến màn hình Setup Profile | Pass |
| **TC_AUTH_02** | Đăng ký bằng email cá nhân khi chưa whitelist domain | Domain không nằm trong danh sách trường | 1. Nhập email Gmail thông thường<br>2. Bấm tiếp tục | Email: `user@gmail.com` | Yêu cầu tải ảnh thẻ sinh viên để OCR hoặc duyệt thủ công | Pass |
| **TC_AUTH_03** | Đăng ký với OTP sai hoặc hết hạn | Đã yêu cầu mã OTP | 1. Nhập OTP sai quá 5 lần hoặc sau 5 phút | OTP: `000000` | Báo lỗi `40003: Mã OTP không chính xác hoặc đã hết hạn` | Pass |
| **TC_AUTH_04** | Bảo mật thông tin sinh viên trên Profile | Đã đăng nhập sinh viên | 1. Xem trang cá nhân của bạn học khác | URL: `/profile/student-99` | Không nhìn thấy Email, MSSV, Số điện thoại. Chỉ thấy Tên, Trường, Khoa, Campus, Karma | Pass |
| **TC_AUTH_05** | Rate limit gửi OTP | Đã bấm gửi OTP | 1. Bấm gửi liên tục 4 lần trong 1 phút | Email: `23010190@st.phenikaa-uni.edu.vn` | Từ lần thứ 4 báo lỗi `429: Vui lòng đợi 5 phút trước khi yêu cầu lại` | Pass |
