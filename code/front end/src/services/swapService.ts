import api from './api';

export interface SwapProposal {
  id: number;
  initiatorListingId: number;
  initiatorListingTitle: string;
  initiatorListingPrice: number;
  initiatorListingImageUrl?: string;
  initiatorUserId: number;
  initiatorUserName: string;
  initiatorKarma?: number;

  targetListingId: number;
  targetListingTitle: string;
  targetListingPrice: number;
  targetListingImageUrl?: string;
  targetUserId: number;
  targetUserName: string;
  targetKarma?: number;

  cashAdjustment: number;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

export interface SwapProposalCreateReq {
  initiatorListingId: number;
  targetListingId: number;
  cashAdjustment?: number;
  note?: string;
}

const mockProposals: SwapProposal[] = [
  {
    id: 1,
    initiatorListingId: 101,
    initiatorListingTitle: 'Bàn phím cơ Akko 3084 Silent Switch',
    initiatorListingPrice: 650000,
    initiatorListingImageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    initiatorUserId: 1,
    initiatorUserName: 'Nguyễn Văn An',
    initiatorKarma: 45,

    targetListingId: 4,
    targetListingTitle: 'Đổi màn hình phụ di động 15.6 inch lấy bàn phím cơ',
    targetListingPrice: 900000,
    targetListingImageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
    targetUserId: 104,
    targetUserName: 'Phạm Đức Anh',
    targetKarma: 35,

    cashAdjustment: 250000,
    note: 'Mình bù thêm 250k nhé bạn! Phím còn mới 98% fullbox.',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
];

export const swapService = {
  createProposal: async (req: SwapProposalCreateReq): Promise<{ success: boolean; data: SwapProposal }> => {
    try {
      const response = await api.post<SwapProposal>('/student/swap-proposals', req);
      return response;
    } catch {
      // Mock fallback
      const newProp: SwapProposal = {
        id: Date.now(),
        initiatorListingId: req.initiatorListingId,
        initiatorListingTitle: 'Món đồ của bạn',
        initiatorListingPrice: 500000,
        initiatorUserId: 1,
        initiatorUserName: 'Bạn (Sinh viên)',
        initiatorKarma: 50,
        targetListingId: req.targetListingId,
        targetListingTitle: 'Món đồ mục tiêu',
        targetListingPrice: 600000,
        targetUserId: 104,
        targetUserName: 'Người đăng đồ',
        targetKarma: 40,
        cashAdjustment: req.cashAdjustment || 0,
        note: req.note,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      mockProposals.unshift(newProp);
      return { success: true, data: newProp };
    }
  },

  getMyProposals: async (type: 'all' | 'sent' | 'received' = 'all'): Promise<{ success: boolean; data: SwapProposal[] }> => {
    try {
      const response = await api.get<SwapProposal[]>(`/student/swap-proposals/my?type=${type}`);
      return response;
    } catch {
      return { success: true, data: mockProposals };
    }
  },

  updateProposalStatus: async (
    proposalId: number,
    status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  ): Promise<{ success: boolean; data: SwapProposal }> => {
    try {
      const response = await api.patch<SwapProposal>(`/student/swap-proposals/${proposalId}/status`, { status });
      return response;
    } catch {
      const found = mockProposals.find((p) => p.id === proposalId);
      if (found) {
        found.status = status;
        return { success: true, data: found };
      }
      throw new Error('Proposal not found');
    }
  },
};
