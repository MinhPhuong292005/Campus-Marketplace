-- ====================================================================
-- V4__Admin_Audit_And_Blacklist.sql: Quản trị kiểm duyệt, từ khóa cấm & nhật ký kiểm toán
-- ====================================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    admin_email VARCHAR(150) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- 2. Create keyword_blacklists table
CREATE TABLE IF NOT EXISTS keyword_blacklists (
    id BIGSERIAL PRIMARY KEY,
    keyword VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'PROHIBITED_GOODS',
    severity VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    action VARCHAR(30) NOT NULL DEFAULT 'AUTO_BLOCK',
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enhance listings table with risk detection flags
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_risk_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS risk_reason VARCHAR(255);

-- 4. Seed initial sensitive & prohibited keywords
INSERT INTO keyword_blacklists (keyword, category, severity, action, reason) VALUES
('thuốc lá điện tử', 'PROHIBITED_GOODS', 'HIGH', 'AUTO_BLOCK', 'Hàng cấm trong khuôn viên trường học'),
('vape', 'PROHIBITED_GOODS', 'HIGH', 'AUTO_BLOCK', 'Hàng cấm trong khuôn viên trường học'),
('pod chill', 'PROHIBITED_GOODS', 'HIGH', 'AUTO_BLOCK', 'Chất kích thích bị nghiêm cấm'),
('cần sa', 'PROHIBITED_GOODS', 'HIGH', 'AUTO_BLOCK', 'Chất cấm theo pháp luật'),
('vũ khí', 'PROHIBITED_GOODS', 'HIGH', 'AUTO_BLOCK', 'Vật dụng nguy hiểm cấm lưu hành'),
('dao bấm', 'PROHIBITED_GOODS', 'HIGH', 'AUTO_BLOCK', 'Vũ khí nguy hiểm'),
('thi hộ', 'ACADEMIC_FRAUD', 'HIGH', 'AUTO_BLOCK', 'Gian lận thi cử vi phạm kỷ luật trường'),
('làm thuê tiểu luận', 'ACADEMIC_FRAUD', 'HIGH', 'AUTO_BLOCK', 'Gian lận học thuật sinh viên'),
('chạy điểm', 'ACADEMIC_FRAUD', 'HIGH', 'AUTO_BLOCK', 'Gian lận kết quả học tập'),
('bằng giả', 'ACADEMIC_FRAUD', 'HIGH', 'AUTO_BLOCK', 'Giả mạo tài liệu cơ quan nhà nước'),
('vay tiền sinh viên', 'SCAM', 'HIGH', 'FLAG_FOR_REVIEW', 'Cảnh báo bẫy tín dụng đen sinh viên'),
('vay nặng lãi', 'SCAM', 'HIGH', 'AUTO_BLOCK', 'Tín dụng đen trái pháp luật'),
('chuyển cọc trước', 'SCAM', 'MEDIUM', 'FLAG_FOR_REVIEW', 'Nguy cơ quỵt cọc lừa đảo P2P'),
('nạp thẻ cào', 'SCAM', 'HIGH', 'AUTO_BLOCK', 'Hình thức lừa đảo phổ biến')
ON CONFLICT (keyword) DO NOTHING;

-- 5. Seed default admin user (admin@gmail.com / Aa123)
INSERT INTO users (email, password_hash, full_name, phone, role, status, karma_score, student_card_verified, created_at, updated_at)
VALUES ('admin@gmail.com', '$2a$12$59g62Q11PLrcv4oDaMkWfO0t39dUHIK4tYI0cyalumzihEQ/TKbuq', 'Quản Trị Viên Hệ Thống', '0988888888', 'ROLE_SUPER_ADMIN', 'ACTIVE', 999, true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ROLE_SUPER_ADMIN';

-- 6. Seed sample initial audit log
INSERT INTO audit_logs (admin_id, admin_email, action, target_type, details, ip_address)
VALUES (1, 'admin@gmail.com', 'SYSTEM_INITIALIZE', 'SYSTEM', 'Khởi tạo hệ thống quản trị Campus Marketplace & nạp từ khóa cấm', '127.0.0.1');

