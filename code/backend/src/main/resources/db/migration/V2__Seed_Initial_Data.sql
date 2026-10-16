-- ====================================================================
-- V2__Seed_Initial_Data.sql: Dữ liệu mẫu trường đại học, cơ sở, danh mục
-- ====================================================================

-- 1. Universities
INSERT INTO universities (id, name, short_name, email_domains) VALUES
(1, 'Đại học Bách Khoa Hà Nội', 'HUST', 'hust.edu.vn,sis.hust.edu.vn'),
(2, 'Đại học Quốc Gia TP.HCM', 'VNU-HCM', 'vnuhcm.edu.vn,hcmut.edu.vn,uit.edu.vn,ussh.edu.vn'),
(3, 'Đại học Kinh Tế Quốc Dân', 'NEU', 'neu.edu.vn'),
(4, 'Đại học FPT', 'FPTU', 'fpt.edu.vn,fe.edu.vn')
ON CONFLICT (id) DO NOTHING;

-- 2. Campuses
INSERT INTO campuses (id, university_id, name, location) VALUES
(1, 1, 'Cơ sở Giải Phóng (Trụ sở chính)', 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội'),
(2, 1, 'Ký túc xá B5 - Bách Khoa', 'Khu ký túc xá Bách Khoa, Tạ Quang Bửu, Hà Nội'),
(3, 2, 'Khu Đô thị ĐHQG Thủ Đức (Khu A)', 'Linh Trung, Thủ Đức, TP.HCM'),
(4, 2, 'Ký túc xá Khu B ĐHQG', 'Đông Hòa, Dĩ An, Bình Dương'),
(5, 3, 'Cơ sở Giải Phóng - NEU', '207 Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội'),
(6, 4, 'Campus Hòa Lạc', 'Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội'),
(7, 4, 'Campus Quận 9 TP.HCM', 'Đường D1, Khu Công nghệ cao, Long Thạnh Mỹ, Thủ Đức, TP.HCM')
ON CONFLICT (id) DO NOTHING;

-- 3. Categories
INSERT INTO categories (id, name, slug, icon) VALUES
(1, 'Giáo trình & Sách vở', 'giao-trinh-sach-vo', 'BookOpen'),
(2, 'Thiết bị công nghệ', 'thiet-bi-cong-nghe', 'Laptop'),
(3, 'Đồ dùng phòng trọ', 'do-dung-phong-tro', 'Home'),
(4, 'Dụng cụ học tập & Thể thao', 'dung-cu-the-thao', 'Wrench'),
(5, 'Thời trang & Phụ kiện', 'thoi-trang-phu-kien', 'Shirt')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence counters if needed
SELECT setval('universities_id_seq', (SELECT MAX(id) FROM universities));
SELECT setval('campuses_id_seq', (SELECT MAX(id) FROM campuses));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

