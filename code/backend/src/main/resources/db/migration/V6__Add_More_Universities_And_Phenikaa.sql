-- ====================================================================
-- V6__Add_More_Universities_And_Phenikaa.sql: Bổ sung nhiều trường đại học (bao gồm Phenikaa và Các trường khác)
-- ====================================================================

-- 1. Insert Universities (Bao gồm Phenikaa và Các trường đại học khác)
INSERT INTO universities (id, name, short_name, email_domains) VALUES
(5, 'Trường Đại học Phenikaa', 'PHENIKAA', 'phenikaa-uni.edu.vn,phenikaa.edu.vn'),
(6, 'Đại học Quốc Gia Hà Nội', 'VNU-HN', 'vnu.edu.vn,uet.vnu.edu.vn,ulis.vnu.edu.vn,ussh.vnu.edu.vn,hus.vnu.edu.vn,ueb.edu.vn'),
(7, 'Trường Đại học Ngoại Thương', 'FTU', 'ftu.edu.vn'),
(8, 'Học viện Công nghệ Bưu chính Viễn thông', 'PTIT', 'ptit.edu.vn,stu.ptit.edu.vn'),
(9, 'Trường Đại học Công nghiệp Hà Nội', 'HaUI', 'haui.edu.vn,sv.haui.edu.vn'),
(10, 'Trường Đại học Giao Thông Vận Tải', 'UTC', 'utc.edu.vn'),
(11, 'Trường Đại học Sư Phạm Kỹ Thuật TP.HCM', 'HCMUTE', 'hcmute.edu.vn,student.hcmute.edu.vn'),
(12, 'Trường Đại học Kinh Tế TP.HCM', 'UEH', 'ueh.edu.vn,st.ueh.edu.vn'),
(13, 'Trường Đại học Tôn Đức Thắng', 'TDTU', 'tdtu.edu.vn,student.tdtu.edu.vn'),
(14, 'Trường Đại học Xây Dựng Hà Nội', 'HUCE', 'huce.edu.vn'),
(15, 'Trường Đại học Thương Mại', 'TMU', 'tmu.edu.vn'),
(16, 'Trường Đại học Thủy Lợi', 'TLU', 'tlu.edu.vn'),
(17, 'Trường Đại học Hà Nội', 'HANU', 'hanu.edu.vn'),
(18, 'Học viện Tài Chính', 'AOF', 'hvtc.edu.vn,aof.edu.vn'),
(19, 'Học viện Ngân Hàng', 'BA', 'hvnh.edu.vn,ba.edu.vn'),
(20, 'Trường Đại học Y Hà Nội', 'HMU', 'hmu.edu.vn'),
(21, 'Trường Đại học Sư Phạm Hà Nội', 'HNUE', 'hnue.edu.vn'),
(22, 'Trường Đại học Luật Hà Nội', 'HLU', 'hlu.edu.vn'),
(23, 'Trường Đại học Mở Hà Nội', 'HOU', 'hou.edu.vn'),
(24, 'Trường Đại học Khoa Học Tự Nhiên - ĐHQG TP.HCM', 'HCMUS', 'hcmus.edu.vn'),
(25, 'Trường Đại học Cần Thơ', 'CTU', 'ctu.edu.vn'),
(26, 'Đại học Đà Nẵng', 'UD', 'udn.vn,dut.udn.vn,due.udn.vn,ued.udn.vn'),
(99, 'Các trường đại học khác', 'KHAC', 'edu.vn')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    email_domains = EXCLUDED.email_domains;

-- 2. Insert Campuses tương ứng
INSERT INTO campuses (id, university_id, name, location) VALUES
(8, 5, 'Cơ sở Yên Nghĩa (Trụ sở chính)', 'Đường Tố Hữu, Yên Nghĩa, Hà Đông, Hà Nội'),
(9, 5, 'Khu Ký túc xá Phenikaa', 'Khuôn viên ĐH Phenikaa, Yên Nghĩa, Hà Đông, Hà Nội'),
(10, 6, 'Cơ sở Cầu Giấy (144 Xuân Thủy)', '144 Xuân Thủy, Cầu Giấy, Hà Nội'),
(11, 6, 'Campus Đô thị ĐHQGHN Hòa Lạc', 'Khu đô thị ĐHQGHN, Thạch Thất, Hà Nội'),
(12, 7, 'Trụ sở chính Hà Nội - FTU', '91 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội'),
(13, 7, 'Cơ sở 2 TP.HCM - FTU', '15 Đường D5, Phường 25, Bình Thạnh, TP.HCM'),
(14, 8, 'Cơ sở Hà Đông - PTIT', 'Km10 Đường Nguyễn Trãi, Hà Đông, Hà Nội'),
(15, 8, 'Cơ sở TP.HCM - PTIT', '97 Man Thiện, Hiệp Phú, TP.Thủ Đức, TP.HCM'),
(16, 9, 'Cơ sở 1 - HaUI', 'Số 298 Đ. Cầu Diễn, Bắc Từ Liêm, Hà Nội'),
(17, 10, 'Cơ sở Hà Nội - UTC', 'Số 3 Đ. Cầu Giấy, Láng Thượng, Đống Đa, Hà Nội'),
(18, 11, 'Cơ sở chính Thủ Đức - HCMUTE', 'Số 1 Võ Văn Ngân, Linh Chiểu, TP.Thủ Đức, TP.HCM'),
(19, 12, 'Cơ sở A Nguyễn Đình Chiểu - UEH', '59C Nguyễn Đình Chiểu, Phường 6, Quận 3, TP.HCM'),
(20, 13, 'Trụ sở chính Tân Phong - TDTU', '19 Đường Nguyễn Hữu Thọ, Tân Phong, Quận 7, TP.HCM'),
(21, 14, 'Cơ sở Giải Phóng - HUCE', 'Số 55 Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội'),
(22, 15, 'Cơ sở Hồ Tùng Mậu - TMU', '79 Hồ Tùng Mậu, Mai Dịch, Cầu Giấy, Hà Nội'),
(23, 16, 'Cơ sở Tây Sơn - TLU', '175 Tây Sơn, Trung Liệt, Đống Đa, Hà Nội'),
(24, 17, 'Cơ sở Nguyễn Trãi - HANU', 'Km 9 Nguyễn Trãi, Trung Văn, Nam Từ Liêm, Hà Nội'),
(25, 18, 'Cơ sở Lê Văn Hiến - AOF', 'Số 58 Lê Văn Hiến, Đức Thắng, Bắc Từ Liêm, Hà Nội'),
(26, 19, 'Cơ sở Chùa Bộc - BA', '12 Chùa Bộc, Quang Trung, Đống Đa, Hà Nội'),
(27, 20, 'Cơ sở Tôn Thất Tùng - HMU', 'Số 1 Tôn Thất Tùng, Kim Liên, Đống Đa, Hà Nội'),
(28, 21, 'Cơ sở Xuân Thủy - HNUE', '136 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội'),
(29, 22, 'Cơ sở Nguyễn Chí Thanh - HLU', '87 Nguyễn Chí Thanh, Láng Hạ, Đống Đa, Hà Nội'),
(30, 23, 'Trụ sở chính Nguyễn Hiền - HOU', 'Nhà B101, Nguyễn Hiền, Bách Khoa, Hai Bà Trưng, Hà Nội'),
(31, 24, 'Cơ sở Nguyễn Văn Cừ - HCMUS', '227 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM'),
(32, 25, 'Khu II - CTU', 'Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ'),
(33, 26, 'Cơ sở Lê Duẩn - UD', '41 Lê Duẩn, Hải Châu, TP.Đà Nẵng'),
(99, 99, 'Cơ sở chính / Toàn quốc', 'Toàn quốc (Dành cho các trường đại học khác có email .edu.vn)')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location;

-- 3. Tạo sẵn tài khoản sinh viên mẫu cho Phenikaa University
INSERT INTO users (
    id, email, password_hash, full_name, phone, university_id, campus_id,
    student_code, student_card_verified, karma_score, role, status, created_at, updated_at
) VALUES (
    3,
    'student@phenikaa-uni.edu.vn',
    '$2a$12$59g62Q11PLrcv4oDaMkWfO0t39dUHIK4tYI0cyalumzihEQ/TKbuq', -- Hash of 'Aa123'
    'Sinh Viên Phenikaa',
    '0988776655',
    5,
    8,
    '21010099',
    true,
    50,
    'ROLE_STUDENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- 4. Reset sequences an toàn
SELECT setval('universities_id_seq', (SELECT GREATEST(MAX(id), 100) FROM universities));
SELECT setval('campuses_id_seq', (SELECT GREATEST(MAX(id), 100) FROM campuses));
SELECT setval('users_id_seq', (SELECT GREATEST(MAX(id), 10) FROM users));
