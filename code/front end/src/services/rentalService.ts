import { getRequest, postRequest, putRequest } from './api';
import { RentalContract, ApiResponse, PaginatedResult } from '../types';
import { API_ROUTES } from '../constants';

export interface CreateRentalContractPayload {
  listingId: number;
  ownerId: number;
  startDate: string;
  endDate: string;
  totalRentAmount: number;
  depositAmount: number;
}

export const initialMockRentals: RentalContract[] = [
  {
    id: 1,
    listingId: 2,
    listingTitle: 'Cho thuê máy tính Casio fx-580VNX ôn thi cấp tốc 2 tuần',
    renterId: 1,
    renterName: 'Nguyễn Văn An',
    renterKarma: 85,
    ownerId: 102,
    ownerName: 'Lê Thuỳ Linh',
    ownerKarma: 40,
    startDate: '2026-10-01T08:00:00Z',
    endDate: '2026-10-15T18:00:00Z',
    totalRentAmount: 40000,
    depositAmount: 300000,
    proofImages: [
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',
    ],
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:15:00Z',
  },
  {
    id: 2,
    listingId: 12,
    listingTitle: 'Thuê bộ lễ phục tốt nghiệp cử nhân ĐH Phenikaa (Kèm mũ & dải băng)',
    renterId: 1,
    renterName: 'Hoàng Minh Đức',
    renterKarma: 85,
    ownerId: 105,
    ownerName: 'Trần Minh Đức',
    ownerKarma: 65,
    startDate: '2026-10-10T07:00:00Z',
    endDate: '2026-10-11T19:00:00Z',
    totalRentAmount: 120000,
    depositAmount: 500000,
    proofImages: [],
    status: 'PENDING',
    createdAt: '2026-10-08T10:00:00Z',
    updatedAt: '2026-10-08T10:00:00Z',
  },
];

let localRentals = [...initialMockRentals];

export const rentalService = {
  getMyRentals: async (status = 'ALL', page = 0, size = 10): Promise<ApiResponse<PaginatedResult<RentalContract>>> => {
    try {
      const res = await getRequest<PaginatedResult<RentalContract>>(API_ROUTES.RENTALS, { status, page, size });
      if (res.data?.items?.length) return res;
    } catch {
      // fallback
    }

    const filtered = status === 'ALL'
      ? localRentals
      : localRentals.filter((r) => r.status === status);

    return {
      success: true,
      data: {
        items: filtered,
        page,
        size,
        totalElements: filtered.length,
        totalPages: 1,
      },
    };
  },

  getRentalById: async (id: number): Promise<ApiResponse<RentalContract>> => {
    try {
      return await getRequest<RentalContract>(`${API_ROUTES.RENTALS}/${id}`);
    } catch {
      const found = localRentals.find((r) => r.id === id) || localRentals[0];
      return {
        success: true,
        data: found,
      };
    }
  },

  createRentalContract: async (payload: CreateRentalContractPayload): Promise<ApiResponse<RentalContract>> => {
    try {
      return await postRequest<RentalContract>(API_ROUTES.RENTALS, payload);
    } catch {
      const newContract: RentalContract = {
        id: Date.now(),
        listingId: payload.listingId,
        listingTitle: 'Thiết bị học tập & thực hành thuê',
        renterId: 1,
        renterName: 'Nguyễn Văn An',
        renterKarma: 85,
        ownerId: payload.ownerId,
        ownerName: 'Bạn Sinh Viên',
        ownerKarma: 50,
        startDate: payload.startDate,
        endDate: payload.endDate,
        totalRentAmount: payload.totalRentAmount,
        depositAmount: payload.depositAmount,
        proofImages: [],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localRentals = [newContract, ...localRentals];
      return {
        success: true,
        data: newContract,
        message: 'Tạo hợp đồng thuê thành công!',
      };
    }
  },

  uploadProofImages: async (contractId: number, images: string[]): Promise<ApiResponse<RentalContract>> => {
    try {
      return await putRequest<RentalContract>(`${API_ROUTES.RENTALS}/${contractId}/proof`, { proofImages: images });
    } catch {
      localRentals = localRentals.map((r) =>
        r.id === contractId ? { ...r, proofImages: images, status: 'ACTIVE' as const } : r
      );
      const updated = localRentals.find((r) => r.id === contractId)!;
      return {
        success: true,
        data: updated,
        message: 'Đã lưu ảnh hiện trạng bàn giao. Hợp đồng chuyển sang ACTIVE!',
      };
    }
  },

  confirmReturnAndRefund: async (contractId: number): Promise<ApiResponse<RentalContract>> => {
    try {
      return await putRequest<RentalContract>(`${API_ROUTES.RENTALS}/${contractId}/return`);
    } catch {
      localRentals = localRentals.map((r) =>
        r.id === contractId ? { ...r, status: 'RETURNED' as const } : r
      );
      const updated = localRentals.find((r) => r.id === contractId)!;
      return {
        success: true,
        data: updated,
        message: 'Xác nhận trả đồ & hoàn cọc thành công! Cả 2 bên nhận +5 Karma.',
      };
    }
  },

  reportDispute: async (contractId: number, reason: string): Promise<ApiResponse<RentalContract>> => {
    try {
      return await putRequest<RentalContract>(`${API_ROUTES.RENTALS}/${contractId}/dispute`, { disputeReason: reason });
    } catch {
      localRentals = localRentals.map((r) =>
        r.id === contractId ? { ...r, status: 'DISPUTED' as const, disputeReason: reason } : r
      );
      const updated = localRentals.find((r) => r.id === contractId)!;
      return {
        success: true,
        data: updated,
        message: 'Đã gửi báo cáo tranh chấp cọc đến ban quản trị.',
      };
    }
  },
};
