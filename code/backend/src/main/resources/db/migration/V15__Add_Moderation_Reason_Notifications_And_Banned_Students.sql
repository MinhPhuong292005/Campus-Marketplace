-- ====================================================================
-- V15__Add_Moderation_Reason_Notifications_And_Banned_Students.sql
-- 1. Thêm lý do duyệt/từ chối vào bài đăng
-- 2. Thêm bảng thông báo cho sinh viên (kèm lý do duyệt/từ chối)
-- 3. Thêm bảng lưu trữ danh sách mã sinh viên bị cấm vĩnh viễn (Blacklist MSSV)
-- ====================================================================

-- 1. Cột moderation_reason trong bảng listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- 2. Bảng lưu trữ mã sinh viên bị cấm vĩnh viễn
CREATE TABLE IF NOT EXISTS banned_student_codes (
    id BIGSERIAL PRIMARY KEY,
    student_code VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150),
    full_name VARCHAR(100),
    ban_reason TEXT,
    banned_by VARCHAR(150),
    banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banned_student_codes_code ON banned_student_codes(student_code);

-- Đồng bộ các tài khoản đang bị BANNED vào danh sách cấm vĩnh viễn
INSERT INTO banned_student_codes (student_code, email, full_name, ban_reason, banned_by, banned_at)
SELECT 
    COALESCE(NULLIF(TRIM(student_code), ''), split_part(email, '@', 1)),
    email,
    full_name,
    COALESCE(block_reason, 'Tài khoản vi phạm nghiêm trọng quy chế Phenikaa, bị cấm vĩnh viễn'),
    'admin@phenikaa-uni.edu.vn',
    CURRENT_TIMESTAMP
FROM users
WHERE status = 'BANNED'
ON CONFLICT (student_code) DO NOTHING;

-- 3. Bảng thông báo cho sinh viên
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'LISTING_APPROVED', 'LISTING_REJECTED', 'SYSTEM', 'WARNING'
    reference_id BIGINT,
    reason TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Thêm một số thông báo mẫu rõ lý do cho các sinh viên
INSERT INTO notifications (user_id, title, message, type, reference_id, reason, is_read, created_at)
SELECT 
    u.id,
    'Bài đăng đã được duyệt thành công',
    'Bài đăng của bạn đã được Ban quản trị phê duyệt và công khai trên Chợ Sinh viên Phenikaa.',
    'LISTING_APPROVED',
    l.id,
    'Bài đăng đầy đủ thông tin, sản phẩm hợp lệ, đúng quy chế Phenikaa Marketplace.',
    false,
    CURRENT_TIMESTAMP - INTERVAL '15 minutes'
FROM users u
JOIN listings l ON l.user_id = u.id
WHERE l.status = 'ACTIVE'
LIMIT 2;

INSERT INTO notifications (user_id, title, message, type, reference_id, reason, is_read, created_at)
SELECT 
    u.id,
    'Bài đăng không được phê duyệt',
    'Bài đăng của bạn đã bị từ chối phê duyệt do không đạt tiêu chuẩn nội dung.',
    'LISTING_REJECTED',
    l.id,
    'Ảnh chụp bị mờ hoặc vi phạm quy định niêm yết giá. Vui lòng kiểm tra lại chất lượng ảnh và mô tả sản phẩm.',
    false,
    CURRENT_TIMESTAMP - INTERVAL '45 minutes'
FROM users u
JOIN listings l ON l.user_id = u.id
LIMIT 1;
