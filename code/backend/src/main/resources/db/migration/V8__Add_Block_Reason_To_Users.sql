-- ====================================================================
-- V8__Add_Block_Reason_To_Users.sql: Bổ sung lý do chặn sinh viên & dữ liệu mẫu danh sách bị chặn
-- ====================================================================

-- 1. Bổ sung cột block_reason vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS block_reason VARCHAR(255);

-- 2. Thêm tài khoản sinh viên mẫu bị chặn (BANNED) để kiểm thử danh sách sinh viên bị chặn
INSERT INTO users (
    email, password_hash, full_name, phone, university_id, campus_id,
    student_code, student_card_verified, karma_score, role, status, block_reason, created_at, updated_at
) VALUES (
    '23019999@st.phenikaa-uni.edu.vn',
    '$2a$12$59g62Q11PLrcv4oDaMkWfO0t39dUHIK4tYI0cyalumzihEQ/TKbuq',
    'Trần Văn Vi Phạm',
    '0911223344',
    5,
    8,
    '23019999',
    false,
    0,
    'ROLE_STUDENT',
    'BANNED',
    'Lừa đảo yêu cầu chuyển cọc trước và rao bán hàng cấm (vape, pod)',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    status = 'BANNED',
    block_reason = EXCLUDED.block_reason;
