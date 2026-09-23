# TEST CASES: CÁC LUỒNG GIAO DỊCH P2P (TRANSACTION FLOWS)
## DỰ ÁN: CAMPUS MARKETPLACE

| Test Case ID | Luồng giao dịch | Điều kiện | Các bước thực hiện | Kết quả mong đợi |
|---|---|---|---|---|
| **TC_TRAN_01** | Bán: Trả giá (Make Offer) | Người mua khác người bán | 1. Người mua xem bài đăng giá 100k<br>2. Bấm "Trả giá" -> nhập 80k<br>3. Người bán nhận thông báo và bấm "Đồng ý" | Tin nhắn tự động hiển thị trong chat "Đã đồng ý giá 80k", trạng thái chuyển sang `RESERVED` |
| **TC_TRAN_02** | Đổi đồ: Gửi Swap Proposal | Người đổi có ít nhất 1 bài active | 1. Vào bài đăng mục tiêu<br>2. Chọn món đồ đem đổi<br>3. Nhập bù tiền: 20k<br>4. Gửi đề xuất | Tạo bản ghi `swap_proposals` với status `PENDING`, bên nhận nhận được thông báo đề xuất đổi |
| **TC_TRAN_03** | Đổi đồ: Chấp nhận đề xuất | Đề xuất đang `PENDING` | 1. Người nhận bấm "Chấp nhận đổi" | Trạng thái proposal thành `ACCEPTED`, cả 2 bài đăng chuyển thành `RESERVED` |
| **TC_TRAN_04** | Thuê: Tạo hợp đồng & ảnh hiện trạng | Listing loại `RENT` | 1. Nhập ngày bắt đầu, ngày kết thúc<br>2. Upload 2 ảnh chụp vết xước máy tính trước khi giao<br>3. Xác nhận cọc 500k | Tạo hợp đồng `rental_contracts` thành công, lưu ảnh bằng chứng vào jsonb `proof_images` |
| **TC_TRAN_05** | Thuê: Hoàn tất trả đồ & hoàn cọc | Hợp đồng đang `ACTIVE` | 1. Hai bên kiểm tra lại máy<br>2. Bấm "Xác nhận đã trả đồ nguyên vẹn" | Trạng thái hợp đồng đổi thành `RETURNED`, kích hoạt popup đánh giá đối tác |
