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

  getReviewsForUser: async (userId: number): Promise<{ success: boolean; data: ReviewRes[] }> => {
    try {
      const response = await api.get<ReviewRes[]>(`/student/reviews/user/${userId}`);
      return response;
    } catch {
      return {
        success: true,
        data: [
          {
            id: 1,
            reviewerId: 102,
            reviewerName: 'Lê Thuỳ Linh',
            targetUserId: userId,
            targetUserName: 'Nguyễn Văn An',
            rating: 5,
            comment: 'Bạn An trả máy tính đúng hẹn, máy sạch sẽ nguyên vẹn như lúc nhận! Rất uy tín.',
            tags: ['Đúng giờ', 'Giữ gìn đồ cẩn thận', 'Nhiệt tình'],
            karmaAwarded: 5,
            createdAt: '2026-09-22T10:00:00Z',
          },
        ],
      };
    }
  },
};
