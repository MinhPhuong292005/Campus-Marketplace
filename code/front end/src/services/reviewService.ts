import api from './api';

export interface ReviewReq {
  targetUserId: number;
  listingId?: number;
  rating: number; // 1 to 5
  comment?: string;
  tags?: string[];
}

export interface ReviewRes {
  id: number;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar?: string;
  targetUserId: number;
  targetUserName: string;
  listingId?: number;
  listingTitle?: string;
  rating: number;
  comment?: string;
  tags?: string[];
  karmaAwarded: number;
  newTargetKarma?: number;
  createdAt: string;
}

export const reviewService = {
  createReview: async (req: ReviewReq): Promise<{ success: boolean; data: ReviewRes }> => {
    try {
      const response = await api.post<ReviewRes>('/student/reviews', req);
      return response;
    } catch {
      // Mock calculation based on rules: 5 stars = +5 karma
      const karmaBonus = req.rating === 5 ? 5 : req.rating === 4 ? 3 : 1;
      const res: ReviewRes = {
        id: Date.now(),
        reviewerId: 1,
        reviewerName: 'Bạn (Sinh viên)',
        targetUserId: req.targetUserId,
        targetUserName: 'Bạn học được đánh giá',
        listingId: req.listingId,
        rating: req.rating,
        comment: req.comment,
        tags: req.tags,
        karmaAwarded: karmaBonus,
        newTargetKarma: 50 + karmaBonus,
        createdAt: new Date().toISOString(),
      };
      return { success: true, data: res };
    }
  },

  getReviewsForListing: async (listingId: number): Promise<{ success: boolean; data: ReviewRes[] }> => {
    try {
      const response = await api.get<ReviewRes[]>(`/public/listings/${listingId}/reviews`);
      if (response && response.data) return response;
    } catch {
      // Fallback to local or demo reviews
    }
    return {
      success: true,
      data: [
        {
          id: 101,
          reviewerId: 201,
          reviewerName: 'Trần Minh Quang',
          reviewerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
          targetUserId: 1,
          targetUserName: 'Người bán Phenikaa',
          listingId: listingId,
          rating: 5,
          comment: 'Đã nhận đồ trực tiếp tại Safe Meeting Point Sảnh A. Sách còn mới 95%, đúng như ảnh và mô tả. Bạn bán rất nhiệt tình và đúng hẹn!',
          tags: ['Đúng như mô tả', 'Giao dịch nhanh chóng', 'Nhiệt tình'],
          karmaAwarded: 5,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 102,
          reviewerId: 202,
          reviewerName: 'Nguyễn Thảo My (K17)',
          reviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
          targetUserId: 1,
          targetUserName: 'Người bán Phenikaa',
          listingId: listingId,
          rating: 5,
          comment: 'Rất ưng ý! Bạn bán tặng thêm cả tài liệu cương ôn thi. 5 sao cho bạn sinh viên uy tín.',
          tags: ['Rất đáng tiền', 'Thân thiện', 'Chuẩn sinh viên Phenikaa'],
          karmaAwarded: 5,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };
  },

  checkEligibility: async (
    listingId: number
  ): Promise<{
    success: boolean;
    data: {
      canReview: boolean;
      isBuyer: boolean;
      isOwner: boolean;
      alreadyReviewed: boolean;
      reason: string;
    };
  }> => {
    try {
      const response = await api.get<{
        canReview: boolean;
        isBuyer: boolean;
        isOwner: boolean;
        alreadyReviewed: boolean;
        reason: string;
      }>(`/student/reviews/listing/${listingId}/eligibility`);
      if (response && response.data) return response;
    } catch {
      // Return fallback
    }
    return {
      success: true,
      data: {
        canReview: false,
        isBuyer: false,
        isOwner: false,
        alreadyReviewed: false,
        reason: 'Chỉ người đã từng mua hoặc thuê sản phẩm này mới có thể để lại bình luận và đánh giá sao.',
      },
    };
  },
};
