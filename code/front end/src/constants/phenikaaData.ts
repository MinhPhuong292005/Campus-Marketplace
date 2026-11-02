/**
 * Dữ liệu chuẩn hoá theo thông tin chính thức của Trường Đại học Phenikaa (Phenikaa University)
 * Cổng thông tin tuyển sinh & Sơ đồ khuôn viên cơ sở chính (Yên Nghĩa, Hà Đông, Hà Nội)
 */

export interface PhenikaaSafePoint {
  id: number;
  name: string;
  address: string;
  campusName: string;
  description: string;
  recommendedHours: string;
  isCctvMonitored: boolean;
}

export const PHENIKAA_MAJORS: string[] = [
  // Khối Công nghệ Thông tin & Máy tính
  'Công nghệ thông tin',
  'Khoa học máy tính',
  'Kỹ thuật phần mềm',
  'Trí tuệ nhân tạo (AI)',
  'Khoa học dữ liệu',
  'An toàn thông tin',
  'Hệ thống thông tin',
  'Thiết kế vi mạch & Bán dẫn',

  // Khối Kỹ thuật & Công nghệ
  'Kỹ thuật Ô tô',
  'Kỹ thuật Cơ điện tử',
  'Kỹ thuật Cơ điện tử & Robot',
  'Kỹ thuật Điều khiển và Tự động hóa',
  'Kỹ thuật Điện tử - Viễn thông',
  'Kỹ thuật Cơ khí',
  'Kỹ thuật Y sinh',
  'Kỹ thuật Hóa học',
  'Công nghệ sinh học',
  'Công nghệ vật liệu',
  'Kỹ thuật Môi trường',
  'Vật lý học',

  // Khối Kinh tế - Kinh doanh & Quản lý
  'Quản trị kinh doanh',
  'Kinh doanh quốc tế',
  'Marketing',
  'Tài chính - Ngân hàng',
  'Kế toán',
  'Kinh tế số',
  'Logistics và Quản lý chuỗi cung ứng',
  'Thương mại điện tử',
  'Quản trị dịch vụ du lịch và lữ hành',
  'Quản trị khách sạn',

  // Khối Khoa học Xã hội, Ngôn ngữ & Luật
  'Ngôn ngữ Anh',
  'Ngôn ngữ Hàn Quốc',
  'Ngôn ngữ Trung Quốc',
  'Ngôn ngữ Nhật Bản',
  'Luật',
  'Luật kinh tế',
  'Tâm lý học',
  'Đông phương học',

  // Khối Khoa học Sức khỏe
  'Y khoa (Bác sĩ đa khoa)',
  'Dược học',
  'Răng - Hàm - Mặt',
  'Y học cổ truyền',
  'Điều dưỡng',
  'Kỹ thuật Xét nghiệm y học',
  'Kỹ thuật Phục hồi chức năng',
  'Kỹ thuật Hình ảnh y học',
  'Khoa học Y sinh',
  'Quản lý bệnh viện',
];

export const PHENIKAA_ACADEMIC_YEARS: { id: string; label: string }[] = [
  { id: 'K14', label: 'Khóa K14 (2020 – 2024)' },
  { id: 'K15', label: 'Khóa K15 (2021 – 2025)' },
  { id: 'K16', label: 'Khóa K16 (2022 – 2026)' },
  { id: 'K17', label: 'Khóa K17 (2023 – 2027)' },
  { id: 'K18', label: 'Khóa K18 (2024 – 2028)' },
  { id: 'K19', label: 'Khóa K19 (2025 – 2029)' },
  { id: 'K20', label: 'Khóa K20 (2026 – 2030)' },
];

export const PHENIKAA_SAFE_MEETING_POINTS: PhenikaaSafePoint[] = [
  {
    id: 1,
    name: 'Sảnh Tòa A10 (Trung tâm Thư viện Phenikaa & Tòa nhà Điều hành)',
    address: 'Sảnh chính Tầng 1 Tòa tháp A10 (Thư viện Trung tâm Tầng 4-5-6)',
    campusName: 'Trường Đại học Phenikaa (Yên Nghĩa, Hà Đông)',
    description: 'Tòa tháp trung tâm, sảnh rộng rãi, an ninh 24/7, có camera giám sát và ghế chờ giao dịch sách vở, máy tính.',
    recommendedHours: '07:30 – 21:00 (Thứ 2 – Thứ 7)',
    isCctvMonitored: true,
  },
  {
    id: 2,
    name: 'Sảnh Tòa A9 (Khu Giảng đường & Trường Kỹ thuật Phenikaa)',
    address: 'Sảnh Tầng 1 Tòa A9 (Khu vực Ban Tuyển sinh & Tiếp đón sinh viên)',
    campusName: 'Trường Đại học Phenikaa (Yên Nghĩa, Hà Đông)',
    description: 'Khu vực sảnh lớn có bảo vệ túc trực, camera an ninh, gần lối vào từ quảng trường trung tâm.',
    recommendedHours: '07:30 – 19:00 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 3,
    name: 'Sảnh Tòa A2 (Khu Giảng đường Trung tâm)',
    address: 'Sảnh tầng 1 Tòa A2 (Khu Giảng đường học tập chung)',
    campusName: 'Trường Đại học Phenikaa (Yên Nghĩa, Hà Đông)',
    description: 'Khu vực tập trung đông đảo sinh viên giữa các ca học, ánh sáng tốt, có camera CCTV.',
    recommendedHours: '07:00 – 18:30 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 4,
    name: 'Khu Tự học Sinh viên Tòa A4 (Tầng 2)',
    address: 'Khu vực tự học Tầng 2, Tòa nhà A4',
    campusName: 'Trường Đại học Phenikaa (Yên Nghĩa, Hà Đông)',
    description: 'Không gian tự học yên tĩnh, có bàn ghế và ổ cắm điện, thuận tiện kiểm tra đồ dùng học tập và laptop.',
    recommendedHours: '07:30 – 21:00 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 5,
    name: 'Sảnh Tòa A6 (Khu Giảng đường & Phòng thực hành CNTT)',
    address: 'Sảnh Tầng 1 Tòa A6',
    campusName: 'Trường Đại học Phenikaa (Yên Nghĩa, Hà Đông)',
    description: 'Khu vực các phòng máy tính và thực hành, tiện hẹn gặp các bạn sinh viên ngành Công nghệ.',
    recommendedHours: '07:30 – 18:00 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 6,
    name: 'Sảnh Tòa A8 (Khu Thực hành Công nghệ & Mô phỏng Y khoa)',
    address: 'Sảnh Tầng 1 Tòa A8',
    campusName: 'Trường Đại học Phenikaa (Yên Nghĩa, Hà Đông)',
    description: 'Tòa nhà nghiên cứu và thực hành chuyên sâu, có camera an ninh và bảo vệ trực sảnh.',
    recommendedHours: '07:30 – 18:30 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 7,
    name: 'Căng tin Sinh viên Tòa A3 (Khu ẩm thực & Dịch vụ)',
    address: 'Tầng 1 Tòa A3 (Căng tin trung tâm trường Phenikaa)',
    campusName: 'Khu Dịch vụ Sinh viên Phenikaa',
    description: 'Không gian thoáng mát, nhiều bàn ghế ngồi trao đổi đồ uống và giao nhận đồ trực tiếp.',
    recommendedHours: '06:30 – 20:00 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 8,
    name: 'Sảnh trước Ký túc xá Phenikaa (Phòng 105 Ban Quản lý KTX)',
    address: 'Sảnh trước Nhà KTX Sinh viên (Khu nội trú Phenikaa)',
    campusName: 'Khu Ký túc xá Sinh viên Phenikaa',
    description: 'Bảo vệ KTX trực 24/24, camera an ninh ra vào, rất an toàn cho sinh viên nội trú hẹn nhận đồ.',
    recommendedHours: '06:00 – 22:30 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 9,
    name: 'Nhà thi đấu Đa năng & Sân bóng đá Phenikaa',
    address: 'Khu liên hợp thể thao Phenikaa (Cạnh Tòa A3 và KTX)',
    campusName: 'Khu thể thao sinh viên Phenikaa',
    description: 'Khu thể thao rộng rãi, thoáng đãng, có đèn chiếu sáng ban đêm và bảo vệ tuần tra.',
    recommendedHours: '06:00 – 21:30 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 10,
    name: 'Chốt An ninh Cổng chính Phenikaa (Đường Nguyễn Trác, Yên Nghĩa)',
    address: 'Cổng chính Trường ĐH Phenikaa, Đường Nguyễn Trác, P. Yên Nghĩa, Q. Hà Đông, Hà Nội',
    campusName: 'Cổng chính Trường ĐH Phenikaa',
    description: 'Chốt an ninh bảo vệ kiểm soát ra vào trường 24/7, có camera nhận diện biển số và người ra vào.',
    recommendedHours: '06:00 – 22:00 hàng ngày',
    isCctvMonitored: true,
  },
  {
    id: 11,
    name: 'Trước cửa Cổng bảo vệ (Cổng chính Trường Đại học Phenikaa)',
    address: 'Trước chốt bảo vệ Cổng chính, Trường ĐH Phenikaa (Đường Nguyễn Trác, Yên Nghĩa)',
    campusName: 'Cổng chính Trường ĐH Phenikaa',
    description: 'Chốt bảo vệ an ninh túc trực 24/7, có camera giám sát và đèn chiếu sáng, giao dịch an toàn và thuận tiện ngay lối vào trường.',
    recommendedHours: '06:00 – 22:30 hàng ngày',
    isCctvMonitored: true,
  },
];

