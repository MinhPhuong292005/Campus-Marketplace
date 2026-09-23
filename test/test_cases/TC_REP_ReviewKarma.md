# TEST CASES: ĐÁNH GIÁ 2 CHIỀU & TÍN NHIỆM CAMPUS KARMA
## DỰ ÁN: CAMPUS MARKETPLACE

| Test Case ID | Tên chức năng | Tình huống | Các bước | Kết quả mong đợi |
|---|---|---|---|---|
| **TC_REP_01** | Đánh giá 5 sao sau khi mua đồ | Giao dịch hoàn tất | 1. Người mua chọn 5 sao<br>2. Chọn tag: "Đúng giờ", "Nhiệt tình"<br>3. Gửi đánh giá | Điểm Karma của người bán tự động cộng +5 điểm, hiển thị badge tín nhiệm mới |
| **TC_REP_02** | Hoàn tất giao dịch Tặng 0đ | Người nhận đã lấy đồ | 1. Người tặng bấm xác nhận trao tặng thành công | Người tặng được cộng +10 điểm Karma |
| **TC_REP_03** | Báo cáo hành vi Bom hẹn | Đối tác không đến điểm hẹn | 1. Bấm Báo cáo -> Chọn lý do "Bom hẹn"<br>2. Gửi kèm ảnh chụp màn hình chat đã hẹn | Moderator duyệt báo cáo -> Hệ thống trừ 15 điểm Karma của người bị tố cáo |
| **TC_REP_04** | Điểm Karma tụt xuống mức âm | Bị báo cáo nhiều lần | 1. Người dùng có điểm Karma < 0 | Nút "Đăng bài" bị vô hiệu hóa kèm thông báo: "Tài khoản của bạn tạm thời bị khóa tính năng đăng bài do điểm Karma quá thấp" |
