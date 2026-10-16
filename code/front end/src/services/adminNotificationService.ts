export interface AdminNotification {
  id: string;
  type: 'APPEAL' | 'REPORT' | 'CARD_VERIFY' | 'SYSTEM';
  title: string;
  studentId?: number;
  studentName: string;
  studentEmail: string;
  studentCode?: string;
  phone?: string;
  universityName?: string;
  dormitory?: string;
  karmaScore?: number;
  currentStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'BLOCKED';
  violationReason?: string;
  reportedListingTitle?: string;
  reportedListingPrice?: number;
  reporterName?: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
  isRead: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  resolvedAt?: string;
}

const STORAGE_KEY = 'campus_admin_notifications_v3';

export const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'notif-1',
    type: 'APPEAL',
    title: 'Đơn khiếu nại mở khóa tài khoản - Hoàng Minh Đức',
    studentId: 22,
    studentName: 'Hoàng Minh Đức (Tố cáo Scam)',
    studentEmail: '1@st.phenikaa-uni.edu.vn',
    studentCode: '23010001',
    phone: '0981000001',
    universityName: 'Trường Đại học Phenikaa',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 302',
    karmaScore: 20,
    currentStatus: 'BANNED',
    violationReason: 'Tố cáo quỵt cọc 200.000đ giữ máy tính Casio & sách chuyên ngành',
    message: 'Em chào Ban quản trị Phenikaa, tài khoản em bị tố cáo hiểu nhầm do người mua chuyển nhầm số tài khoản và tưởng em scam cọc. Em đã đối soát và chủ động hoàn trả 100% tiền cọc 200.000đ qua Vietcombank. Kính mong thầy cô Admin xem xét hóa đơn đối chứng đính kèm và mở khóa tài khoản giúp em ạ.',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
    status: 'PENDING',
  },
  {
    id: 'notif-2',
    type: 'REPORT',
    title: 'Cảnh báo vi phạm: Rao bán Vape Pod trong KTX - Vũ Hải Đăng',
    studentId: 23,
    studentName: 'Vũ Hải Đăng (Bán Vape Pod)',
    studentEmail: '2@st.phenikaa-uni.edu.vn',
    studentCode: '23010002',
    phone: '0981000002',
    universityName: 'Trường Đại học Phenikaa',
    dormitory: 'KTX Phenikaa, Tòa K2 - Phòng 405',
    karmaScore: 18,
    currentStatus: 'SUSPENDED',
    violationReason: 'Rao bán thuốc lá điện tử vape pod trái quy chế Bộ GD&ĐT và Đại học Phenikaa',
    reportedListingTitle: 'Bán máy Vape Pod mini siêu khói giá rẻ',
    reportedListingPrice: 200000,
    reporterName: 'Đội Tự quản KTX Phenikaa (Ẩn danh)',
    message: 'Hệ thống tự động phát hiện bài đăng chứa từ khóa cấm [vape, pod] và nhận được phản ánh từ sinh viên KTX Tòa K2. Bài đăng đã bị chặn tự động, tài khoản đang trong diện xem xét chế tài.',
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&q=80',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
    status: 'PENDING',
  },
  {
    id: 'notif-3',
    type: 'REPORT',
    title: 'Báo cáo khẩn cấp: Rao bán chất cấm Cần Sa - Trần Tuấn Cường',
    studentId: 24,
    studentName: 'Trần Tuấn Cường (Bán Cần Sa)',
    studentEmail: '3@st.phenikaa-uni.edu.vn',
    studentCode: '23010003',
    phone: '0981000003',
    universityName: 'Trường Đại học Phenikaa',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 510',
    karmaScore: 15,
    currentStatus: 'BANNED',
    violationReason: 'Rao bán chất cấm cần sa CBD trong khuôn viên trường đại học',
    reportedListingTitle: 'Pass lại tinh dầu cần sa cbd thư giãn giảm stress',
    reportedListingPrice: 350000,
    reporterName: 'Cán bộ Quản lý KTX Phenikaa',
    message: 'Sinh viên cố tình rao bán tinh dầu cần sa trong diễn đàn sinh viên. Mức độ vi phạm nghiêm trọng (CRITICAL). Đề xuất cấm vĩnh viễn và chuyển hồ sơ về Phòng Công tác Sinh viên.',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    status: 'PENDING',
  },
  {
    id: 'notif-4',
    type: 'CARD_VERIFY',
    title: 'Yêu cầu xác thực thẻ SV Phenikaa K16 - Lê Thu Hà',
    studentId: 25,
    studentName: 'Lê Thu Hà (SV Phenikaa K16)',
    studentEmail: '4@st.phenikaa-uni.edu.vn',
    studentCode: '23010004',
    phone: '0981000004',
    universityName: 'Trường Đại học Phenikaa',
    dormitory: 'KTX Nữ Phenikaa - Phòng 204',
    karmaScore: 30,
    currentStatus: 'ACTIVE',
    message: 'Sinh viên ngành Ngôn ngữ Anh Phenikaa K16 đã hoàn tất tải ảnh 2 mặt thẻ sinh viên qua hệ thống OCR tự động. Thông tin khớp 100% cơ sở dữ liệu trường. Yêu cầu cấp tích xanh uy tín và thưởng +15 điểm Karma.',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    status: 'PENDING',
  },
  {
    id: 'notif-5',
    type: 'CARD_VERIFY',
    title: 'Yêu cầu xác thực thẻ SV Phenikaa K17 - Đỗ Gia Huy',
    studentId: 26,
    studentName: 'Đỗ Gia Huy (SV Phenikaa K17)',
    studentEmail: '5@st.phenikaa-uni.edu.vn',
    studentCode: '23010005',
    phone: '0981000005',
    universityName: 'Trường Đại học Phenikaa',
    dormitory: 'KTX Phenikaa, Tòa K3 - Phòng 108',
    karmaScore: 25,
    currentStatus: 'ACTIVE',
    message: 'Sinh viên Khoa Dược K17 Phenikaa tải lên ảnh thẻ sinh viên để mở khóa tính năng trao đổi giáo trình & dụng cụ thực hành. Đề nghị Quản trị viên duyệt cấp tích xanh bảo chứng trường.',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    status: 'PENDING',
  },
  {
    id: 'notif-6',
    type: 'APPEAL',
    title: 'Khiếu nại đối soát giao dịch bàn giao tại Safe Point Sảnh A',
    studentId: 27,
    studentName: 'Nguyễn Văn Nam (Phenikaa K18)',
    studentEmail: 'nam.nv24@st.phenikaa-uni.edu.vn',
    studentCode: '24010892',
    phone: '0981000088',
    universityName: 'Trường Đại học Phenikaa',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 212',
    karmaScore: 40,
    currentStatus: 'ACTIVE',
    message: 'Em đã giao đủ sách Giải tích và biên nhận tại Safe Meeting Point Sảnh Tòa A Phenikaa, có ảnh chụp đối chứng với người nhận, nhưng đối tác chưa xác nhận hoàn tất trên web. Kính nhờ Admin kiểm tra hóa đơn và duyệt giao dịch giúp em.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    status: 'APPROVED',
  },
];

export const adminNotificationService = {
  getNotifications: (): AdminNotification[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
        return INITIAL_NOTIFICATIONS;
      }
      const parsed: AdminNotification[] = JSON.parse(raw);
      // Auto-merge with INITIAL_NOTIFICATIONS to ensure all core sample items exist
      if (parsed.length < INITIAL_NOTIFICATIONS.length) {
        const existingIds = new Set(parsed.map((item) => item.id));
        const missing = INITIAL_NOTIFICATIONS.filter((item) => !existingIds.has(item.id));
        const merged = [...parsed, ...missing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  addNotification: (
    notif: Omit<AdminNotification, 'id' | 'createdAt' | 'isRead' | 'status'>
  ): AdminNotification => {
    const list = adminNotificationService.getNotifications();
    const newNotif: AdminNotification = {
      ...notif,
      id: 'notif-' + Date.now(),
      createdAt: new Date().toISOString(),
      isRead: false,
      status: 'PENDING',
    };
    const updated = [newNotif, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('admin_notifications_updated', { detail: updated }));
    return newNotif;
  },

  markAsRead: (id: string) => {
    const list = adminNotificationService.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('admin_notifications_updated', { detail: updated }));
  },

  markAllAsRead: () => {
    const list = adminNotificationService.getNotifications();
    const updated = list.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('admin_notifications_updated', { detail: updated }));
  },

  resolveNotification: (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    adminNotes?: string
  ) => {
    const list = adminNotificationService.getNotifications();
    const updated = list.map((n) =>
      n.id === id
        ? {
            ...n,
            status,
            isRead: true,
            adminNotes: adminNotes || n.adminNotes,
            resolvedAt: new Date().toISOString(),
          }
        : n
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('admin_notifications_updated', { detail: updated }));
  },

  resetNotifications: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    window.dispatchEvent(
      new CustomEvent('admin_notifications_updated', { detail: INITIAL_NOTIFICATIONS })
    );
    return INITIAL_NOTIFICATIONS;
  },

  getUnreadCount: (): number => {
    const list = adminNotificationService.getNotifications();
    return list.filter((n) => !n.isRead && n.status === 'PENDING').length;
  },
};
