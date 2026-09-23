# SPRINT 2 BACKLOG: GIAO DỊCH NÂNG CAO & QUẢN TRỊ KIỂM DUYỆT
## DỰ ÁN: CAMPUS MARKETPLACE

- **Mục tiêu Sprint 2:** Triển khai 2 mô hình giao dịch phức tạp: Cho thuê (Rent) kèm cọc và tình trạng tài sản; Đổi đồ (Swap) có bù trừ tiền; Tích hợp xác thực thẻ sinh viên qua OCR; Xây dựng Dashboard cho Moderator/Admin xử lý tranh chấp và báo cáo.
- **Thời lượng:** 2 tuần (10 ngày làm việc).

---

## DANH SÁCH USER STORIES

### US-07: Đề xuất Đổi đồ (Swap Proposal)
- **As a** Sinh viên có đồ muốn đổi,
- **I want to** gửi đề xuất đổi đồ bằng một bài đăng hiện có của mình kèm số tiền bù trừ (nếu có),
- **So that** tôi có thể trao đổi đồ vật với bạn học mà không cần tốn nhiều chi phí.
- **Acceptance Criteria (AC):**
  1. Người gửi chọn 1 trong các bài đăng `ACTIVE` của mình để đem đi đổi.
  2. Có thể nhập số tiền bù thêm (người gửi bù hoặc người nhận bù).
  3. Người nhận có quyền "Chấp nhận", "Từ chối" hoặc "Thương lượng lại".
  4. Khi chấp nhận: Cả 2 bài đăng chuyển sang trạng thái `RESERVED`.
- **Tasks:**
  - [Backend] Bảng `swap_proposals`, API POST/PUT `/api/v1/student/swap-proposals`.
  - [Frontend] Giao diện `SwapModal.tsx`, danh sách đề xuất đổi `SwapProposalList.tsx`.

---

### US-08: Hợp đồng Thuê đồ & Quản lý Cọc (Rental Contracts)
- **As a** Sinh viên muốn thuê máy tính/máy tính bỏ túi/áo cử nhân,
- **I want to** thuê đồ theo ngày hoặc theo học kỳ, ghi nhận tiền cọc và tình trạng máy trước khi nhận,
- **So that** quyền lợi và tài sản của cả hai bên được đảm bảo minh bạch.
- **Acceptance Criteria (AC):**
  1. Bài đăng thuê có: Giá thuê theo ngày/kỳ, số tiền đặt cọc bắt buộc.
  2. Trước khi bàn giao: Người cho thuê và người thuê cùng upload ảnh chụp hiện trạng thiết bị vào hợp đồng `rental_contracts`.
  3. Ghi nhận ngày bắt đầu, ngày kết thúc dự kiến, trạng thái (`PENDING`, `ACTIVE`, `RETURNED`, `DISPUTED`).
  4. Khi hoàn trả an toàn: Hoàn cọc và hoàn tất hợp đồng.
- **Tasks:**
  - [Backend] Bảng `rental_contracts`, API tạo và xác nhận bàn giao/trả đồ.
  - [Frontend] Giao diện quản lý hợp đồng thuê `RentalContractDetail.tsx`.

---

### US-09: Xác thực Thẻ Sinh viên qua OCR (Dành cho trường chưa có email Edu)
- **As a** Sinh viên chưa được cấp email trường,
- **I want to** tải lên ảnh chụp 2 mặt thẻ sinh viên để hệ thống tự động nhận diện họ tên, trường và MSSV,
- **So that** tài khoản của tôi được xác thực thẻ SV và hưởng trọn vẹn quyền lợi.
- **Acceptance Criteria (AC):**
  1. Tải lên 2 ảnh thẻ SV rõ nét.
  2. OCR đọc thông tin: Họ tên, MSSV, Khóa học. Nếu độ tin cậy > 90% thì tự động xác thực, nếu thấp hơn thì chuyển Admin duyệt thủ công.
  3. Xác thực thẻ SV thành công: Cộng +15 điểm Campus Karma.
- **Tasks:**
  - [Backend] Tích hợp dịch vụ OCR, lưu vết xác thực tại bảng `users`.
  - [Frontend] Màn hình `StudentCardVerifyModal.tsx`.

---

### US-10: Quản trị Báo cáo vi phạm & Giải quyết tranh chấp (Moderation & Disputes)
- **As a** Campus Moderator / Admin,
- **I want to** xem danh sách các bài đăng/người dùng bị tố cáo, xem lịch sử chat và bằng chứng ảnh để xử lý,
- **So that** giữ gìn môi trường mua bán học đường an toàn, không có lừa đảo.
- **Acceptance Criteria (AC):**
  1. Danh sách báo cáo phân theo loại: `BOM_HEN`, `HANG_GIA`, `SCAM_LUA_DAO`, `NOI_DUNG_CAM`.
  2. Moderator có quyền xem log chat liên quan giữa 2 bên để kiểm tra chứng cứ.
  3. Các chế tài: Cảnh cáo, trừ 15 điểm Karma (bom hẹn), hoặc Khóa tài khoản vĩnh viễn (scam).
- **Tasks:**
  - [Backend] API `/api/v1/admin/reports`, `/api/v1/admin/reports/{id}/resolve`.
  - [Frontend] Trang quản trị `AdminModerationPage.tsx`, xem bằng chứng và ra quyết định.
