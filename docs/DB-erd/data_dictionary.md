# TỪ ĐIỂN DỮ LIỆU (DATA DICTIONARY)
## DỰ ÁN: CAMPUS MARKETPLACE

Tài liệu này mô tả chi tiết các bảng, trường dữ liệu, kiểu dữ liệu, các ràng buộc và chỉ mục trong cơ sở dữ liệu PostgreSQL của hệ thống.

---

### 1. Bảng `universities` (Trường Đại học)
Lưu trữ thông tin các trường đại học hỗ trợ trên nền tảng.
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Khóa chính tự tăng |
| `name` | VARCHAR(255) | NOT NULL | Tên đầy đủ trường đại học |
| `short_name` | VARCHAR(50) | NOT NULL | Tên viết tắt (ví dụ: BK, NEU, FPT) |
| `email_domains` | TEXT | NOT NULL | Danh sách domain email sinh viên (json hoặc phân cách bằng dấu phẩy) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật gần nhất |

---

### 2. Bảng `campuses` (Cơ sở / Campus)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Khóa chính |
| `university_id` | BIGINT | NOT NULL, FK `universities(id)` | Thuộc trường nào |
| `name` | VARCHAR(150) | NOT NULL | Tên cơ sở (ví dụ: Campus Hòa Lạc, Cơ sở 1) |
| `location` | VARCHAR(255) | NULL | Địa chỉ thực tế |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cập nhật |

---

### 3. Bảng `users` (Người dùng / Sinh viên / Quản trị viên)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Khóa chính |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE | Email sinh viên hoặc email cá nhân |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu băm Bcrypt / Argon2 |
| `full_name` | VARCHAR(100) | NOT NULL | Họ và tên hiển thị |
| `phone` | VARCHAR(20) | NULL | Số điện thoại (ẩn theo Nghị định 13) |
| `avatar_url` | VARCHAR(500) | NULL | Link ảnh đại diện |
| `university_id` | BIGINT | NULL, FK `universities(id)` | Trường trực thuộc |
| `campus_id` | BIGINT | NULL, FK `campuses(id)` | Cơ sở đang học |
| `dormitory` | VARCHAR(100) | NULL | Ký túc xá / Tòa nhà trọ |
| `student_code` | VARCHAR(30) | NULL | MSSV (được bảo vệ, ẩn trên public profile) |
| `student_card_verified` | BOOLEAN | DEFAULT FALSE | Đã xác thực thẻ sinh viên hay chưa |
| `karma_score` | INT | DEFAULT 20 | Điểm tín nhiệm Campus Karma (khởi tạo 20) |
| `role` | VARCHAR(30) | DEFAULT 'ROLE_STUDENT' | Role: `ROLE_STUDENT`, `ROLE_MODERATOR`, `ROLE_SUPER_ADMIN` |
| `status` | VARCHAR(30) | DEFAULT 'ACTIVE' | Trạng thái: `ACTIVE`, `SUSPENDED`, `BANNED` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian đăng ký |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Cập nhật hồ sơ |

---

### 4. Bảng `categories` (Danh mục vật phẩm)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Khóa chính |
| `name` | VARCHAR(100) | NOT NULL | Tên danh mục (Giáo trình, Đồ công nghệ...) |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | Slug URL thân thiện SEO |
| `icon` | VARCHAR(100) | NULL | Tên biểu tượng Lucide hoặc SVG URL |
| `parent_id` | BIGINT | NULL, FK `categories(id)` | Danh mục cha (nếu có cấp phân cấp) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Cập nhật |

---

### 5. Bảng `listings` (Bài đăng sản phẩm / dịch vụ)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Khóa chính |
| `user_id` | BIGINT | NOT NULL, FK `users(id)` | Người đăng bài |
| `category_id` | BIGINT | NOT NULL, FK `categories(id)` | Danh mục sản phẩm |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề bài đăng |
| `description` | TEXT | NOT NULL | Mô tả chi tiết sản phẩm |
| `price` | NUMERIC(12, 2) | DEFAULT 0.00 | Giá bán hoặc giá thuê (0 với Giveaway) |
| `transaction_type` | VARCHAR(30) | NOT NULL | `SELL`, `RENT`, `GIVEAWAY`, `SWAP` |
| `condition_status` | VARCHAR(50) | NOT NULL | Tình trạng: `NEW_100`, `LIKE_NEW_99`, `GOOD_90`, `FAIR_70` |
| `rental_terms` | TEXT | NULL | Điều khoản thuê và tiền cọc (áp dụng khi type = RENT) |
| `swap_target` | TEXT | NULL | Đồ vật muốn đổi lấy (áp dụng khi type = SWAP) |
| `status` | VARCHAR(30) | DEFAULT 'ACTIVE' | `DRAFT`, `ACTIVE`, `RESERVED`, `COMPLETED`, `DELETED` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian đăng |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Cập nhật |

---

### 6. Bảng `listing_images` (Hình ảnh & Video bài đăng)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Khóa chính |
| `listing_id` | BIGINT | NOT NULL, FK `listings(id)` ON DELETE CASCADE | Thuộc bài đăng nào |
| `media_url` | VARCHAR(500) | NOT NULL | Link file trên Cloudinary/S3 |
| `media_type` | VARCHAR(20) | DEFAULT 'IMAGE' | `IMAGE` hoặc `VIDEO` |
| `sort_order` | INT | DEFAULT 0 | Thứ tự hiển thị (0 là ảnh bìa) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

---

### 7. Bảng `swap_proposals` (Đề xuất đổi đồ)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Khóa chính |
| `initiator_listing_id` | BIGINT | NOT NULL, FK `listings(id)` | Bài đăng của người muốn đổi |
| `target_listing_id` | BIGINT | NOT NULL, FK `listings(id)` | Bài đăng mục tiêu muốn đổi lấy |
| `cash_adjustment` | NUMERIC(12, 2) | DEFAULT 0.00 | Tiền bù trừ (dương: initiator bù thêm) |
| `note` | TEXT | NULL | Lời nhắn kèm đề xuất |
| `status` | VARCHAR(30) | DEFAULT 'PENDING' | `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian gửi đề xuất |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Thời gian phản hồi |

---

### 8. Bảng `rental_contracts` (Hợp đồng cho thuê)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Khóa chính |
| `listing_id` | BIGINT | NOT NULL, FK `listings(id)` | Bài đăng cho thuê |
| `renter_id` | BIGINT | NOT NULL, FK `users(id)` | Người thuê |
| `owner_id` | BIGINT | NOT NULL, FK `users(id)` | Chủ tài sản |
| `start_date` | TIMESTAMP | NOT NULL | Thời gian bắt đầu thuê |
| `end_date` | TIMESTAMP | NOT NULL | Hạn trả đồ |
| `total_rent_amount` | NUMERIC(12, 2) | NOT NULL | Tổng tiền thuê dự kiến |
| `deposit_amount` | NUMERIC(12, 2) | NOT NULL | Tiền cọc giữ đồ |
| `proof_images` | JSONB | NULL | Mảng URL ảnh tình trạng máy lúc giao |
| `status` | VARCHAR(30) | DEFAULT 'PENDING' | `PENDING`, `ACTIVE`, `RETURNED`, `DISPUTED` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời điểm tạo hợp đồng |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Cập nhật |

---

### 9. Bảng `chat_rooms` & `messages` (Chat P2P Realtime)
- `chat_rooms`:
  - `id`: BIGSERIAL PRIMARY KEY
  - `listing_id`: BIGINT NULL, FK `listings(id)`
  - `user_one_id`: BIGINT NOT NULL, FK `users(id)`
  - `user_two_id`: BIGINT NOT NULL, FK `users(id)`
  - `created_at`, `updated_at`
- `messages`:
  - `id`: BIGSERIAL PRIMARY KEY
  - `chat_room_id`: BIGINT NOT NULL, FK `chat_rooms(id)` ON DELETE CASCADE
  - `sender_id`: BIGINT NOT NULL, FK `users(id)`
  - `content`: TEXT NOT NULL
  - `message_type`: VARCHAR(20) DEFAULT 'TEXT' (`TEXT`, `IMAGE`, `OFFER_PRICE`, `MEETING_POINT`)
  - `is_read`: BOOLEAN DEFAULT FALSE
  - `created_at`: TIMESTAMP DEFAULT NOW()

---

### 10. Bảng `reviews` & `reports`
- `reviews`:
  - `id`: BIGSERIAL PRIMARY KEY
  - `transaction_id`: BIGINT NULL
  - `reviewer_id`: BIGINT NOT NULL, FK `users(id)`
  - `target_user_id`: BIGINT NOT NULL, FK `users(id)`
  - `rating`: INT NOT NULL (1 đến 5)
  - `comment`: TEXT NULL
  - `tags`: JSONB NULL (mảng tag: ["Đúng giờ", "Đồ còn rất mới", "Nhiệt tình"])
  - `created_at`: TIMESTAMP DEFAULT NOW()
- `reports`:
  - `id`: BIGSERIAL PRIMARY KEY
  - `reporter_id`: BIGINT NOT NULL, FK `users(id)`
  - `reported_user_id`: BIGINT NULL, FK `users(id)`
  - `reported_listing_id`: BIGINT NULL, FK `listings(id)`
  - `reason`: VARCHAR(50) NOT NULL (`BOM_HEN`, `HANG_GIA`, `SCAM`, `NOI_DUNG_CAM`)
  - `evidence_url`: TEXT NULL
  - `status`: VARCHAR(30) DEFAULT 'PENDING' (`PENDING`, `INVESTIGATING`, `RESOLVED`, `DISMISSED`)
  - `admin_resolution`: TEXT NULL
  - `created_at`, `updated_at`
