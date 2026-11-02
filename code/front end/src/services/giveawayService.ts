import { studentNotificationService } from './studentNotificationService';
import { User } from '../types';

export interface GiveawayClaim {
  id: string;
  listingId: number;
  listingTitle: string;
  listingImage: string;
  ownerId: number;
  requesterId: number;
  requesterName: string;
  requesterAvatar?: string;
  requesterStudentCode?: string;
  requesterKarma?: number;
  requesterPhone?: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'campus_giveaway_claims_fresh_v1';
const CLOSED_GIVEAWAYS_KEY = 'campus_closed_giveaways_v1';

const getStoredClaims = (): GiveawayClaim[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredClaims = (claims: GiveawayClaim[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    window.dispatchEvent(new CustomEvent('campus_giveaway_claims_updated', { detail: claims }));
  } catch {}
};

const getClosedGiveaways = (): number[] => {
  try {
    const raw = localStorage.getItem(CLOSED_GIVEAWAYS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const markGiveawayClosed = (listingId: number) => {
  try {
    const closed = getClosedGiveaways();
    if (!closed.includes(listingId)) {
      const updated = [...closed, listingId];
      localStorage.setItem(CLOSED_GIVEAWAYS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('campus_giveaway_closed', { detail: { listingId } }));
    }
  } catch {}
};

export const giveawayService = {
  getClaimsByListing: (listingId: number): GiveawayClaim[] => {
    return getStoredClaims().filter((c) => c.listingId === listingId);
  },

  getClaimsByOwner: (ownerId: number): GiveawayClaim[] => {
    return getStoredClaims().filter((c) => c.ownerId === ownerId);
  },

  getClaimsByRequester: (requesterId: number): GiveawayClaim[] => {
    return getStoredClaims().filter((c) => c.requesterId === requesterId);
  },

  hasUserClaimed: (listingId: number, userId?: number): boolean => {
    if (!userId) return false;
    return getStoredClaims().some((c) => c.listingId === listingId && c.requesterId === userId);
  },

  isGiveawayClosed: (listingId: number): boolean => {
    if (getClosedGiveaways().includes(listingId)) return true;
    return getStoredClaims().some((c) => c.listingId === listingId && c.status === 'ACCEPTED');
  },

  submitClaim: async (payload: {
    listingId: number;
    listingTitle: string;
    listingImage: string;
    ownerId: number;
    requester: User;
    message: string;
    phone?: string;
  }): Promise<GiveawayClaim> => {
    if (giveawayService.isGiveawayClosed(payload.listingId)) {
      throw new Error('Món đồ này đã được trao tặng thành công và đã ngừng nhận thêm yêu cầu!');
    }

    const claims = getStoredClaims();
    const existing = claims.find(
      (c) => c.listingId === payload.listingId && c.requesterId === payload.requester.id
    );
    if (existing) {
      throw new Error('Bạn đã gửi yêu cầu xin nhận món đồ này trước đó rồi!');
    }

    const newClaim: GiveawayClaim = {
      id: `CLAIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      listingId: payload.listingId,
      listingTitle: payload.listingTitle,
      listingImage: payload.listingImage,
      ownerId: payload.ownerId,
      requesterId: payload.requester.id,
      requesterName: payload.requester.fullName,
      requesterAvatar: payload.requester.avatarUrl,
      requesterStudentCode: payload.requester.studentCode,
      requesterKarma: payload.requester.karmaScore || 20,
      requesterPhone: payload.phone || (payload.requester as any).phone || '',
      message: payload.message.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const updated = [newClaim, ...claims];
    saveStoredClaims(updated);

    // Gửi thông báo đến NGƯỜI ĐĂNG MÓN ĐỒ TẶNG (payload.ownerId)
    try {
      studentNotificationService.addLocalNotification(
        {
          title: `[Tặng đồ] Có bạn xin nhận: ${payload.listingTitle}`,
          message: `Bạn ${payload.requester.fullName} (MSSV: ${payload.requester.studentCode || 'N/A'}, Karma: ${
            payload.requester.karmaScore || 20
          }) vừa gửi đơn xin nhận món đồ với lý do: "${payload.message}". Hãy vào xem danh sách người đăng ký để chọn bạn phù hợp nhất!`,
          type: 'GIVEAWAY_REQUEST',
          referenceId: payload.listingId,
          reason: payload.message,
        },
        payload.ownerId // Gửi đúng tới tài khoản người tặng
      );
    } catch {}

    return newClaim;
  },

  acceptClaim: async (claimId: string, listingId: number): Promise<{ success: boolean; chosenRequesterName: string; chosenRequesterId: number }> => {
    const claims = getStoredClaims();
    const targetClaim = claims.find((c) => c.id === claimId);
    if (!targetClaim) {
      throw new Error('Không tìm thấy yêu cầu nhận đồ!');
    }

    const updated = claims.map((c) => {
      if (c.listingId === listingId) {
        if (c.id === claimId) {
          return { ...c, status: 'ACCEPTED' as const, updatedAt: new Date().toISOString() };
        } else {
          return { ...c, status: 'REJECTED' as const, updatedAt: new Date().toISOString() };
        }
      }
      return c;
    });

    saveStoredClaims(updated);
    markGiveawayClosed(listingId);

    // Cộng +10 điểm Karma cho người tặng đồ
    try {
      const rawUser = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        parsed.karmaScore = (parsed.karmaScore || 20) + 10;
        localStorage.setItem('auth_user', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('campus_user_updated', { detail: parsed }));
      }
    } catch {}

    // 1. Thông báo chúc mừng cho người được chọn (gửi tới targetClaim.requesterId)
    try {
      studentNotificationService.addLocalNotification(
        {
          title: `🎉 Chúc mừng! Bạn đã được chọn nhận: ${targetClaim.listingTitle}`,
          message: `Chủ đồ đã chốt trao tặng món đồ "${targetClaim.listingTitle}" cho bạn! Vui lòng vào mục Chat nhắn tin với chủ đồ để hẹn giờ và địa điểm nhận hàng tại khuôn viên trường Phenikaa nhé.`,
          type: 'GIVEAWAY_AWARDED',
          referenceId: listingId,
        },
        targetClaim.requesterId
      );
    } catch {}

    // 2. Thông báo tự động đến tất cả những người khác từng gửi yêu cầu xin món đồ này (gửi tới từng other.requesterId)
    const otherRequesters = claims.filter((c) => c.listingId === listingId && c.id !== claimId);
    for (const other of otherRequesters) {
      try {
        studentNotificationService.addLocalNotification(
          {
            title: `Thông báo: Món đồ "${targetClaim.listingTitle}" đã được tặng`,
            message: `Rất tiếc, món đồ "${targetClaim.listingTitle}" đã được chủ sở hữu chốt trao tặng cho bạn khác và bài đăng đã ngừng nhận thêm yêu cầu. Cảm ơn bạn đã quan tâm, hãy tiếp tục tìm kiếm các món đồ khác trên Chợ Sinh Viên nhé!`,
            type: 'GIVEAWAY_CLOSED',
            referenceId: listingId,
          },
          other.requesterId
        );
      } catch {}
    }

    return { 
      success: true, 
      chosenRequesterName: targetClaim.requesterName,
      chosenRequesterId: targetClaim.requesterId,
    };
  },
};
