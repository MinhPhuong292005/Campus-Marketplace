import { api } from './api';
import { User } from '../types';

export interface GiveawayClaim {
  id: number | string;
  listingId: number;
  listingTitle: string;
  listingImage?: string;
  ownerId: number;
  ownerName?: string;
  requesterId: number;
  requesterName: string;
  requesterAvatar?: string;
  requesterStudentCode?: string;
  requesterKarma?: number;
  requesterPhone?: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  meetingTime?: string;
  meetingPoint?: string;
  giverConfirmed?: boolean;
  receiverConfirmed?: boolean;
  createdAt: string;
  completedAt?: string;
}

export const giveawayService = {
  // Lấy danh sách người xin nhận đồ (DỮ LIỆU THẬT TỪ DATABASE)
  getClaimsByListing: async (listingId: number): Promise<GiveawayClaim[]> => {
    try {
      const res = await api.get<any>(`/student/giveaways/${listingId}/claims`);
      if (res && res.data) {
        return res.data;
      }
      return [];
    } catch {
      try {
        const raw = localStorage.getItem(`giveaway_claims_${listingId}`);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  },

  // Người dùng đăng ký xin nhận món đồ tặng (DỮ LIỆU THẬT)
  submitClaim: async (payload: {
    listingId: number;
    listingTitle?: string;
    listingImage?: string;
    ownerId?: number;
    requester?: User;
    message: string;
    phone?: string;
  }): Promise<GiveawayClaim> => {
    try {
      const res = await api.post<any>(`/student/giveaways/${payload.listingId}/claims`, {
        message: payload.message.trim(),
        phone: payload.phone?.trim(),
      });
      if (res && res.data) {
        return res.data;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Không thể gửi đơn xin nhận đồ';
      throw new Error(errorMsg);
    }

    // Local fallback
    const fallback: GiveawayClaim = {
      id: Date.now(),
      listingId: payload.listingId,
      listingTitle: payload.listingTitle || 'Món đồ tặng',
      listingImage: payload.listingImage,
      ownerId: payload.ownerId || 0,
      requesterId: payload.requester?.id || 0,
      requesterName: payload.requester?.fullName || 'Sinh viên Phenikaa',
      requesterAvatar: payload.requester?.avatarUrl,
      requesterStudentCode: payload.requester?.studentCode,
      requesterKarma: payload.requester?.karmaScore || 20,
      requesterPhone: payload.phone,
      message: payload.message.trim(),
      status: 'PENDING',
      giverConfirmed: false,
      receiverConfirmed: false,
      createdAt: new Date().toISOString(),
    };
    try {
      const list = await giveawayService.getClaimsByListing(payload.listingId);
      localStorage.setItem(`giveaway_claims_${payload.listingId}`, JSON.stringify([fallback, ...list]));
    } catch {}
    return fallback;
  },

  // Người tặng chốt tặng món đồ cho một bạn (chọn trực tiếp hoặc từ Vòng quay random)
  acceptClaim: async (
    listingId: number,
    claimId: number | string
  ): Promise<{ success: boolean; data?: GiveawayClaim }> => {
    try {
      const res = await api.post<any>(`/student/giveaways/${listingId}/claims/${claimId}/accept`);
      return { success: true, data: res?.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Không thể chốt tặng lúc này';
      throw new Error(errorMsg);
    }
  },

  // Hẹn giờ & điểm hẹn gặp bàn giao đồ tại Phenikaa
  updateAppointment: async (
    claimId: number | string,
    appointment: { meetingTime: string; meetingPoint: string }
  ): Promise<GiveawayClaim> => {
    try {
      const res = await api.patch<any>(`/student/giveaways/claims/${claimId}/appointment`, appointment);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Không thể cập nhật lịch hẹn');
    }
  },

  // Xác nhận đã bàn giao / nhận đồ (Hoàn tất giao dịch -> +5 Karma cho cả 2 bên)
  confirmHandover: async (claimId: number | string): Promise<{ success: boolean; data: GiveawayClaim }> => {
    try {
      const res = await api.post<any>(`/student/giveaways/claims/${claimId}/confirm`);
      return { success: true, data: res.data };
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Không thể xác nhận giao dịch');
    }
  },

  // Hủy giao dịch / Không đến nhận (-10 Karma cho bên vi phạm)
  cancelTransaction: async (claimId: number | string, reason: string): Promise<GiveawayClaim> => {
    try {
      const res = await api.post<any>(`/student/giveaways/claims/${claimId}/cancel?reason=${encodeURIComponent(reason)}`);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Không thể hủy giao dịch');
    }
  },

  // Danh sách đơn xin nhận đồ của sinh viên (để hiển thị trong trang cá nhân / đơn nhận)
  getClaimsByRequester: (requesterId: number): GiveawayClaim[] => {
    try {
      const raw = localStorage.getItem(`giveaway_my_claims_${requesterId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  fetchMyClaims: async (): Promise<GiveawayClaim[]> => {
    try {
      const res = await api.get<any>('/student/giveaways/my-claims');
      if (res && res.data) {
        return res.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};
