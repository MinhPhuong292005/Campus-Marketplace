# SPRINT 1 BACKLOG: NỀN TẢNG CỐT LÕI & GIAO DỊCH MVP
## DỰ ÁN: CAMPUS MARKETPLACE

- **Mục tiêu Sprint 1:** Xây dựng luồng hoàn chỉnh từ xác thực sinh viên (Edu Email/SSO), tạo hồ sơ Campus Profile, đăng và duyệt tin Bán (Sell) & Tặng (Giveaway), chat realtime P2P, đánh giá 2 chiều và tính điểm Campus Karma.
- **Thời lượng:** 2 tuần (10 ngày làm việc).

---

## DANH SÁCH USER STORIES

### US-01: Đăng ký & Đăng nhập bằng Email sinh viên / SSO
- **As a** Sinh viên trong trường đại học,
- **I want to** đăng ký và đăng nhập tài khoản bằng email trường (.edu.vn) hoặc Google Workspace SSO,
- **So that** tôi có thể tham gia vào chợ sinh viên an toàn, đáng tin cậy.
- **Acceptance Criteria (AC):**
  1. Cho phép nhập email trường, hệ thống kiểm tra domain thuộc danh sách bảng `universities`.
  2. Gửi mã OTP 6 số qua email với hiệu lực 5 phút.
  3. Sau khi xác thực email thành công, tự động cộng +20 điểm Campus Karma ban đầu.
  4. Trả về Access Token (JWT) và Refresh Token lưu tại Cookie HttpOnly.
- **Tasks:**
  - [Backend] Thiết kế API `/api/v1/auth/send-otp`, `/api/v1/auth/verify-otp`.
  - [Backend] Tích hợp dịch vụ gửi Mail OTP và kiểm tra whitelist email domain.
  - [Frontend] Xây dựng trang `LoginPage.tsx` và `RegisterPage.tsx` với form validation Zod.
  - [Frontend] Quản lý state đăng nhập với `useAuthStore.ts` (Zustand).

---

### US-02: Thiết lập Campus Profile
- **As a** Sinh viên mới tham gia,
- **I want to** chọn Trường, Cơ sở (Campus), Ký túc xá/Khu vực trọ và Khoa của mình,
- **So that** hệ thống đề xuất các bài đăng và đối tác giao dịch lân cận.
- **Acceptance Criteria (AC):**
  1. Chọn trường đại học từ danh sách, dropdown tự động load các Campus tương ứng.
  2. Nhập biệt danh, avatar, chọn năm học / khóa sinh viên.
  3. Hệ thống bảo mật: ẩn email cá nhân, MSSV, số điện thoại khỏi public profile (tuân thủ Nghị định 13).
  4. Hiển thị huy hiệu điểm Campus Karma trên trang cá nhân.
- **Tasks:**
  - [Backend] API GET/PUT `/api/v1/student/profile`.
  - [Frontend] Màn hình Profile Setup & Edit Profile.

---

### US-03: Đăng bài Bán (Sell) & Tặng (Giveaway)
- **As a** Sinh viên muốn thanh lý đồ dùng hoặc tặng giáo trình cũ,
- **I want to** tạo bài đăng với ảnh, mô tả, danh mục, giá bán hoặc tùy chọn tặng 0đ,
- **So that** các bạn sinh viên khác có thể tìm kiếm và liên hệ nhận/mua.
- **Acceptance Criteria (AC):**
  1. Hỗ trợ upload 1–6 ảnh (tối đa 5MB/ảnh) hoặc video ≤ 15s.
  2. Chọn Category (Giáo trình, Đồ công nghệ, Đồ gia dụng phòng trọ...).
  3. Với loại Bán (Sell): Bắt buộc nhập giá > 0đ, có tùy chọn "Cho phép trả giá".
  4. Với loại Tặng (Giveaway): Giá tự động đặt là 0đ, yêu cầu người nhận để lại lý do.
  5. Trạng thái bài đăng khởi tạo: `ACTIVE`.
- **Tasks:**
  - [Backend] API POST/PUT/DELETE `/api/v1/student/listings`.
  - [Backend] Tích hợp Cloudinary/S3 lưu trữ hình ảnh bài đăng.
  - [Frontend] Form đăng bài `CreateListingModal.tsx` / `CreateListingPage.tsx` với preview ảnh.

---

### US-04: Tìm kiếm & Khám phá bài đăng
- **As a** Sinh viên tìm đồ cũ,
- **I want to** tìm kiếm bài đăng theo từ khóa, mã học phần, trường/campus và lọc theo khoảng giá,
- **So that** tôi nhanh chóng tìm được món đồ mình cần với giá rẻ nhất gần trường.
- **Acceptance Criteria (AC):**
  1. Thanh tìm kiếm hỗ trợ debounce 300ms.
  2. Bộ lọc: Khoảng giá, Loại giao dịch (Sell, Giveaway), Tình trạng (Mới, 90%, Cũ).
  3. Tốc độ tải trang < 1.5s.
- **Tasks:**
  - [Backend] API GET `/api/v1/student/listings` hỗ trợ phân trang, filter, search.
  - [Frontend] Component `ListingCard.tsx`, bộ lọc `FilterSidebar.tsx`, trang `DashboardPage.tsx`.

---

### US-05: Chat P2P Realtime & Cảnh báo an toàn
- **As a** Người mua hoặc người bán,
- **I want to** nhắn tin trực tiếp với đối phương ngay trên bài đăng,
- **So that** hai bên có thể thương lượng giá cả và hẹn điểm gặp mặt an toàn tại trường.
- **Acceptance Criteria (AC):**
  1. Nhắn tin realtime qua WebSocket/Socket.io độ trễ < 300ms.
  2. Anti-fraud Shield: Tự động cảnh báo đỏ khi tin nhắn có từ khóa rủi ro ("chuyển khoản cọc trước", "link lạ", "bấm vào link này").
  3. Gợi ý các "Điểm hẹn an toàn" (Safe Meeting Points) tại thư viện trường, sảnh ký túc xá.
- **Tasks:**
  - [Backend] Cấu hình WebSocket + Redis Pub/Sub, bộ lọc Anti-fraud regex.
  - [Frontend] Giao diện Chat modal/drawer realtime.

---

### US-06: Xác nhận hoàn tất & Đánh giá Campus Karma
- **As a** Người mua và người bán sau khi giao dịch,
- **I want to** xác nhận hoàn tất giao dịch và đánh giá đối phương (1–5 sao kèm nhận xét),
- **So that** cộng đồng ghi nhận sự uy tín và tích lũy điểm Campus Karma.
- **Acceptance Criteria (AC):**
  1. Sau khi bấm "Đã nhận đồ & hoàn tất", kích hoạt popup đánh giá.
  2. Đánh giá 5 sao: người được đánh giá nhận +5 điểm Karma.
  3. Tặng đồ thành công (Giveaway): người tặng nhận +10 điểm Karma.
- **Tasks:**
  - [Backend] API POST `/api/v1/student/reviews`, logic tính toán Karma Score.
  - [Frontend] Component `ReviewModal.tsx`, `KarmaBadge.tsx`.
