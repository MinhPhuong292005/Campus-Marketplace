# TÀI LIỆU HƯỚNG DẪN THIẾT KẾ UI/UX (STYLE GUIDELINE)
## DỰ ÁN: CAMPUS MARKETPLACE
### Nền tảng Thương mại Điện tử Học đường Trẻ trung, Năng động & Hiện đại

Tài liệu này quy chuẩn hệ thống Design Tokens, Typography, Bảng màu và các nguyên tắc thiết kế giao diện cho toàn bộ hệ thống Campus Marketplace.

---

## 1. TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY)
- **Campus Native:** Giao diện đậm chất sinh viên: tươi mới, năng động, giàu năng lượng học đường nhưng vẫn giữ tính gọn gàng, rõ ràng.
- **Mobile-First & P2P Focused:** Ưu tiên tối đa trải nghiệm trên điện thoại thông minh, thao tác đăng bài và nhắn tin nhanh chóng.
- **Trust & Safety First:** Điểm tín nhiệm Karma, xác thực sinh viên được tôn vinh bằng các huy hiệu (badges) trực quan, tạo cảm giác an tâm tuyệt đối khi giao dịch.
- **Micro-interactions:** Hiệu ứng hover mượt mà, chuyển trang êm ái, tương tác phản hồi tức thì với feedback trực quan.

---

## 2. BẢNG MÀU CHUẨN (COLOR PALETTE)

Hệ thống màu sắc sử dụng biến thể HSL linh hoạt, hỗ trợ Light Mode và Dark Mode hoàn hảo:

### 2.1 Bảng màu chính (Brand Colors)
| Tên Token | Hex Code | HSL | Mục đích sử dụng |
|---|---|---|---|
| `--color-primary-500` | `#2563EB` | `hsl(221, 83%, 53%)` | Màu xanh chủ đạo trường học (Campus Blue) - Nút chính, liên kết, thương hiệu |
| `--color-primary-600` | `#1D4ED8` | `hsl(224, 76%, 48%)` | Hover cho nút chính |
| `--color-secondary-500`| `#10B981` | `hsl(160, 84%, 39%)` | Màu xanh lá tin cậy (Karma Trust Emerald) - Điểm Karma, xác thực thẻ SV |
| `--color-accent-amber` | `#F59E0B` | `hsl(38, 92%, 50%)`  | Đổi đồ (Swap) và Đánh giá sao |
| `--color-accent-purple`| `#8B5CF6` | `hsl(258, 90%, 66%)` | Cho thuê (Rent) và Hợp đồng |
| `--color-accent-pink`  | `#EC4899` | `hsl(330, 81%, 60%)` | Góc tặng đồ 0đ (Giveaway) |

### 2.2 Màu nền & Bề mặt (Surfaces & Backgrounds)
- **Light Mode:**
  - Background tổng thể: `#F8FAFC` (Slate 50)
  - Card / Surface: `#FFFFFF` (Pure White) với subtle border `#E2E8F0` và drop shadow nhẹ (`0 1px 3px rgba(0,0,0,0.05)`).
  - Text chính: `#0F172A` (Slate 900)
  - Text phụ: `#64748B` (Slate 500)
- **Dark Mode:**
  - Background tổng thể: `#0B0F17` (Deep Obsidian Dark)
  - Card / Surface: `#161E2E` (Sleek Dark Slate) với border viền kính mờ `#1F293D`
  - Text chính: `#F8FAFC` (Slate 50)
  - Text phụ: `#94A3B8` (Slate 400)

---

## 3. TYPOGRAPHY

Sử dụng Google Fonts hiện đại: **Outfit** (cho Headings) và **Inter** (cho Body Text).

| Cấp bậc | Font Family | Size | Line Height | Weight | Sử dụng |
|---|---|---|---|---|---|
| `Display / H1` | `Outfit, sans-serif` | 32px (2rem) | 1.2 | Bold (700) | Hero title, Tiêu đề màn hình chính |
| `H2` | `Outfit, sans-serif` | 24px (1.5rem)| 1.3 | SemiBold (600) | Tiêu đề khối danh mục, Section heading |
| `H3` | `Outfit, sans-serif` | 20px (1.25rem)| 1.35 | Medium (500) | Tiêu đề Card sản phẩm, Modal title |
| `Body Large` | `Inter, sans-serif` | 16px (1rem) | 1.5 | Regular (400) | Nội dung chi tiết bài đăng, tin nhắn |
| `Body Small` | `Inter, sans-serif` | 14px (0.875rem)| 1.4 | Regular (400) | Mô tả phụ, thông tin người bán |
| `Caption` | `Inter, sans-serif` | 12px (0.75rem)| 1.3 | Medium (500) | Timestamp, Tags, Badge số lượng |

---

## 4. QUY CHUẨN COMPONENT (COMPONENT GUIDELINES)

### 4.1 Transaction Badges
Mỗi loại giao dịch có màu sắc nhận diện riêng biệt:
- **Bán (Sell):** Badge xanh dương viền nhạt `bg-blue-50 text-blue-700 border-blue-200`.
- **Cho thuê (Rent):** Badge tím `bg-purple-50 text-purple-700 border-purple-200`.
- **Tặng 0đ (Giveaway):** Badge hồng `bg-pink-50 text-pink-700 border-pink-200`.
- **Đổi đồ (Swap):** Badge cam `bg-amber-50 text-amber-700 border-amber-200`.

### 4.2 Campus Karma Badge
- Hiển thị hình chiếc khiên tín nhiệm kèm điểm số.
- Màu sắc theo mức Karma:
  - Karma >= 50: Vàng kim hoàng gia (Gold / Super Trusted).
  - 20 - 49: Xanh lục Emerald (Verified Student).
  - < 20: Xám / Cảnh báo nhẹ.

### 4.3 Nút bấm (Buttons)
- Bo góc: `rounded-xl` (12px) hiện đại, không quá vuông cũng không quá tròn.
- Chiều cao chuẩn: `h-10` (40px) cho nút thường, `h-12` (48px) cho Call-to-action.
- State: Có chuyển động scale nhẹ khi active `active:scale-95 transition-all duration-150`.
