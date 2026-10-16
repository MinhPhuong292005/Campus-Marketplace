-- V11: Add student card image url, reset all verification ticks for testing, and link violating post images

-- 1. Add student card image url column
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_card_image_url VARCHAR(500);

-- 2. Reset ALL accounts to NOT verified so user can test the verification feature from scratch
UPDATE users SET student_card_verified = false;

-- 3. Populate realistic student card images for accounts
UPDATE users SET student_card_image_url = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80' WHERE email = '1@st.phenikaa-uni.edu.vn';
UPDATE users SET student_card_image_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80' WHERE email = '2@st.phenikaa-uni.edu.vn';
UPDATE users SET student_card_image_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80' WHERE email = '3@st.phenikaa-uni.edu.vn';
UPDATE users SET student_card_image_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80' WHERE email = '4@st.phenikaa-uni.edu.vn';
UPDATE users SET student_card_image_url = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80' WHERE email = '5@st.phenikaa-uni.edu.vn';
UPDATE users SET student_card_image_url = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80' WHERE student_card_image_url IS NULL;

-- 4. Update evidence image for scam report against user 1 (Hoàng Minh Đức)
UPDATE reports SET evidence_url = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80' WHERE reported_user_id = (SELECT id FROM users WHERE email = '1@st.phenikaa-uni.edu.vn' LIMIT 1);

-- 5. Add images for violating listings
DELETE FROM listing_images WHERE listing_id IN (21, 22);
INSERT INTO listing_images (listing_id, media_url, media_type, sort_order) VALUES 
(21, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&q=80', 'IMAGE', 0),
(22, 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=800&q=80', 'IMAGE', 0);

-- 6. Add violating post for user 1 (Hoàng Minh Đức) if not exists
INSERT INTO listings (
    user_id, category_id, title, description, price, transaction_type, condition_status, status, is_risk_flagged, risk_reason
) 
SELECT 
    u.id, 
    (SELECT id FROM categories LIMIT 1),
    'Máy tính Casio fx 580 VNX còn mới (yêu cầu chuyển cọc 200k)',
    'Máy tính còn dùng tốt. Bạn nào lấy chuyển trước 200k tiền cọc qua tài khoản ngân hàng để mình giữ máy.',
    350000,
    'SELL',
    'LIKE_NEW_99',
    'REJECTED',
    true,
    'Bài đăng bị tố cáo: Scam đồ, lừa cọc 200.000đ của sinh viên khác rồi chặn liên lạc'
FROM users u 
WHERE u.email = '1@st.phenikaa-uni.edu.vn' 
AND NOT EXISTS (SELECT 1 FROM listings WHERE user_id = u.id AND title LIKE '%Casio%')
LIMIT 1;

-- Add image for user 1 violating listing
INSERT INTO listing_images (listing_id, media_url, media_type, sort_order)
SELECT l.id, 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=80', 'IMAGE', 0
FROM listings l
WHERE l.title LIKE '%Casio%' AND l.user_id = (SELECT id FROM users WHERE email = '1@st.phenikaa-uni.edu.vn' LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM listing_images WHERE listing_id = l.id);
