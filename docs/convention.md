# QUY TẮC PHÁT TRIỂN & CHUẨN MÃ NGUỒN (CONVENTION)
## DỰ ÁN: CAMPUS MARKETPLACE

Tài liệu này định nghĩa toàn bộ các tiêu chuẩn, quy tắc kỹ thuật và convention bắt buộc cho toàn bộ đội ngũ phát triển (Frontend, Backend, QA/QC, AI Agent) nhằm đảm bảo tính nhất quán, bảo mật và dễ bảo trì.

---

## 1. QUY TẮC CHUNG (GENERAL CONVENTIONS)

### 1.1 Quản lý Git & Branch
- **Nhánh chính (Main branches):**
  - `main`: Nhánh production, luôn ở trạng thái sẵn sàng release.
  - `develop`: Nhánh tích hợp chính cho môi trường Staging/UAT.
- **Nhánh chức năng (Feature branches):**
  - `feature/sprint<N>-<short-description>`: Ví dụ `feature/sprint1-auth-edu-email`.
  - `bugfix/<ticket-id>-<description>`: Ví dụ `bugfix/fix-chat-socket-timeout`.
  - `hotfix/<description>`: Vá lỗi trực tiếp trên production.
- **Commit Message tuân thủ Conventional Commits:**
  - Cú pháp: `<type>(<scope>): <subject>`
  - Ví dụ:
    - `feat(auth): integrate google workspace sso for edu domain`
    - `fix(listing): validate price not negative for sell type`
    - `refactor(backend): extract karma calculation to domain service`
    - `test(e2e): add test case for rental deposit flow`
    - `docs(erd): update relations between listing and swap proposals`

### 1.2 Nguyên tắc Viết Code Sạch (Clean Code)
1. **No Hard-coding:**
   - Tuyệt đối không hard-code văn bản hiển thị: Sử dụng i18n / ResourceBundle (`messages.properties` ở backend, file locale / constants ở frontend).
   - Tuyệt đối không hard-code mã màu hex trực tiếp trong component: Sử dụng CSS variables hoặc Tailwind theme tokens.
   - Tuyệt đối không hard-code URL / Port / Credentials: Đưa vào `.env` hoặc `application.yml`.
2. **No Magic Numbers / Magic Strings:**
   - Mọi số lượng, trạng thái, thời gian chờ (timeout) phải định nghĩa dưới dạng hằng số (`ENUM` hoặc `CONSTANTS`).
   - Ví dụ: `LISTING_MAX_IMAGES = 6;`, `KARMA_EDU_VERIFY_BONUS = 20;`.
3. **Strict Typing:**
   - Frontend: Không dùng kiểu `any` trong TypeScript, bật `strict: true`.
   - Backend: Dùng Generic, DTO rõ ràng, không trả về raw `Map<String, Object>` trong Controller.
4. **Boundary Separation (Ranh giới module):**
   - Tầng Controller chỉ tiếp nhận request và gọi Service, không chứa business logic.
   - Tầng Component UI chỉ lo hiển thị và nhận props, business logic phức tạp đẩy vào Custom Hooks và Services.

---

## 2. QUY TẮC FRONTEND (REACT JS + TYPESCRIPT)

### 2.1 Quy tắc đặt tên (Naming Conventions)
| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| Tên thư mục component | `kebab-case` hoặc `PascalCase` cho Pages | `components/base/`, `pages/Auth/` |
| File Component (.tsx) | `PascalCase` | `BaseButton.tsx`, `ListingCard.tsx` |
| File Hook (.ts) | `camelCase` bắt đầu bằng `use` | `useDebounce.ts`, `useAuth.ts` |
| File Service / Util (.ts) | `camelCase` | `authService.ts`, `formatters.ts` |
| Zod Schema (.ts) | `camelCase` kèm hậu tố `.schema` | `auth.schema.ts`, `listing.schema.ts` |
| CSS Class | `kebab-case` hoặc Tailwind utility classes | `campus-card`, `btn-primary` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE_MB`, `API_ENDPOINTS` |

### 2.2 Kiến trúc thư mục Frontend
- `src/components/base/`: Các component nguyên tử độc lập nghiệp vụ (Button, Input, Modal, Table).
- `src/components/features/`: Component gắn liền nghiệp vụ (ListingCard, KarmaBadge, ChatBox).
- `src/pages/`: Các màn hình tương ứng với các route.
- `src/routes/`: Cấu hình router tập trung bằng React Router.
- `src/layouts/`: Khung giao diện (MainLayout, AuthLayout, AdminLayout).
- `src/services/`: Tách biệt toàn bộ hàm gọi HTTP API (Axios).
- `src/store/`: Quản lý state toàn cục với Zustand (nhẹ, module hóa, không boilerplate như Redux).
- `src/schemas/`: Toàn bộ form validation sử dụng Zod schema để đồng bộ kiểu dữ liệu.

### 2.3 ESLint & Prettier
- Sử dụng Flat Config `eslint.config.mjs`.
- Bật `eslint-plugin-boundaries` để ngăn chặn việc import chéo trái phép (ví dụ: `components/base` không được import `pages/`).
- Bật `unused-imports/no-unused-imports` để tự động dọn dẹp import thừa.
- Sử dụng Husky `pre-commit` để chạy `npm run lint` và `tsc --noEmit` trước khi cho phép commit.

---

## 3. QUY TẮC BACKEND (SPRING BOOT LAYERED)

### 3.1 Quy tắc cấu trúc tầng (Layered Architecture)
Mã nguồn Java bắt buộc tuân theo luồng đơn hướng:
`Client Request -> Controller -> Service (Interface -> Impl) -> Repository -> Database`
- **Controller Layer (`controller/`):**
  - Chỉ nhận DTO `@Valid`, gọi Service, trả về `ApiResponse<T>`.
  - Phân chia rõ: `admin/` (cho Moderator & Super Admin) và `student/` (cho Sinh viên).
- **DTO Layer (`dto/`):**
  - Tách bạch `request/` (ví dụ `UserCreateReq`) và `response/` (ví dụ `UserDetailRes`).
  - Không bao giờ trả trực tiếp JPA Entity ra ngoài API.
- **Service Layer (`service/`):**
  - Bắt buộc khai báo Interface ở thư mục cha và code triển khai ở `impl/`.
  - Quản lý transaction bằng `@Transactional`.
- **Repository Layer (`repository/`):**
  - Kế thừa `JpaRepository` cho CRUD cơ bản.
  - Các câu truy vấn phức tạp hoặc native SQL gom vào `repository/custom/`.
- **Entity Layer (`entity/`):**
  - Mọi Entity đều kế thừa `BaseEntity` (có `id`, `createdAt`, `updatedAt`).
  - Sử dụng tên bảng số nhiều: `users`, `listings`, `campuses`.

### 3.2 Quy tắc xử lý Exception & Response
- Bắt lỗi tập trung tại `GlobalExceptionHandler` với `@RestControllerAdvice`.
- Chuẩn định dạng phản hồi API JSON:
```json
{
  "success": true,
  "code": 200,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-09-23T10:50:00Z"
}
```
- Khi xảy ra lỗi:
```json
{
  "success": false,
  "code": 40001,
  "message": "Email sinh viên không hợp lệ hoặc không thuộc danh sách trường được hỗ trợ",
  "errors": [ ... ],
  "timestamp": "2026-09-23T10:50:00Z"
}
```

---

## 4. QUY TẮC BẢO MẬT & DỮ LIỆU CÁ NHÂN (SECURITY & PRIVACY)
1. **Tuân thủ Nghị định 13/2023/NĐ-CP:**
   - Ẩn toàn bộ email, mã số sinh viên (MSSV) và số điện thoại đối với người dùng thông thường. Chỉ hiển thị tên hiển thị, Campus, Khoa và Karma Score.
2. **Xác thực & Phân quyền:**
   - Sử dụng JWT Access Token (ngắn hạn: 15 phút) và Refresh Token (dài hạn: 7 ngày, lưu trữ HttpOnly Cookie an toàn).
   - Kiểm tra vai trò nghiêm ngặt (`ROLE_STUDENT`, `ROLE_MODERATOR`, `ROLE_SUPER_ADMIN`).
3. **Anti-Fraud Chat:**
   - Toàn bộ tin nhắn chat qua WebSocket phải được lọc từ khóa nhạy cảm (từ khóa scam, lừa đảo chuyển tiền trước, liên kết ngoài nguy hiểm).
