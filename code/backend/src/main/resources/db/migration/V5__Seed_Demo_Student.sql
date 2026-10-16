-- ====================================================================
-- V5__Seed_Demo_Student.sql: Seed sample verified student account for testing
-- ====================================================================

INSERT INTO users (
    email,
    password_hash,
    full_name,
    phone,
    university_id,
    campus_id,
    dormitory,
    student_code,
    major,
    academic_year,
    bio,
    student_card_verified,
    karma_score,
    role,
    status,
    created_at,
    updated_at
) VALUES (
    'student@hust.edu.vn',
    '$2a$12$59g62Q11PLrcv4oDaMkWfO0t39dUHIK4tYI0cyalumzihEQ/TKbuq', -- BCrypt for Aa123
    'Nguyễn Văn An',
    '0987654321',
    1,
    1,
    'KTX B5, Phòng 402',
    '20201234',
    'Khoa học Máy tính (IT1)',
    'K65 (2020-2025)',
    'Sinh viên năm cuối CNTT Bách Khoa. Cần thanh lý giáo trình và đồ dùng dọn phòng KTX.',
    true,
    85,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;
