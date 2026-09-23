# TEST CASES: QUẢN LÝ BÀI ĐĂNG (LISTING LIFECYCLE)
## DỰ ÁN: CAMPUS MARKETPLACE

| Test Case ID | Tên chức năng | Điều kiện tiên quyết | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|---|---|
| **TC_LIST_01** | Tạo bài đăng bán hợp lệ | Đã đăng nhập, Karma >= 20 | 1. Upload 3 ảnh<br>2. Nhập tiêu đề, mô tả<br>3. Chọn danh mục: "Giáo trình"<br>4. Chọn loại: "Bán (Sell)"<br>5. Nhập giá: 50.000đ | Title: "Giáo trình Giải tích 1"<br>Price: 50000 | Bài đăng lưu thành công với trạng thái `ACTIVE`, hiển thị trên trang chủ | Pass |
| **TC_LIST_02** | Tạo bài đăng loại Bán nhưng giá <= 0 | Đã đăng nhập | 1. Chọn loại: "Bán"<br>2. Nhập giá: 0đ | Price: 0 | Form validation báo lỗi: "Giá bán phải lớn hơn 0đ đối với giao dịch Bán" | Pass |
| **TC_LIST_03** | Tạo bài đăng Tặng 0đ (Giveaway) | Đã đăng nhập | 1. Chọn loại: "Tặng 0đ"<br>2. Giá bị disabled và hiển thị 0đ<br>3. Nhập tiêu đề & ảnh | Type: `GIVEAWAY` | Lưu thành công bài đăng với badge màu hồng "Tặng 0đ" | Pass |
| **TC_LIST_04** | Giới hạn upload tối đa 6 ảnh | Màn hình đăng bài | 1. Chọn 7 file ảnh cùng lúc | 7 file ảnh .jpg | Hệ thống báo lỗi: "Chỉ được chọn tối đa 6 hình ảnh" | Pass |
| **TC_LIST_05** | Tìm kiếm theo mã học phần | Đã có bài đăng | 1. Nhập "IT3010" vào ô tìm kiếm | Query: "IT3010" | Danh sách trả về chỉ chứa bài đăng có môn học hoặc mô tả IT3010 | Pass |
