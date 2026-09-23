# TEST CASES: CHAT REALTIME & ANTI-FRAUD SHIELD
## DỰ ÁN: CAMPUS MARKETPLACE

| Test Case ID | Tên chức năng | Tình huống kiểm thử | Các bước | Kết quả mong đợi |
|---|---|---|---|---|
| **TC_CHAT_01** | Gửi và nhận tin nhắn realtime | 2 user cùng mở phòng chat | 1. User A gửi tin "Hẹn gặp ở sảnh KTX B5 nhé"<br>2. Quan sát màn hình User B | User B nhận tin nhắn tức thì độ trễ < 300ms, không cần tải lại trang |
| **TC_CHAT_02** | Anti-Fraud: Phát hiện từ khóa lừa đảo | Kẻ gian yêu cầu cọc ngoài | 1. User gửi tin "Chuyển khoản cọc trước 200k vào số tài khoản 1903..." | Hệ thống hiển thị hộp cảnh báo màu đỏ ngay dưới tin nhắn: "⚠️ CẢNH BÁO: Không chuyển khoản cọc trước khi gặp mặt trực tiếp tại trường!" |
| **TC_CHAT_03** | Đề xuất Điểm hẹn an toàn (Safe Meeting Point) | Trong khung chat | 1. Bấm icon vị trí<br>2. Chọn "Thư viện Tạ Quang Bửu - Tầng 1" | Tin nhắn hiển thị dạng card địa điểm kèm bản đồ hướng dẫn |
