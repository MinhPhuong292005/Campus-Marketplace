-- ====================================================================
-- V13__Ensure_5_Sample_Student_Accounts.sql
-- Đảm bảo 5 tài khoản mẫu sinh viên Phenikaa (mật khẩu: 123456)
-- luôn tồn tại, mật khẩu chuẩn xác, và trạng thái ACTIVE để test
-- ====================================================================

-- 1. Cập nhật mật khẩu chuẩn cho 123456 và kích hoạt ACTIVE nếu tài khoản đã tồn tại
UPDATE users SET 
    password_hash = '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    status = 'ACTIVE',
    block_reason = NULL,
    suspended_until = NULL,
    karma_score = GREATEST(karma_score, 30)
WHERE email IN (
    '1@st.phenikaa-uni.edu.vn',
    '2@st.phenikaa-uni.edu.vn',
    '3@st.phenikaa-uni.edu.vn',
    '4@st.phenikaa-uni.edu.vn',
    '5@st.phenikaa-uni.edu.vn'
);

-- 2. Thêm mới nếu tài khoản chưa có trong bảng
INSERT INTO users (
    email, password_hash, full_name, phone, university_id, campus_id, dormitory,
    student_code, major, academic_year, bio, student_card_verified, karma_score, role, status, created_at, updated_at
)
SELECT 
    '1@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Hoàng Minh Đức',
    '0981000001',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Phenikaa, Tòa K1 - Phòng 302',
    '23010001',
    'Kỹ thuật Điện tử',
    'K17 (2023-2027)',
    'Sinh viên K17 Phenikaa.',
    true,
    30,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '1@st.phenikaa-uni.edu.vn');

INSERT INTO users (
    email, password_hash, full_name, phone, university_id, campus_id, dormitory,
    student_code, major, academic_year, bio, student_card_verified, karma_score, role, status, created_at, updated_at
)
SELECT 
    '2@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Vũ Hải Đăng',
    '0981000002',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Phenikaa, Tòa K2 - Phòng 405',
    '23010002',
    'Khoa học Máy tính',
    'K17 (2023-2027)',
    'Sinh viên K17 CNTT Phenikaa.',
    true,
    35,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '2@st.phenikaa-uni.edu.vn');

INSERT INTO users (
    email, password_hash, full_name, phone, university_id, campus_id, dormitory,
    student_code, major, academic_year, bio, student_card_verified, karma_score, role, status, created_at, updated_at
)
SELECT 
    '3@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Trần Tuấn Cường',
    '0981000003',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Phenikaa, Tòa K1 - Phòng 510',
    '23010003',
    'Quản trị Kinh doanh',
    'K16 (2022-2026)',
    'Sinh viên K16 QTKD Phenikaa.',
    true,
    40,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '3@st.phenikaa-uni.edu.vn');

INSERT INTO users (
    email, password_hash, full_name, phone, university_id, campus_id, dormitory,
    student_code, major, academic_year, bio, student_card_verified, karma_score, role, status, created_at, updated_at
)
SELECT 
    '4@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Lê Thu Hà',
    '0981000004',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Nữ Phenikaa - Phòng 204',
    '23010004',
    'Ngôn ngữ Anh',
    'K16 (2022-2026)',
    'Thường xuyên pass sách ngoại ngữ và tài liệu học tập Phenikaa.',
    true,
    45,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '4@st.phenikaa-uni.edu.vn');

INSERT INTO users (
    email, password_hash, full_name, phone, university_id, campus_id, dormitory,
    student_code, major, academic_year, bio, student_card_verified, karma_score, role, status, created_at, updated_at
)
SELECT 
    '5@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Đỗ Gia Huy',
    '0981000005',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Phenikaa, Tòa K3 - Phòng 108',
    '23010005',
    'Dược học',
    'K17 (2023-2027)',
    'Sinh viên Khoa Dược Phenikaa, trao đổi dụng cụ học tập.',
    true,
    50,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '5@st.phenikaa-uni.edu.vn');
