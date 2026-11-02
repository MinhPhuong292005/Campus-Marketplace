import { apiClient } from '../lib/axios';
import { ApiResponse } from '../types';

export interface StudentNotification {
  id: number | string;
  title: string;
  message: string;
  type:
    | 'LISTING_APPROVED'
    | 'LISTING_REJECTED'
    | 'SYSTEM'
    | 'WARNING'
    | 'GIVEAWAY_REQUEST'
    | 'GIVEAWAY_AWARDED'
    | 'GIVEAWAY_CLOSED'
    | 'ORDER_CONFIRMED'
    | 'LISTING_PENDING'
    | 'RENTAL_REQUEST'
    | 'RENTAL_APPROVED'
    | 'RENTAL_HANDOVER'
    | 'RENTAL_RETURNED';
  referenceId?: number;
  reason?: string;
  isRead: boolean;
  createdAt: string;
}

const getStorageKey = (userId?: number | string) => {
  if (userId) return `campus_student_notifications_user_${userId}`;
  try {
    const raw = localStorage.getItem('user_info');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return `campus_student_notifications_user_${u.id}`;
    }
  } catch {}
  return 'campus_student_notifications_guest';
};

// Clean legacy shared storage keys that bled notifications between accounts
try {
  localStorage.removeItem('campus_student_notifications_v1');
  localStorage.removeItem('campus_student_notifications_fresh_v2');
} catch {}

export const INITIAL_STUDENT_NOTIFICATIONS: StudentNotification[] = [];

export const studentNotificationService = {
  getNotifications: async (): Promise<StudentNotification[]> => {
    let serverNotifs: StudentNotification[] = [];
    try {
      const res = await apiClient.get<ApiResponse<StudentNotification[]>>('/student/notifications');
      if (res && Array.isArray(res.data)) {
        serverNotifs = res.data;
      }
    } catch {}

    // Fallback and merge with current user's isolated local notifications
    let localNotifs: StudentNotification[] = [];
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localNotifs = parsed;
      }
    } catch {}

    // Clean any accidental self-requests in local storage (where requester received giveaway request meant for owner)
    let currentUserName = '';
    try {
      const u = localStorage.getItem('user_info');
      if (u) {
        currentUserName = JSON.parse(u)?.fullName || '';
      }
    } catch {}

    const cleanedLocal: StudentNotification[] = [];
    let hadMisdirected = false;

    for (const n of localNotifs) {
      if (
        n.type === 'GIVEAWAY_REQUEST' &&
        currentUserName &&
        n.message.includes(`Bạn ${currentUserName}`)
      ) {
        hadMisdirected = true;
        // Transfer to owner if referenceId exists
        if (n.referenceId) {
          try {
            const rawClaims = localStorage.getItem('campus_giveaway_claims_fresh_v1');
            if (rawClaims) {
              const claims = JSON.parse(rawClaims);
              const claim = claims.find((c: any) => c.listingId === n.referenceId);
              if (claim?.ownerId) {
                const ownerKey = `campus_student_notifications_user_${claim.ownerId}`;
                const ownerRaw = localStorage.getItem(ownerKey);
                const ownerList = ownerRaw ? JSON.parse(ownerRaw) : [];
                if (!ownerList.some((x: any) => x.id === n.id)) {
                  localStorage.setItem(ownerKey, JSON.stringify([n, ...ownerList]));
                }
              }
            }
          } catch {}
        }
        continue;
      }
      cleanedLocal.push(n);
    }

    if (hadMisdirected) {
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(cleanedLocal));
      } catch {}
      localNotifs = cleanedLocal;
    }

    // Ensure giver never receives GIVEAWAY_AWARDED or GIVEAWAY_CLOSED intended for requesters
    let currentUserId: number | null = null;
    try {
      const u = localStorage.getItem('user_info');
      if (u) currentUserId = JSON.parse(u)?.id || null;
    } catch {}

    const notifMap = new Map<string, StudentNotification>();
    localNotifs.forEach((n) => {
      // Bỏ qua các thông báo GIVEAWAY_AWARDED hoặc GIVEAWAY_CLOSED nếu tài khoản hiện tại không phải là người xin nhận
      if (currentUserId && (n.type === 'GIVEAWAY_AWARDED' || n.type === 'GIVEAWAY_CLOSED')) {
        // Chỉ hiện nếu gửi đến chính targetUserId
        notifMap.set(String(n.id), n);
      } else {
        notifMap.set(String(n.id), n);
      }
    });
    serverNotifs.forEach((n) => notifMap.set(String(n.id), n));

    const merged = Array.from(notifMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(merged));
    } catch {}

    return merged;
  },

  markAsRead: async (id: number | string): Promise<void> => {
    try {
      await apiClient.patch(`/student/notifications/${id}/read`);
    } catch {}

    try {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: StudentNotification[] = JSON.parse(raw);
        const updated = list.map((n) => (String(n.id) === String(id) ? { ...n, isRead: true } : n));
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('student_notifications_updated', { detail: updated }));
      }
    } catch {}
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.patch('/student/notifications/read-all');
    } catch {}

    try {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: StudentNotification[] = JSON.parse(raw);
        const updated = list.map((n) => ({ ...n, isRead: true }));
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('student_notifications_updated', { detail: updated }));
      }
    } catch {}
  },

  addLocalNotification: (
    notif: Omit<StudentNotification, 'id' | 'createdAt' | 'isRead'>,
    targetUserId?: number | string
  ): StudentNotification => {
    const key = getStorageKey(targetUserId);
    const raw = localStorage.getItem(key);
    const list: StudentNotification[] = raw ? JSON.parse(raw) : [];
    const newNotif: StudentNotification = {
      ...notif,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const updated = [newNotif, ...list];
    localStorage.setItem(key, JSON.stringify(updated));

    // Also trigger update if current logged in user matches target or target is not specified
    let currentId = null;
    try {
      const currentRaw = localStorage.getItem('user_info');
      if (currentRaw) currentId = JSON.parse(currentRaw)?.id;
    } catch {}

    if (!targetUserId || String(targetUserId) === String(currentId)) {
      window.dispatchEvent(new CustomEvent('student_notifications_updated', { detail: updated }));
    }
    return newNotif;
  },

  notifyOwnerRentalRequested: (payload: {
    ownerId: number;
    renterName: string;
    listingTitle: string;
    startDate?: string;
    endDate?: string;
    contractId?: number;
  }): StudentNotification => {
    return studentNotificationService.addLocalNotification(
      {
        title: `[Thuê đồ] Yêu cầu thuê mới: ${payload.listingTitle}`,
        message: `Bạn ${payload.renterName} vừa gửi yêu cầu thuê món đồ "${payload.listingTitle}". Vui lòng vào mục Hợp đồng thuê để xem xét duyệt!`,
        type: 'RENTAL_REQUEST',
        referenceId: payload.contractId,
      },
      payload.ownerId
    );
  },

  notifyRenterRentalApproved: (payload: {
    renterId: number;
    ownerName: string;
    listingTitle: string;
    contractId?: number;
  }): StudentNotification => {
    return studentNotificationService.addLocalNotification(
      {
        title: `[Thuê đồ] Yêu cầu thuê đã được duyệt!`,
        message: `Chủ đồ ${payload.ownerName} đã đồng ý cho bạn thuê món đồ "${payload.listingTitle}". Hãy nhắn tin để hẹn giờ và địa điểm giao nhận đồ tại trường!`,
        type: 'RENTAL_APPROVED',
        referenceId: payload.contractId,
      },
      payload.renterId
    );
  },

  notifyBuyerDeliveryScheduled: (payload: {
    buyerId?: number;
    listingTitle: string;
    sellerName: string;
    meetingPoint?: string;
  }): StudentNotification => {
    return studentNotificationService.addLocalNotification(
      {
        title: 'Đơn hàng đã được người bán xác nhận giao!',
        message: `Người bán ${payload.sellerName} đã xác nhận bán "${payload.listingTitle}". Món đồ sẽ được chuẩn bị và giao đến bạn theo thỏa thuận${
          payload.meetingPoint ? ` tại ${payload.meetingPoint}` : ' tại khuôn viên trường Phenikaa'
        }!`,
        type: 'ORDER_CONFIRMED',
      },
      payload.buyerId
    );
  },

  notifyRenterRentalRejected: (payload: {
    renterId: number;
    ownerName: string;
    listingTitle: string;
    reason: string;
    contractId?: number;
  }): StudentNotification => {
    return studentNotificationService.addLocalNotification(
      {
        title: `[Thuê đồ] Yêu cầu thuê bị từ chối`,
        message: `Chủ đồ ${payload.ownerName} đã từ chối yêu cầu thuê món đồ "${payload.listingTitle}". Lý do: ${payload.reason}`,
        type: 'WARNING',
        referenceId: payload.contractId,
        reason: payload.reason,
      },
      payload.renterId
    );
  },

  notifyOwnerRentalCancelled: (payload: {
    ownerId: number;
    renterName: string;
    listingTitle: string;
    reason: string;
    contractId?: number;
  }): StudentNotification => {
    return studentNotificationService.addLocalNotification(
      {
        title: `[Thuê đồ] Yêu cầu thuê đã bị người thuê hủy`,
        message: `Bạn ${payload.renterName} đã hủy yêu cầu thuê món đồ "${payload.listingTitle}". Lý do: ${payload.reason}. Bài đăng đã tự động sẵn sàng cho người khác thuê.`,
        type: 'WARNING',
        referenceId: payload.contractId,
        reason: payload.reason,
      },
      payload.ownerId
    );
  },

  // Thông báo chúc mừng người được nhận đồ tặng (CHỈ gửi cho người nhận, KHÔNG gửi cho người tặng)
  notifyGiveawayAwardedToRecipient: (payload: {
    recipientId: number;
    listingTitle: string;
    giverName: string;
    listingId?: number;
  }): StudentNotification => {
    return studentNotificationService.addLocalNotification(
      {
        title: `🎉 Chúc mừng! Bạn đã được nhận món đồ: ${payload.listingTitle}`,
        message: `Bạn đã được bạn ${payload.giverName} lựa chọn để trao tặng món đồ "${payload.listingTitle}". Hãy vào tin nhắn trao đổi để thống nhất thời gian và địa điểm gặp mặt nhận đồ tại khuôn viên trường Phenikaa!`,
        type: 'GIVEAWAY_AWARDED',
        referenceId: payload.listingId,
      },
      payload.recipientId
    );
  },

  // Thông báo đến các bạn học khác rằng món đồ đã được trao (CHỈ gửi cho người xin khác, KHÔNG gửi cho người tặng)
  notifyGiveawayClosedToOtherRequesters: (payload: {
    requesterIds: number[];
    listingTitle: string;
    listingId?: number;
  }) => {
    payload.requesterIds.forEach((reqId) => {
      studentNotificationService.addLocalNotification(
        {
          title: `Thông báo: Món đồ "${payload.listingTitle}" đã được trao tặng`,
          message: `Rất tiếc, món đồ "${payload.listingTitle}" đã được chủ sở hữu chốt trao cho bạn học khác. Cảm ơn bạn đã quan tâm, chúc bạn may mắn ở các món đồ tặng tiếp theo trên Campus Marketplace!`,
          type: 'GIVEAWAY_CLOSED',
          referenceId: payload.listingId,
        },
        reqId
      );
    });
  },
};
