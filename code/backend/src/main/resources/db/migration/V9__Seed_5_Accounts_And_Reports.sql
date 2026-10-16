-- ====================================================================
-- V9__Seed_5_Accounts_And_Reports.sql
-- Seed 5 tài khoản sinh viên Phenikaa (mật khẩu: 123456)
-- Tạo bài đăng vi phạm từ khóa cấm và các báo cáo (Scam, Hàng cấm)
-- ====================================================================

-- 1. Xóa các tài khoản nếu đã tồn tại để tránh xung đột
DELETE FROM reports WHERE reported_user_id IN (SELECT id FROM users WHERE email IN (
    '1@st.phenikaa-uni.edu.vn', '2@st.phenikaa-uni.edu.vn', '3@st.phenikaa-uni.edu.vn', '4@st.phenikaa-uni.edu.vn', '5@st.phenikaa-uni.edu.vn'
));
DELETE FROM listings WHERE user_id IN (SELECT id FROM users WHERE email IN (
    '1@st.phenikaa-uni.edu.vn', '2@st.phenikaa-uni.edu.vn', '3@st.phenikaa-uni.edu.vn', '4@st.phenikaa-uni.edu.vn', '5@st.phenikaa-uni.edu.vn'
));
DELETE FROM users WHERE email IN (
    '1@st.phenikaa-uni.edu.vn', '2@st.phenikaa-uni.edu.vn', '3@st.phenikaa-uni.edu.vn', '4@st.phenikaa-uni.edu.vn', '5@st.phenikaa-uni.edu.vn'
);

-- 2. Thêm 5 tài khoản sinh viên Phenikaa (mật khẩu BCrypt cho 123456: $2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK)
INSERT INTO users (
    email, password_hash, full_name, phone, university_id, campus_id, dormitory,
    student_code, major, academic_year, bio, student_card_verified, karma_score, role, status, created_at, updated_at
) VALUES 
(
    '1@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Hoàng Minh Đức (Tố cáo Scam)',
    '0981000001',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Phenikaa, Tòa K1 - Phòng 302',
    '23010001',
    'Kỹ thuật Điện tử',
    'K17 (2023-2027)',
    'Sinh viên K17 Phenikaa.',
    true,
    20,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '2@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Vũ Hải Đăng (Bán Vape Pod)',
    '0981000002',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Phenikaa, Tòa K2 - Phòng 405',
    '23010002',
    'Khoa học Máy tính',
    'K17 (2023-2027)',
    'Sinh viên K17 CNTT.',
    true,
    18,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '3@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Trần Tuấn Cường (Bán Cần Sa)',
    '0981000003',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Phenikaa, Tòa K1 - Phòng 510',
    '23010003',
    'Quản trị Kinh doanh',
    'K16 (2022-2026)',
    'Sinh viên K16 QTKD.',
    true,
    15,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '4@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Lê Thu Hà (SV Phenikaa K16)',
    '0981000004',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Nữ Phenikaa - Phòng 204',
    '23010004',
    'Ngôn ngữ Anh',
    'K16 (2022-2026)',
    'Thường xuyên pass sách ngoại ngữ và tài liệu học tập Phenikaa.',
    true,
    30,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '5@st.phenikaa-uni.edu.vn',
    '$2a$12$APRr24.ygIkY3Q5FiF8iC.GlCMC8.fx2SIBOsm7Nv9rrqrnA7TJmK',
    'Đỗ Gia Huy (SV Phenikaa K17)',
    '0981000005',
    (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1),
    'KTX Phenikaa, Tòa K3 - Phòng 108',
    '23010005',
    'Dược học',
    'K17 (2023-2027)',
    'Sinh viên Khoa Dược Phenikaa, trao đổi dụng cụ học tập.',
    true,
    25,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. Tạo bài đăng chứa từ khóa cấm cho tài khoản 2 và 3
INSERT INTO listings (
    user_id, category_id, title, description, price, transaction_type, condition_status, status, is_risk_flagged, risk_reason, created_at, updated_at
) VALUES
(
    (SELECT id FROM users WHERE email = '2@st.phenikaa-uni.edu.vn' LIMIT 1),
    (SELECT id FROM categories LIMIT 1),
    'Bán máy Vape Pod mini siêu khói giá rẻ',
    'Cần pass lại pod vape chill cho anh em sinh viên KTX Phenikaa dùng giải trí.',
    200000,
    'SELL',
    'LIKE_NEW_99',
    'REJECTED',
    true,
    'Tự động từ chối duyệt: Chứa từ khóa bị cấm [vape, pod]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM users WHERE email = '3@st.phenikaa-uni.edu.vn' LIMIT 1),
    (SELECT id FROM categories LIMIT 1),
    'Pass lại tinh dầu cần sa cbd thư giãn giảm stress',
    'Tinh dầu cần sa chuẩn xịn giúp sinh viên Phenikaa học tập bớt căng thẳng mùa thi.',
    350000,
    'SELL',
    'NEW_100',
    'REJECTED',
    true,
    'Tự động từ chối duyệt: Chứa từ khóa bị cấm [cần sa]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM users WHERE email = '4@st.phenikaa-uni.edu.vn' LIMIT 1),
    (SELECT id FROM categories LIMIT 1),
    'Thanh lý từ điển Oxford và giáo trình Tiếng Anh Phenikaa B2',
    'Sách chuẩn trường Phenikaa, còn rất mới không quăn mép.',
    70000,
    'SELL',
    'GOOD_90',
    'ACTIVE',
    false,
    null,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 4. Tạo các báo cáo (Reports)
-- Báo cáo 1: Tố cáo Scam cọc đối với tài khoản 1@st.phenikaa-uni.edu.vn
INSERT INTO reports (
    reporter_id, reported_user_id, reason, description, severity, status, created_at, updated_at
) VALUES (
    (SELECT id FROM users WHERE email = '23010190@st.phenikaa-uni.edu.vn' LIMIT 1),
    (SELECT id FROM users WHERE email = '1@st.phenikaa-uni.edu.vn' LIMIT 1),
    'SCAM_OR_FRAUD',
    'Đối tượng yêu cầu chuyển khoản cọc 200.000đ để giữ sách và máy tính Casio nhưng sau khi nhận tiền cọc thì chặn Zalo, quỵt cọc không giao đồ.',
    'HIGH',
    'PENDING',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Báo cáo 2: Tố cáo Rao bán hàng cấm Vape Pod đối với tài khoản 2@st.phenikaa-uni.edu.vn
INSERT INTO reports (
    reporter_id, reported_user_id, reported_listing_id, reason, description, severity, status, created_at, updated_at
) VALUES (
    (SELECT id FROM users WHERE email = '23010190@st.phenikaa-uni.edu.vn' LIMIT 1),
    (SELECT id FROM users WHERE email = '2@st.phenikaa-uni.edu.vn' LIMIT 1),
    (SELECT id FROM listings WHERE user_id = (SELECT id FROM users WHERE email = '2@st.phenikaa-uni.edu.vn' LIMIT 1) LIMIT 1),
    'PROHIBITED_ITEMS',
    'Rao bán thuốc lá điện tử vape pod trong ký túc xá trường Phenikaa, cố tình lách kiểm duyệt.',
    'HIGH',
    'PENDING',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Báo cáo 3: Tố cáo Rao bán chất cấm Cần Sa đối với tài khoản 3@st.phenikaa-uni.edu.vn
INSERT INTO reports (
    reporter_id, reported_user_id, reported_listing_id, reason, description, severity, status, created_at, updated_at
) VALUES (
    (SELECT id FROM users WHERE email = '23010190@st.phenikaa-uni.edu.vn' LIMIT 1),
    (SELECT id FROM users WHERE email = '3@st.phenikaa-uni.edu.vn' LIMIT 1),
    (SELECT id FROM listings WHERE user_id = (SELECT id FROM users WHERE email = '3@st.phenikaa-uni.edu.vn' LIMIT 1) LIMIT 1),
    'PROHIBITED_ITEMS',
    'Rao bán chất cấm cần sa trong khuôn viên trường đại học, vi phạm nghiêm trọng pháp luật và nội quy Phenikaa.',
    'CRITICAL',
    'PENDING',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
