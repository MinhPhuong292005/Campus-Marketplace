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

const LOCAL_REVIEWS_KEY = 'campus_reviews_local_v1';

const getLocalReviews = (): ReviewRes[] => {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalReview = (rev: ReviewRes) => {
  try {
    const current = getLocalReviews();
    const filtered = current.filter((r) => r.id !== rev.id);
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify([rev, ...filtered]));
  } catch {}
};

export const reviewService = {
  createReview: async (req: ReviewReq): Promise<{ success: boolean; data: ReviewRes }> => {
    let result: ReviewRes;
    try {
      const response = await api.post<ReviewRes>('/student/reviews', req);
      if (response && response.data) {
        result = response.data;
      } else {
        throw new Error('No data');
      }
    } catch {
      // Mock calculation based on rules: 5 stars = +5 karma
      const karmaBonus = req.rating === 5 ? 5 : req.rating === 4 ? 3 : 1;
      result = {
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
    }
    saveLocalReview(result);
    return { success: true, data: result };
  },

  getReviewsForListing: async (listingId: number): Promise<{ success: boolean; data: ReviewRes[] }> => {
    let list: ReviewRes[] = [];
    try {
      const response = await api.get<ReviewRes[]>(`/public/listings/${listingId}/reviews`);
      if (response && response.data && Array.isArray(response.data)) {
        list = response.data;
      }
    } catch {
      // Fallback
    }
    const local = getLocalReviews().filter((r) => r.listingId === listingId);
    // Combine unique by id
    const ids = new Set(list.map((r) => r.id));
    for (const r of local) {
      if (!ids.has(r.id)) {
        list.push(r);
        ids.add(r.id);
      }
    }
    return {
      success: true,
      data: list,
    };
  },

  getReviewsForUser: async (userId: number): Promise<{ success: boolean; data: ReviewRes[] }> => {
    let list: ReviewRes[] = [];
    try {
      const response = await api.get<ReviewRes[]>(`/public/users/${userId}/reviews`);
      if (response && response.data && Array.isArray(response.data)) {
        list = response.data;
      }
    } catch {
      // Fallback
    }
    const local = getLocalReviews().filter((r) => r.targetUserId === userId);
    // Combine unique by id
    const ids = new Set(list.map((r) => r.id));
    for (const r of local) {
      if (!ids.has(r.id)) {
        list.push(r);
        ids.add(r.id);
      }
    }
    return {
      success: true,
      data: list,
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
    const localAlreadyReviewed = getLocalReviews().some((r) => r.listingId === listingId);
    try {
      const response = await api.get<{
        canReview: boolean;
        isBuyer: boolean;
        isOwner: boolean;
        alreadyReviewed: boolean;
        reason: string;
      }>(`/student/reviews/listing/${listingId}/eligibility`);
      if (response && response.data) {
        if (localAlreadyReviewed) {
          return {
            success: true,
            data: {
              ...response.data,
              alreadyReviewed: true,
              canReview: false,
              reason: 'Bạn đã gửi đánh giá cho sản phẩm này rồi.',
            },
          };
        }
        return response;
      }
    } catch {
      // Return fallback
    }
    return {
      success: true,
      data: {
        canReview: false,
        isBuyer: false,
        isOwner: false,
        alreadyReviewed: localAlreadyReviewed,
        reason: localAlreadyReviewed
          ? 'Bạn đã gửi đánh giá cho sản phẩm này rồi.'
          : 'Chỉ người đã từng mua hoặc thuê sản phẩm này mới có thể để lại bình luận và đánh giá sao.',
      },
    };
  },
};
