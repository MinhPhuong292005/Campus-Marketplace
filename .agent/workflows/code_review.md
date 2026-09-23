# WORKFLOW: QUY TRÌNH REVIEW MÃ NGUỒN (CODE REVIEW)
## DỰ ÁN: CAMPUS MARKETPLACE

Quy trình tự kiểm tra mã nguồn (Self Code Review Checklist) trước khi hoàn tất task:

### 1. Checklist Frontend
- [ ] Đã chạy linter không còn cảnh báo lỗi: `npm run lint`.
- [ ] Đã chạy type check thành công không lỗi: `npx tsc --noEmit`.
- [ ] Không có biến `any`, không có code thừa / unused imports.
- [ ] Không hard-code chuỗi hiển thị hay màu sắc CSS.
- [ ] Form submit đã có thông báo lỗi trực quan từ Zod schema.
- [ ] Component có responsive mượt mà trên màn hình di động (< 640px).

### 2. Checklist Backend
- [ ] Tuân thủ mô hình layered (không inject Repo vào Controller).
- [ ] Các tham số đầu vào được validate bằng `@Valid`.
- [ ] Mọi ngoại lệ được throw qua `CustomBusinessException` với ErrorCode chuẩn.
- [ ] Đã đánh dấu `@Transactional` cho các hàm ghi (create/update/delete).
- [ ] Password và thông tin sinh viên nhạy cảm được bảo mật.
- [ ] Viết đầy đủ Unit Test cho các case pass và fail chính.
