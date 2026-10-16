-- ====================================================================
-- V14__Purge_Non_Phenikaa_And_Retain_Only_Phenikaa.sql
-- Nền tảng Campus Marketplace CHUYÊN BIỆT 100% CHỈ DÀNH CHO SINH VIÊN ĐẠI HỌC PHENIKAA
-- Xóa toàn bộ sinh viên, bài đăng và dữ liệu của các trường ngoài (HUST, NEU, VNU, HCMUT,...)
-- ====================================================================

-- 1. Xóa các hợp đồng cho thuê liên quan đến tài khoản ngoài Phenikaa
DELETE FROM rental_contracts WHERE renter_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
) OR owner_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
) OR listing_id IN (
    SELECT id FROM listings WHERE user_id IN (
        SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
    )
);

-- 2. Xóa các đề xuất trao đổi đồ (swap) liên quan
DELETE FROM swap_proposals WHERE initiator_listing_id IN (
    SELECT id FROM listings WHERE user_id IN (
        SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
    )
) OR target_listing_id IN (
    SELECT id FROM listings WHERE user_id IN (
        SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
    )
);

-- 3. Xóa các đánh giá (reviews) liên quan
DELETE FROM reviews WHERE reviewer_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
) OR target_user_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
);

-- 4. Xóa tin nhắn và phòng chat
DELETE FROM messages WHERE sender_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
);

DELETE FROM chat_rooms WHERE user_one_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
) OR user_two_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
);

-- 5. Xóa các báo cáo vi phạm liên quan đến người dùng hoặc bài đăng ngoài Phenikaa
DELETE FROM reports WHERE reported_user_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
) OR reporter_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
) OR reported_listing_id IN (
    SELECT id FROM listings WHERE user_id IN (
        SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
    )
);

-- 6. Xóa hình ảnh và bài đăng của tài khoản ngoài Phenikaa
DELETE FROM listing_images WHERE listing_id IN (
    SELECT id FROM listings WHERE user_id IN (
        SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
    )
);

DELETE FROM listings WHERE user_id IN (
    SELECT id FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com'
);

-- 7. Xóa sạch các tài khoản không phải của Đại học Phenikaa (ngoại trừ tài khoản admin hệ thống)
DELETE FROM users WHERE email NOT LIKE '%@st.phenikaa-uni.edu.vn' AND email NOT LIKE '%@phenikaa-uni.edu.vn' AND email != 'admin@gmail.com';

-- 8. Chuẩn hóa tên sinh viên 5 tài khoản mẫu Phenikaa
UPDATE users SET full_name = 'Vũ Hải Đăng' WHERE email = '2@st.phenikaa-uni.edu.vn';
UPDATE users SET full_name = 'Trần Tuấn Cường' WHERE email = '3@st.phenikaa-uni.edu.vn';

-- 9. Gán tất cả sinh viên còn lại về đúng Trường Đại học Phenikaa
UPDATE users SET 
    university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1),
    campus_id = (SELECT id FROM campuses WHERE university_id = (SELECT id FROM universities WHERE short_name = 'PHENIKAA' LIMIT 1) LIMIT 1)
WHERE role = 'ROLE_STUDENT';

-- 10. Dọn dẹp danh sách trường đại học khác: chỉ giữ lại Phenikaa University
DELETE FROM campuses WHERE university_id NOT IN (SELECT id FROM universities WHERE short_name = 'PHENIKAA');
DELETE FROM universities WHERE short_name != 'PHENIKAA';
