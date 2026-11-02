-- ====================================================================
-- V16__Clear_All_Mock_Data_And_Retain_Fresh_State.sql
-- Xóa toàn bộ dữ liệu sản phẩm, người dùng test, dữ liệu mẫu
-- Giữ hệ thống hoàn toàn sạch sẽ để người dùng tự thêm dữ liệu và kiểm thử
-- ====================================================================

-- 1. Xóa giao dịch, tin nhắn, hợp đồng, đánh giá, khiếu nại
DELETE FROM rental_contracts;
DELETE FROM swap_proposals;
DELETE FROM reviews;
DELETE FROM messages;
DELETE FROM chat_rooms;
DELETE FROM notifications;
DELETE FROM reports;
DELETE FROM audit_logs;
DELETE FROM banned_student_codes;

-- 2. Xóa toàn bộ hình ảnh và bài đăng sản phẩm
DELETE FROM listing_images;
DELETE FROM listings;

-- 3. Xóa toàn bộ người dùng ngoại trừ Quản trị viên hệ thống (Super Admin)
DELETE FROM users WHERE email != 'admin@gmail.com';

-- 4. Reset sequences về giá trị khởi đầu
SELECT setval('listings_id_seq', 1, false);
SELECT setval('listing_images_id_seq', 1, false);
SELECT setval('swap_proposals_id_seq', 1, false);
SELECT setval('rental_contracts_id_seq', 1, false);
SELECT setval('reviews_id_seq', 1, false);
SELECT setval('chat_rooms_id_seq', 1, false);
SELECT setval('messages_id_seq', 1, false);
SELECT setval('notifications_id_seq', 1, false);
SELECT setval('reports_id_seq', 1, false);
SELECT setval('audit_logs_id_seq', 1, false);
SELECT setval('users_id_seq', 2, false);
