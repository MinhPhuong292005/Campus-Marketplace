# WORKFLOW: QUY TRÌNH PHÁT TRIỂN TÍNH NĂNG MỚI (FEATURE DEVELOPMENT)
## DỰ ÁN: CAMPUS MARKETPLACE

Khi nhận yêu cầu thêm hoặc sửa đổi tính năng, AI Agent phải tuân thủ 5 bước chuẩn hóa sau:

```text
[Bước 1: Phân tích SRS & User Story]
         │
         ▼
[Bước 2: Cập nhật / Xác thực Database ERD & Migration SQL]
         │
         ▼
[Bước 3: Xây dựng Backend (Entity -> Repo -> Service -> Controller)]
         │
         ▼
[Bước 4: Xây dựng Frontend (Types -> Schemas -> Service -> UI Component)]
         │
         ▼
[Bước 5: Kiểm thử (Unit Test + E2E Test Case Execution)]
```

### Chi tiết từng bước:
1. **Bước 1:** Đối chiếu tính năng với tài liệu SRS (`docs/srs.md`) và Backlog tương ứng (`docs/backlogs/`). Xác định rõ vai trò người dùng (Student, Moderator, Super Admin).
2. **Bước 2:** Nếu có thay đổi bảng dữ liệu, tạo file migration mới trong `code/backend/src/main/resources/db/migration/` (ví dụ `V2__Add_X.sql`) và cập nhật `docs/DB-erd/`.
3. **Bước 3:** 
   - Tạo DTO Request/Response bọc validation `@NotBlank`, `@Size`, `@Min`.
   - Viết Service Interface và Implementation chứa logic nghiệp vụ.
   - Viết Controller kế thừa `BaseController` và trả về `ApiResponse<T>`.
4. **Bước 4:**
   - Định nghĩa TypeScript interfaces trong `src/types/`.
   - Viết schema validation với Zod trong `src/schemas/`.
   - Viết API client trong `src/services/`.
   - Dựng UI Component tuân thủ Design Tokens và Style Guideline.
5. **Bước 5:**
   - Viết Unit Test cho Service.
   - Thêm Test Case vào thư mục `test/test_cases/`.
