import { adminService } from './adminService';
import { reportService } from './reportService';

export interface AdminNotification {
  id: string;
  type: 'LISTING_PENDING' | 'REPORT' | 'DISPUTE' | 'APPEAL' | 'CARD_VERIFY' | 'SYSTEM';
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
  reportedListingId?: number;
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

const STORAGE_KEY = 'campus_admin_notifications_fresh_v5';

try {
  localStorage.removeItem('campus_admin_notifications_v4');
  localStorage.removeItem('campus_admin_notifications_v3');
  localStorage.removeItem('campus_admin_notifications_v2');
  localStorage.removeItem('campus_admin_notifications');
} catch {}

export const INITIAL_NOTIFICATIONS: AdminNotification[] = [];

export const adminNotificationService = {
  getNotifications: (): AdminNotification[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // Connect & sync with real backend pending listings & reports
  syncWithBackend: async (): Promise<AdminNotification[]> => {
    const currentList = adminNotificationService.getNotifications();
    let hasChanges = false;
    let updatedList = [...currentList];

    try {
      // 1. Fetch real pending listings from backend
      const listingsRes = await adminService.getListings({ status: 'PENDING_APPROVAL' });
      const rawListings: any[] =
        (listingsRes.data as any)?.items || (listingsRes.data as any)?.content || [];

      if (listingsRes.success) {
        const pendingListingIds = new Set(rawListings.map((l) => l.id));

        for (const item of rawListings) {
          const notifId = `notif-backend-listing-${item.id}`;
          const existingIdx = updatedList.findIndex(
            (n) => n.id === notifId || (n.type === 'LISTING_PENDING' && n.reportedListingId === item.id)
          );

          if (existingIdx === -1) {
            const newNotif: AdminNotification = {
              id: notifId,
              type: 'LISTING_PENDING',
              title: `Duyệt bài đăng mới: ${item.title}`,
              studentId: item.userId,
              studentName: item.authorName || 'Sinh viên đăng bài',
              studentEmail: `${item.userId}@st.phenikaa-uni.edu.vn`,
              reportedListingId: item.id,
              reportedListingTitle: item.title,
              reportedListingPrice: item.price,
              violationReason: item.moderationReason || 'Bài đăng mới cần Quản trị viên duyệt',
              message: `Bài viết "${item.title}" được đăng tải với giá ${item.price?.toLocaleString()} đ. Chờ Quản trị viên kiểm tra hình ảnh và nội dung.`,
              imageUrl: item.imageUrls?.[0] || '',
              createdAt: item.createdAt || new Date().toISOString(),
              isRead: false,
              status: 'PENDING',
            };
            updatedList = [newNotif, ...updatedList];
            hasChanges = true;
          } else {
            // Nếu bài đăng đang ở hàng đợi duyệt thì đảm bảo notification luôn ở trạng thái PENDING
            if (updatedList[existingIdx].status !== 'PENDING') {
              updatedList[existingIdx] = {
                ...updatedList[existingIdx],
                status: 'PENDING',
                isRead: false,
                title: `Duyệt bài đăng: ${item.title}`,
                reportedListingTitle: item.title,
                reportedListingPrice: item.price,
              };
              hasChanges = true;
            }
          }
        }

        // Đánh dấu các thông báo bài đăng đã được duyệt xong
        updatedList = updatedList.map((n) => {
          if (
            n.type === 'LISTING_PENDING' &&
            n.reportedListingId &&
            !pendingListingIds.has(n.reportedListingId) &&
            n.status === 'PENDING'
          ) {
            hasChanges = true;
            return { ...n, status: 'APPROVED', isRead: true };
          }
          return n;
        });
      }

      // 2. Fetch real reports from backend
      const reportsRes = await reportService.getReports();
      const rawReports: any[] =
        (reportsRes.data as any)?.items || (reportsRes.data as any)?.content || [];

      if (reportsRes.success && rawReports.length > 0) {
        for (const rep of rawReports) {
          const notifId = `notif-backend-report-${rep.id}`;
          const existingIdx = updatedList.findIndex(
            (n) => n.id === notifId || (n.type === 'REPORT' && (n as any).reportId === rep.id)
          );

          if (existingIdx === -1 && (rep.status === 'PENDING' || rep.status === 'OPEN')) {
            const isDispute =
              rep.reason === 'BOM_HEN' || rep.reason === 'SCAM_COC' || rep.reason === 'HANG_GIA';
            const newNotif: AdminNotification = {
              id: notifId,
              type: isDispute ? 'DISPUTE' : 'REPORT',
              title: isDispute
                ? `Khiếu nại giao dịch #${rep.id}: ${rep.reason}`
                : `Báo cáo nội dung bài viết #${rep.id}`,
              studentId: rep.reportedUserId,
              studentName: rep.reportedUserName || 'Người dùng bị báo cáo',
              studentEmail: rep.reportedUserId
                ? `${rep.reportedUserId}@st.phenikaa-uni.edu.vn`
                : 'sinhvien@st.phenikaa-uni.edu.vn',
              reportedListingId: rep.reportedListingId,
              reportedListingTitle: rep.reportedListingTitle,
              reporterName: rep.reporterName,
              violationReason: `Lý do vi phạm: ${rep.reason}`,
              message: rep.description,
              imageUrl: rep.evidenceUrl,
              createdAt: rep.createdAt,
              isRead: false,
              status: 'PENDING',
            };
            updatedList = [newNotif, ...updatedList];
            hasChanges = true;
          }
        }
      }
    } catch {
      // Backend sync fallback
    }

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('admin_notifications_updated', { detail: updatedList }));
    }

    return updatedList;
  },

  resolveListingNotification: (
    listingId: number,
    status: 'APPROVED' | 'REJECTED' = 'APPROVED',
    reason?: string
  ) => {
    const list = adminNotificationService.getNotifications();
    let hasChanges = false;
    const updated = list.map((n) => {
      if (
        n.type === 'LISTING_PENDING' &&
        (n.reportedListingId === listingId || n.id === `notif-backend-listing-${listingId}`)
      ) {
        hasChanges = true;
        return {
          ...n,
          status,
          isRead: true,
          adminNotes: reason || n.adminNotes,
          resolvedAt: new Date().toISOString(),
        };
      }
      return n;
    });
    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('admin_notifications_updated', { detail: updated }));
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
