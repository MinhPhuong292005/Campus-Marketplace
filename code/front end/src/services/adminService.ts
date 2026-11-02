import { apiClient } from '../lib/axios';
import { ApiResponse, PaginatedResult } from '../types';

export interface AdminStats {
  pendingListingsCount: number;
  openReportsCount: number;
  todayNewUsersCount: number;
  completedTransactionsCount: number;
  totalUsers: number;
  totalListings: number;
  blockedStudentsCount?: number;
  listingsByCategory: Record<string, number>;
  usersByUniversity: Record<string, number>;
  emergencyAlerts: Array<{
    userId: number;
    fullName: string;
    email: string;
    reportCount: number;
    reasonSummary: string;
  }>;
}

export interface AdminListingItem {
  id: number;
  userId: number;
  authorName: string;
  authorKarma: number;
  universityName: string;
  campusName: string;
  categoryId: number;
  categoryName: string;
  title: string;
  description: string;
  price: number;
  transactionType: string;
  conditionStatus: string;
  status: string;
  isRiskFlagged?: boolean;
  riskReason?: string;
  moderationReason?: string;
  moderatedAt?: string;
  imageUrls: string[];
  createdAt: string;
}

export interface BannedStudentItem {
  id: number;
  studentCode: string;
  email?: string;
  fullName?: string;
  banReason?: string;
  bannedBy?: string;
  bannedAt?: string;
}

export interface AdminUserItem {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  studentCode?: string;
  universityName?: string;
  campusName?: string;
  dormitory?: string;
  studentCardVerified: boolean;
  studentCardStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  studentCardFrontUrl?: string;
  studentCardBackUrl?: string;
  studentCardImageUrl?: string;
  studentCardRejectReason?: string;
  studentCardSubmittedAt?: string;
  karmaScore: number;
  role: string;
  status: string;
  blockReason?: string;
  violatingItems?: Array<{
    id: number;
    type: 'LISTING' | 'REPORT' | string;
    title: string;
    description?: string;
    reason?: string;
    imageUrls: string[];
    createdAt?: string;
  }>;
  createdAt: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

export interface UniversityItem {
  id: number;
  name: string;
  shortName: string;
  emailDomains: string;
  campuses?: Array<{ id: number; name: string; location?: string }>;
}

export interface KeywordBlacklistItem {
  id: number;
  keyword: string;
  category: string;
  severity: string;
  action: string;
  reason?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: number;
  adminId: number;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: number;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

const LOCAL_STORAGE_USERS_KEY = 'campus_admin_users_fresh_v10';

try {
  ['campus_admin_users', 'campus_admin_users_v2', 'campus_admin_users_v3', 'campus_admin_users_v4', 'campus_admin_users_v5', 'campus_admin_users_phenikaa_v6', 'campus_admin_users_phenikaa_v7', 'campus_admin_users_phenikaa_v8', 'campus_admin_users_phenikaa_v9'].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch {}

export const INITIAL_ADMIN_USERS: AdminUserItem[] = [];

const getStoredUsers = (): AdminUserItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredUsers = (users: AdminUserItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save admin users to localStorage', e);
  }
};

const getFallbackStats = (): ApiResponse<AdminStats> => {
  const users = getStoredUsers();
  const blockedCount = users.filter((u) => u.status === 'BANNED' || u.status === 'SUSPENDED').length;
  return {
    success: true,
    data: {
      totalUsers: users.length,
      blockedStudentsCount: blockedCount,
      totalListings: 0,
      completedTransactionsCount: 0,
      pendingListingsCount: 0,
      openReportsCount: 0,
      todayNewUsersCount: 0,
      listingsByCategory: {},
      usersByUniversity: {
        'Trường Đại học Phenikaa': users.length,
      },
      emergencyAlerts: [],
    },
  };
};

const filterUsers = (
  users: AdminUserItem[],
  params?: { keyword?: string; status?: string; verified?: boolean }
): AdminUserItem[] => {
  let result = [...users];

  if (params?.status && params.status !== 'ALL') {
    if (params.status === 'BLOCKED_ONLY') {
      result = result.filter((u) => u.status === 'BANNED' || u.status === 'SUSPENDED');
    } else {
      result = result.filter((u) => u.status === params.status);
    }
  }

  if (params?.verified !== undefined) {
    result = result.filter((u) => u.studentCardVerified === params.verified);
  }

  if (params?.keyword) {
    const kw = params.keyword.toLowerCase().trim();
    result = result.filter(
      (u) =>
        u.fullName.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        (u.studentCode && u.studentCode.toLowerCase().includes(kw)) ||
        (u.phone && u.phone.toLowerCase().includes(kw))
    );
  }

  return result;
};

export const adminService = {
  // 1. Dashboard
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    try {
      const res: any = await apiClient.get('/admin/dashboard/stats');
      if (res && res.data && res.data.totalUsers > 0) {
        return res as ApiResponse<AdminStats>;
      }
      return getFallbackStats();
    } catch {
      return getFallbackStats();
    }
  },

  // 2. Listing Moderation
  getListings: async (params?: {
    keyword?: string;
    status?: string;
    categoryId?: number;
    universityId?: number;
    isRiskFlagged?: boolean;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResult<AdminListingItem>>> => {
    try {
      return await apiClient.get('/admin/listings', { params });
    } catch {
      return {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          size: 10,
          totalPages: 0,
        },
      };
    }
  },

  moderateListing: async (
    id: number,
    payload: { action: string; reason?: string; note?: string }
  ): Promise<ApiResponse<AdminListingItem>> => {
    return apiClient.patch(`/admin/listings/${id}/moderate`, payload);
  },

  // 3. User Management
  getUsers: async (params?: {
    keyword?: string;
    universityId?: number;
    status?: string;
    verified?: boolean;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResult<AdminUserItem>>> => {
    try {
      const res: any = await apiClient.get('/admin/users', {
        params,
      });
      if (res && res.data && res.data.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
        // Enforce STRICT Phenikaa-only filter
        const phenikaaOnly = res.data.items.filter(
          (u: AdminUserItem) =>
            (u.email && (u.email.toLowerCase().includes('phenikaa-uni.edu.vn') || u.email.toLowerCase().includes('phenikaa.edu.vn'))) ||
            (u.universityName && u.universityName.toLowerCase().includes('phenikaa'))
        );
        if (phenikaaOnly.length > 0) {
          return {
            ...res,
            data: {
              ...res.data,
              items: phenikaaOnly,
              total: phenikaaOnly.length,
            },
          };
        }
      }
      const filtered = filterUsers(getStoredUsers(), params);
      return {
        success: true,
        data: {
          items: filtered,
          total: filtered.length,
          page: 1,
          size: 50,
          totalPages: 1,
        },
      };
    } catch {
      const filtered = filterUsers(getStoredUsers(), params);
      return {
        success: true,
        data: {
          items: filtered,
          total: filtered.length,
          page: 1,
          size: 50,
          totalPages: 1,
        },
      };
    }
  },

  updateUserStatus: async (
    id: number,
    payload: { action: string; karmaAdjustment?: number; reason?: string }
  ): Promise<ApiResponse<AdminUserItem>> => {
    let apiSuccess = false;
    let apiResUser: any = null;
    try {
      const res = await apiClient.patch<ApiResponse<AdminUserItem>>(`/admin/users/${id}/status`, payload);
      apiSuccess = true;
      apiResUser = res.data;
    } catch {
      // offline fallback
    }

    // Always update local cache in sync
    const users = getStoredUsers();
    const updated = users.map((u) => {
      if (u.id === id) {
        let nextStatus = u.status;
        if (payload.action === 'ACTIVATE') nextStatus = 'ACTIVE';
        if (payload.action === 'SUSPEND') nextStatus = 'SUSPENDED';
        if (payload.action === 'BAN') nextStatus = 'BANNED';

        return {
          ...u,
          status: nextStatus,
          karmaScore: payload.karmaAdjustment ? u.karmaScore + payload.karmaAdjustment : u.karmaScore,
          blockReason: payload.reason || u.blockReason,
        };
      }
      return u;
    });
    saveStoredUsers(updated);

    return {
      success: true,
      data: apiSuccess && apiResUser ? apiResUser : (updated.find((u) => u.id === id) as AdminUserItem),
    };
  },

  reviewStudentCard: async (
    id: number,
    payload: { action: string; karmaAward?: number; reason?: string }
  ): Promise<ApiResponse<AdminUserItem>> => {
    let apiSuccess = false;
    let apiResUser: any = null;
    try {
      const res = await apiClient.patch<ApiResponse<AdminUserItem>>(
        `/admin/users/${id}/student-card`,
        payload
      );
      apiSuccess = true;
      apiResUser = res.data;
    } catch {
      // offline fallback
    }

    const users = getStoredUsers();
    const updated: AdminUserItem[] = users.map((u) => {
      if (u.id === id) {
        const isApproved = payload.action === 'APPROVE';
        const isRejected = payload.action === 'REJECT';
        const cardStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' = isApproved
          ? 'APPROVED'
          : isRejected
          ? 'REJECTED'
          : 'NONE';
        return {
          ...u,
          studentCardVerified: isApproved,
          studentCardStatus: cardStatus,
          studentCardRejectReason: isRejected
            ? (payload.reason || 'Ảnh thẻ mờ, không rõ nét hoặc không trùng khớp thông tin')
            : undefined,
          karmaScore: isApproved && payload.karmaAward ? u.karmaScore + payload.karmaAward : u.karmaScore,
        };
      }
      return u;
    });
    saveStoredUsers(updated);

    // Đồng bộ vào tài khoản nếu sinh viên đang đăng nhập
    try {
      const authRaw = localStorage.getItem('user_info');
      if (authRaw) {
        const authUser = JSON.parse(authRaw);
        if (authUser?.id === id) {
          const isApproved = payload.action === 'APPROVE';
          const isRejected = payload.action === 'REJECT';
          const cardStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' = isApproved
            ? 'APPROVED'
            : isRejected
            ? 'REJECTED'
            : 'NONE';
          const nextUser = {
            ...authUser,
            studentCardVerified: isApproved,
            studentCardStatus: cardStatus,
            studentCardRejectReason: isRejected
              ? (payload.reason || 'Ảnh thẻ mờ, không rõ nét hoặc không trùng khớp thông tin')
              : undefined,
            karmaScore: isApproved && payload.karmaAward ? authUser.karmaScore + payload.karmaAward : authUser.karmaScore,
          };
          localStorage.setItem('user_info', JSON.stringify(nextUser));
          window.dispatchEvent(new CustomEvent('campus_user_updated', { detail: nextUser }));
        }
      }
    } catch {}

    return {
      success: true,
      data: apiSuccess && apiResUser ? apiResUser : (updated.find((u) => u.id === id) as AdminUserItem),
    };
  },

  // 4. Categories
  getCategories: async (): Promise<ApiResponse<CategoryItem[]>> => {
    try {
      return await apiClient.get('/admin/categories');
    } catch {
      return {
        success: true,
        data: [
          { id: 1, name: 'Giáo trình & Sách chuyên ngành', slug: 'giao-trinh-sach', icon: 'BookOpen' },
          { id: 2, name: 'Đồ công nghệ, Laptop & Phụ kiện', slug: 'do-cong-nghe', icon: 'Laptop' },
          { id: 3, name: 'Đồ gia dụng phòng trọ & KTX', slug: 'gia-dung-ktx', icon: 'Home' },
          { id: 4, name: 'Thời trang & Đồ dùng sinh viên', slug: 'thoi-trang', icon: 'Shirt' },
        ],
      };
    }
  },

  createCategory: async (payload: {
    name: string;
    slug?: string;
    icon?: string;
  }): Promise<ApiResponse<CategoryItem>> => {
    return apiClient.post('/admin/categories', payload);
  },

  updateCategory: async (
    id: number,
    payload: { name: string; slug?: string; icon?: string }
  ): Promise<ApiResponse<CategoryItem>> => {
    return apiClient.put(`/admin/categories/${id}`, payload);
  },

  deleteCategory: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/categories/${id}`);
  },

  // 5. Universities & Campuses
  getUniversities: async (): Promise<ApiResponse<UniversityItem[]>> => {
    try {
      return await apiClient.get('/admin/universities');
    } catch {
      return {
        success: true,
        data: [
          {
            id: 1,
            name: 'Trường Đại học Phenikaa',
            shortName: 'PHENIKAA',
            emailDomains: 'st.phenikaa-uni.edu.vn,phenikaa-uni.edu.vn',
            campuses: [
              { id: 1, name: 'Cơ sở Yên Nghĩa (Trụ sở chính)', location: 'Yên Nghĩa, Hà Đông, Hà Nội' },
              { id: 2, name: 'Khu Ký túc xá Phenikaa (Tòa K1 - K2 - K3)', location: 'Khuôn viên ĐH Phenikaa' },
            ],
          },
        ],
      };
    }
  },

  createUniversity: async (payload: {
    name: string;
    shortName: string;
    emailDomains: string;
  }): Promise<ApiResponse<UniversityItem>> => {
    return apiClient.post('/admin/universities', payload);
  },

  updateUniversity: async (
    id: number,
    payload: { name: string; shortName: string; emailDomains: string }
  ): Promise<ApiResponse<UniversityItem>> => {
    return apiClient.put(`/admin/universities/${id}`, payload);
  },

  createCampus: async (payload: {
    universityId: number;
    name: string;
    location?: string;
  }): Promise<ApiResponse<any>> => {
    return apiClient.post('/admin/campuses', payload);
  },

  // 6. Keywords Blacklist & Audit Logs
  getBlacklistKeywords: async (): Promise<ApiResponse<KeywordBlacklistItem[]>> => {
    try {
      return await apiClient.get('/admin/keywords');
    } catch {
      return { success: true, data: [] };
    }
  },

  addBlacklistKeyword: async (payload: {
    keyword: string;
    category?: string;
    severity?: string;
    action?: string;
    reason?: string;
  }): Promise<ApiResponse<KeywordBlacklistItem>> => {
    return apiClient.post('/admin/keywords', payload);
  },

  deleteBlacklistKeyword: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/keywords/${id}`);
  },

  getAuditLogs: async (params?: {
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedResult<AuditLogItem>>> => {
    try {
      return await apiClient.get('/admin/audit-logs', { params });
    } catch {
      return {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          size: 10,
          totalPages: 0,
        },
      };
    }
  },

  getBannedStudents: async (): Promise<ApiResponse<BannedStudentItem[]>> => {
    try {
      return await apiClient.get('/admin/banned-students');
    } catch {
      return { success: true, data: [] };
    }
  },

  getStoredUsers,
  saveStoredUsers,
};
