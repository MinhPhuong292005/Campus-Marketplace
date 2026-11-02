import { getRequest, postRequest, putRequest } from './api';
import { RentalContract, ApiResponse, PaginatedResult } from '../types';
import { API_ROUTES } from '../constants';
import { studentNotificationService } from './studentNotificationService';
import { listingService } from './listingService';
import { spamProtectionService } from './spamProtectionService';

export interface CreateRentalContractPayload {
  listingId: number;
  listingTitle?: string;
  rentalTerms?: string;
  ownerId: number;
  ownerName?: string;
  renterId?: number;
  renterName?: string;
  startDate: string;
  endDate: string;
  totalRentAmount: number;
  depositAmount: number;
}

export const initialMockRentals: RentalContract[] = [];

const RENTAL_STORAGE_KEY = 'campus_rentals_fresh_v2';

const getStoredRentals = (): RentalContract[] => {
  try {
    const raw = localStorage.getItem(RENTAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredRentals = (items: RentalContract[]) => {
  try {
    localStorage.setItem(RENTAL_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('campus_rentals_updated', { detail: items }));
  } catch {}
};

export const rentalService = {
  getMyRentals: async (status = 'ALL', page = 0, size = 10): Promise<ApiResponse<PaginatedResult<RentalContract>>> => {
    let serverItems: RentalContract[] = [];
    try {
      const res = await getRequest<PaginatedResult<RentalContract>>(API_ROUTES.RENTALS, { status, page, size });
      if (res.data?.items) {
        serverItems = res.data.items;
      } else if ((res.data as any)?.content) {
        serverItems = (res.data as any).content;
      }
    } catch {
      // fallback
    }

    // Merge server items and local storage
    const local = getStoredRentals();
    const contractMap = new Map<number, RentalContract>();
    local.forEach((c) => contractMap.set(c.id, c));
    serverItems.forEach((c) => contractMap.set(c.id, c));
    const merged = Array.from(contractMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Keep cache fresh
    try {
      localStorage.setItem(RENTAL_STORAGE_KEY, JSON.stringify(merged));
    } catch {}

    // Get current user id
    let currentUserId: number | null = null;
    try {
      const u = localStorage.getItem('user_info');
      if (u) currentUserId = JSON.parse(u)?.id;
    } catch {}

    // Filter by user if logged in (or all if not logged in or in test mode)
    const userFiltered = currentUserId
      ? merged.filter((r) => r.ownerId === currentUserId || r.renterId === currentUserId)
      : merged;

    const filtered = status === 'ALL'
      ? userFiltered
      : userFiltered.filter((r) => r.status === status);

    return {
      success: true,
      data: {
        items: filtered,
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      },
    };
  },

  getRentalById: async (id: number): Promise<ApiResponse<RentalContract>> => {
    try {
      const res = await getRequest<RentalContract>(`${API_ROUTES.RENTALS}/${id}`);
      if (res?.data) return res;
    } catch {}

    const all = getStoredRentals();
    const found = all.find((r) => r.id === id);
    if (found) {
      return { success: true, data: found };
    }
    throw new Error('Không tìm thấy hợp đồng thuê');
  },

  createRentalContract: async (payload: CreateRentalContractPayload): Promise<ApiResponse<RentalContract>> => {
    // Check spam lockout
    const spamCheck = spamProtectionService.checkRenterSpamStatus(payload.renterId);
    if (spamCheck.isLocked) {
      throw new Error(
        `Tài khoản của bạn đang bị tạm khóa tính năng thuê trong 1 giờ do liên tục spam thao tác. Vui lòng quay lại sau ${spamCheck.minutesLeft} phút.`
      );
    }

    const formattedPayload = {
      ...payload,
      startDate: payload.startDate.includes('T') ? payload.startDate : `${payload.startDate}T00:00:00`,
      endDate: payload.endDate.includes('T') ? payload.endDate : `${payload.endDate}T23:59:59`,
    };

    let createdContract: RentalContract;
    try {
      const res = await postRequest<RentalContract>(API_ROUTES.RENTALS, formattedPayload);
      if (res?.data) {
        createdContract = res.data;
      } else {
        throw new Error('No data returned');
      }
    } catch {
      createdContract = {
        id: Date.now(),
        listingId: payload.listingId,
        listingTitle: payload.listingTitle || 'Thiết bị học tập & thực hành thuê',
        rentalTerms: payload.rentalTerms,
        renterId: payload.renterId || 1,
        renterName: payload.renterName || 'Bạn Sinh Viên',
        renterKarma: 50,
        ownerId: payload.ownerId,
        ownerName: payload.ownerName || 'Chủ thiết bị',
        ownerKarma: 50,
        startDate: formattedPayload.startDate,
        endDate: formattedPayload.endDate,
        totalRentAmount: payload.totalRentAmount,
        depositAmount: payload.depositAmount,
        proofImages: [],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Always ensure it is saved locally too
    const all = [createdContract, ...getStoredRentals().filter((r) => r.id !== createdContract.id)];
    saveStoredRentals(all);

    // Track renter spam action
    if (payload.renterId) {
      spamProtectionService.recordRenterAction(payload.renterId, 'REQUEST', payload.listingTitle);
    }

    // Notify the owner so they get the bell notification
    studentNotificationService.notifyOwnerRentalRequested({
      ownerId: payload.ownerId,
      renterName: payload.renterName || 'Bạn Sinh Viên',
      listingTitle: payload.listingTitle || 'Thiết bị',
      startDate: payload.startDate,
      endDate: payload.endDate,
      contractId: createdContract.id,
    });

    return {
      success: true,
      data: createdContract,
      message: 'Gửi yêu cầu thuê thành công! Đang chờ người cho thuê duyệt.',
    };
  },

  approveContract: async (contractId: number): Promise<ApiResponse<RentalContract>> => {
    let updated: RentalContract | null = null;
    try {
      const res = await putRequest<RentalContract>(`${API_ROUTES.RENTALS}/${contractId}/approve`);
      if (res?.data) updated = res.data;
    } catch {}

    const all = getStoredRentals().map((r) =>
      r.id === contractId ? { ...r, status: 'APPROVED' as const } : r
    );
    saveStoredRentals(all);
    if (!updated) {
      updated = all.find((r) => r.id === contractId)!;
    }

    if (updated) {
      // Notify the renter
      studentNotificationService.notifyRenterRentalApproved({
        renterId: updated.renterId,
        ownerName: updated.ownerName || 'Chủ thiết bị',
        listingTitle: updated.listingTitle || 'Thiết bị học tập',
        contractId: updated.id,
      });
    }

    return {
      success: true,
      data: updated,
      message: 'Đã xác nhận cho thuê! Vui lòng trao đổi với người thuê về thời gian và địa điểm hẹn gặp.',
    };
  },

  updateMeetingDetails: async (
    contractId: number,
    details: { meetingPoint?: string; meetingTime?: string }
  ): Promise<ApiResponse<RentalContract>> => {
    let updated: RentalContract | null = null;
    const all = getStoredRentals().map((r) => {
      if (r.id === contractId) {
        const item = {
          ...r,
          meetingPoint: details.meetingPoint !== undefined ? details.meetingPoint : r.meetingPoint,
          meetingTime: details.meetingTime !== undefined ? details.meetingTime : r.meetingTime,
          updatedAt: new Date().toISOString(),
        };
        updated = item;
        return item;
      }
      return r;
    });
    saveStoredRentals(all);
    return {
      success: true,
      data: updated!,
      message: 'Đã cập nhật lịch hẹn và điểm gặp mặt an toàn!',
    };
  },

  confirmHandover: async (contractId: number, role?: 'owner' | 'renter'): Promise<ApiResponse<RentalContract>> => {
    let updated: RentalContract | null = null;
    try {
      const res = await putRequest<RentalContract>(`${API_ROUTES.RENTALS}/${contractId}/handover`, { role });
      if (res?.data) updated = res.data;
    } catch {}

    const all = getStoredRentals().map((r) => {
      if (r.id === contractId) {
        const ownerConf = role === 'owner' ? true : Boolean(r.ownerHandoverConfirmed);
        const renterConf = role === 'renter' ? true : Boolean(r.renterHandoverConfirmed);
        
        // Cần CẢ HAI BÊN xác nhận mới kích hoạt ACTIVE (Bước 3)
        const isBothConfirmed = ownerConf && renterConf;

        const item: RentalContract = {
          ...r,
          ownerHandoverConfirmed: ownerConf,
          renterHandoverConfirmed: renterConf,
          status: isBothConfirmed ? ('ACTIVE' as const) : r.status,
          updatedAt: new Date().toISOString(),
        };
        updated = item;
        return item;
      }
      return r;
    });
    saveStoredRentals(all);
    if (!updated) {
      updated = all.find((r) => r.id === contractId)!;
    }

    return {
      success: true,
      data: updated,
      message: updated?.status === 'ACTIVE'
        ? 'Cả hai bên đã xác nhận bàn giao thiết bị thành công! Hợp đồng chuyển sang Bước 3: "Đang trong thời hạn thuê".'
        : 'Đã ghi nhận xác nhận của bạn! Vui lòng chờ đối phương xác nhận để chính thức kích hoạt thời gian thuê.',
    };
  },

  uploadProofImages: async (contractId: number, images: string[]): Promise<ApiResponse<RentalContract>> => {
    let updated: RentalContract | null = null;
    try {
      const res = await putRequest<RentalContract>(`${API_ROUTES.RENTALS}/${contractId}/proof`, { proofImages: images });
      if (res?.data) updated = res.data;
    } catch {}

    // Lưu ảnh hiện trạng mà không tự ý đổi status sang ACTIVE trước khi hai bên bấm xác nhận
    const all = getStoredRentals().map((r) =>
      r.id === contractId ? { ...r, proofImages: images, updatedAt: new Date().toISOString() } : r
    );
    saveStoredRentals(all);
    if (!updated) {
      updated = all.find((r) => r.id === contractId)!;
    }

    return {
      success: true,
      data: updated,
      message: `Đã lưu biên bản ${images.length} ảnh đối chiếu hiện trạng thiết bị thành công!`,
    };
  },

  confirmReturnAndRefund: async (contractId: number, role?: 'owner' | 'renter'): Promise<ApiResponse<RentalContract>> => {
    let updated: RentalContract | null = null;
    try {
      const res = await putRequest<RentalContract>(`${API_ROUTES.RENTALS}/${contractId}/return`, { role });
      if (res?.data) updated = res.data;
    } catch {}

    const all = getStoredRentals().map((r) => {
      if (r.id === contractId) {
        const ownerRet = role === 'owner' ? true : Boolean(r.ownerReturnConfirmed);
        const renterRet = role === 'renter' ? true : Boolean(r.renterReturnConfirmed);

        // Cần CẢ HAI BÊN xác nhận mới kích hoạt RETURNED (Bước 4)
        const isBothReturned = ownerRet && renterRet;

        const item: RentalContract = {
          ...r,
          ownerReturnConfirmed: ownerRet,
          renterReturnConfirmed: renterRet,
          status: isBothReturned ? ('RETURNED' as const) : r.status,
          updatedAt: new Date().toISOString(),
        };
        updated = item;
        return item;
      }
      return r;
    });
    saveStoredRentals(all);
    if (!updated) {
      updated = all.find((r) => r.id === contractId)!;
    }

    // Sau khi cả 2 bên xác nhận trả đồ & hoàn cọc thành công, món đồ sẵn sàng (ACTIVE) để cho người khác thuê tiếp
    if (updated?.listingId && updated.status === 'RETURNED') {
      listingService.updateListingStatus(updated.listingId, 'ACTIVE').catch(() => {});
    }

    return {
      success: true,
      data: updated,
      message: updated?.status === 'RETURNED'
        ? 'Cả 2 bên đã xác nhận hoàn tất trả đồ & giải tỏa 100% tiền cọc! Hợp đồng hoàn tất (+5 Campus Karma).'
        : 'Đã ghi nhận xác nhận hoàn trả đồ của bạn. Đang chờ đối phương xác nhận để hoàn tất hợp đồng.',
    };
  },

  reportDispute: async (contractId: number, reason: string): Promise<ApiResponse<RentalContract>> => {
    let updated: RentalContract | null = null;
    try {
      const res = await putRequest<RentalContract>(`${API_ROUTES.RENTALS}/${contractId}/dispute`, { disputeReason: reason });
      if (res?.data) updated = res.data;
    } catch {}

    const all = getStoredRentals().map((r) => {
      if (r.id === contractId) {
        const item = { ...r, status: 'DISPUTED' as const, disputeReason: reason };
        updated = item;
        return item;
      }
      return r;
    });
    saveStoredRentals(all);
    if (!updated) {
      updated = all.find((r) => r.id === contractId)!;
    }

    // Tự động khôi phục bài đăng về ACTIVE khi có sự cố/tranh chấp để đồ không bị kẹt
    if (updated?.listingId) {
      listingService.updateListingStatus(updated.listingId, 'ACTIVE').catch(() => {});
    }

    return {
      success: true,
      data: updated,
      message: 'Đã gửi báo cáo tranh chấp cọc đến ban quản trị.',
    };
  },

  rejectRental: async (contractId: number, reason: string): Promise<ApiResponse<RentalContract>> => {
    let updated: RentalContract | null = null;
    try {
      const res = await postRequest<RentalContract>(
        `${API_ROUTES.RENTALS}/${contractId}/reject?reason=${encodeURIComponent(reason)}`
      );
      if (res?.data) updated = res.data;
    } catch {}

    const all = getStoredRentals().map((r) => {
      if (r.id === contractId) {
        const item: RentalContract = {
          ...r,
          status: 'REJECTED' as any,
          disputeReason: reason,
          updatedAt: new Date().toISOString(),
        };
        updated = item;
        return item;
      }
      return r;
    });
    saveStoredRentals(all);
    if (!updated) {
      updated = all.find((r) => r.id === contractId)!;
    }

    if (updated?.listingId) {
      listingService.updateListingStatus(updated.listingId, 'ACTIVE').catch(() => {});
    }

    if (updated) {
      studentNotificationService.notifyRenterRentalRejected({
        renterId: updated.renterId,
        ownerName: updated.ownerName || 'Chủ thiết bị',
        listingTitle: updated.listingTitle || 'Thiết bị học tập',
        reason: reason,
        contractId: updated.id,
      });
    }

    return {
      success: true,
      data: updated!,
      message: 'Đã từ chối yêu cầu thuê. Bài đăng đã được tự động mở lại cho sinh viên khác thuê.',
    };
  },

  cancelRental: async (
    contractId: number,
    reason: string,
    cancelledBy: 'renter' | 'owner' = 'renter'
  ): Promise<ApiResponse<RentalContract>> => {
    let updated: RentalContract | null = null;
    try {
      const res = await postRequest<RentalContract>(
        `${API_ROUTES.RENTALS}/${contractId}/cancel?reason=${encodeURIComponent(reason)}`
      );
      if (res?.data) updated = res.data;
    } catch {}

    const all = getStoredRentals().map((r) => {
      if (r.id === contractId) {
        const isOwner = cancelledBy === 'owner';
        const item: RentalContract = {
          ...r,
          status: (isOwner ? 'REJECTED' : 'CANCELLED') as any,
          disputeReason: reason,
          updatedAt: new Date().toISOString(),
        };
        updated = item;
        return item;
      }
      return r;
    });
    saveStoredRentals(all);
    if (!updated) {
      updated = all.find((r) => r.id === contractId)!;
    }

    if (updated?.listingId) {
      listingService.updateListingStatus(updated.listingId, 'ACTIVE').catch(() => {});
    }

    if (updated) {
      if (cancelledBy === 'renter') {
        spamProtectionService.recordRenterAction(updated.renterId, 'CANCEL', reason);

        studentNotificationService.notifyOwnerRentalCancelled({
          ownerId: updated.ownerId,
          renterName: updated.renterName || 'Bạn Sinh Viên',
          listingTitle: updated.listingTitle || 'Thiết bị học tập',
          reason: reason,
          contractId: updated.id,
        });
      } else {
        studentNotificationService.notifyRenterRentalRejected({
          renterId: updated.renterId,
          ownerName: updated.ownerName || 'Chủ thiết bị',
          listingTitle: updated.listingTitle || 'Thiết bị học tập',
          reason: reason,
          contractId: updated.id,
        });
      }
    }

    return {
      success: true,
      data: updated!,
      message:
        cancelledBy === 'owner'
          ? 'Đã từ chối yêu cầu thuê và mở lại bài đăng cho sinh viên khác.'
          : 'Đã hủy yêu cầu thuê đồ và tự động khôi phục lại bài đăng hoạt động.',
    };
  },
};
