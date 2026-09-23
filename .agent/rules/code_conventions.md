# AGENT RULES: TIÊU CHUẨN CODE & KIẾN TRÚC
## DỰ ÁN: CAMPUS MARKETPLACE

Khi thực hiện sinh mã (code generation), sửa đổi hoặc tái cấu trúc (refactor), AI Agent bắt buộc phải tuân thủ các quy định sau:

---

## 1. RANH GIỚI THƯ MỤC VÀ KIẾN TRÚC

### 1.1 Phía Frontend (`code/front end/`)
- Mọi trang màn hình phải đặt trong `src/pages/<FeatureName>/<FeatureName>Page.tsx`.
- Component dùng chung không chứa logic nghiệp vụ đặt tại `src/components/base/`.
- Component gắn liền với nghiệp vụ bài đăng/người dùng đặt tại `src/components/features/`.
- Không gọi trực tiếp `axios` hoặc `fetch` trong component; bắt buộc tạo service trong `src/services/` và import vào.
- Toàn bộ form submit phải sử dụng validator Zod từ `src/schemas/`.
- Không sử dụng `any`, không hard-code hex màu (sử dụng tokens CSS hoặc class Tailwind chuẩn).

### 1.2 Phía Backend (`code/backend/`)
- Cấu trúc đơn hướng: `Controller -> Service -> Repository -> Entity`.
- Không bao giờ inject `Repository` trực tiếp vào `Controller`.
- Không bao giờ trả `Entity` ra ngoài Controller; phải chuyển đổi sang `Response DTO`.
- Mọi API phải trả về bọc trong `ApiResponse<T>`.
- Xử lý ngoại lệ nghiệp vụ bằng `CustomBusinessException` và mã lỗi từ `ErrorCodes`.
- Không hard-code chuỗi thông báo lỗi tiếng Việt; lấy từ `ResourceBundle` (`messages.properties`).

---

## 2. NGUYÊN TẮC CLEAN CODE & ANTI-PATTERNS
- Không sử dụng Magic Numbers: khai báo hằng số trong `common/constants/` hoặc `constants/index.ts`.
- Giữ các hàm đơn nhiệm (Single Responsibility Principle - SRP), không viết hàm dài quá 40 dòng.
- Đặt tên biến và hàm tường minh: `canUserMakeOffer()`, `calculateKarmaBonus()`, `isEduEmailValid()`.
