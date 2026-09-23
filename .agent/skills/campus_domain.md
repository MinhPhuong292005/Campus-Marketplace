# DOMAIN KNOWLEDGE: TRI THỨC NGHIỆP VỤ CAMPUS MARKETPLACE
## DỰ ÁN: CAMPUS MARKETPLACE

Tài liệu này tóm tắt các quy tắc cốt lõi của bài toán Campus Marketplace để AI Agent tham chiếu khi xử lý nghiệp vụ:

---

## 1. BỐN MÔ HÌNH GIAO DỊCH P2P
1. **Bán (Sell):**
   - Người bán định giá. Người mua có thể chấp nhận giá hoặc gửi đề xuất trả giá (Make Offer).
   - Khi hai bên đồng ý giá, trạng thái bài đăng chuyển sang `RESERVED`.
2. **Cho thuê (Rent):**
   - Đồ vật giá trị cao (máy tính Casio, áo vest, lễ phục, máy ảnh, iPad).
   - Có giá thuê theo ngày/kỳ và tiền đặt cọc (Deposit).
   - Yêu cầu bắt buộc: chụp ảnh hiện trạng thiết bị trước khi giao đồ và lưu vào `rental_contracts`.
3. **Tặng 0đ (Giveaway):**
   - Dành cho sinh viên khóa trên tặng lại giáo trình, giáo án, đồ dùng phòng trọ cho sinh viên khóa dưới.
   - Người nhận bắt buộc phải để lại lý do cần món đồ để người tặng lựa chọn người xứng đáng nhất.
4. **Đổi đồ (Swap):**
   - Người đổi chọn 1 món đồ của mình gửi đề xuất đổi với bài đăng của người khác.
   - Cho phép thỏa thuận tiền bù trừ (Cash Adjustment) nếu giá trị hai món đồ chênh lệch.

---

## 2. QUY TẮC TÍN NHIỆM CAMPUS KARMA
- **Cộng điểm:**
  - Xác thực email sinh viên (.edu.vn): `+20 điểm`.
  - Xác thực thẻ sinh viên (OCR/CCCD): `+15 điểm`.
  - Giao dịch thành công và nhận đánh giá 5 sao: `+5 điểm`.
  - Tặng đồ (Giveaway) thành công: `+10 điểm`.
- **Trừ điểm & Chế tài:**
  - Bị tố cáo bùng hẹn (Bom hẹn) có bằng chứng: `-15 điểm`.
  - Điểm Karma < 0: Bị hạn chế quyền đăng bài và gửi tin nhắn.
  - Gian lận, scam lừa đảo tiền cọc có bằng chứng: Khóa tài khoản vĩnh viễn (`BANNED`).
