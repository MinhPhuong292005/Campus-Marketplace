import { apiClient } from '../lib/axios';
import { ApiResponse, PaginatedResult } from '../types';
import { PhenikaaSafePoint, getSafeMeetingPoints, saveSafeMeetingPoints } from '../constants/phenikaaData';

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
  authorStudentCode?: string;
  authorStatus?: string;
  universityName: string;
  campusName: string;
  categoryId: number;
  categoryName: string;
  title: string;
  description: string;
  price: number;
  transactionType: string;
  conditionStatus: string;
  rentalTerms?: string;
  depositAmount?: number;
  swapTarget?: string;
  safeMeetingPoint?: string;
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
  major?: string;
  academicYear?: string;
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

const LOCAL_STORAGE_USERS_KEY = 'campus_admin_users_fresh_v11';

try {
  ['campus_admin_users', 'campus_admin_users_v2', 'campus_admin_users_v3', 'campus_admin_users_v4', 'campus_admin_users_v5', 'campus_admin_users_phenikaa_v6', 'campus_admin_users_phenikaa_v7', 'campus_admin_users_phenikaa_v8', 'campus_admin_users_phenikaa_v9', 'campus_admin_users_fresh_v10'].forEach((k) => {
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

const LOCAL_STORAGE_UNIVERSITIES_KEY = 'campus_admin_universities_v1';

export const INITIAL_UNIVERSITIES: UniversityItem[] = [
  {
    id: 1,
    name: 'Trường Đại học Phenikaa',
    shortName: 'PHENIKAA',
    emailDomains: 'st.phenikaa-uni.edu.vn,phenikaa-uni.edu.vn',
    campuses: [
      { id: 1, name: 'Cơ sở Yên Nghĩa (Trụ sở chính)', location: 'Đường Nguyễn Trác, P. Yên Nghĩa, Q. Hà Đông, Hà Nội' },
      { id: 2, name: 'Khu Ký túc xá Phenikaa (Tòa K1 - K2 - K3)', location: 'Khuôn viên Nội trú ĐH Phenikaa' },
      { id: 3, name: 'Khu Thể thao & Nhà thi đấu Đa năng Phenikaa', location: 'Cạnh Tòa A3 & KTX Phenikaa' },
    ],
  },
];

export const getStoredUniversities = (): UniversityItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_UNIVERSITIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_UNIVERSITIES;
};

export const saveStoredUniversities = (unis: UniversityItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_UNIVERSITIES_KEY, JSON.stringify(unis));
    window.dispatchEvent(new CustomEvent('campus_universities_updated', { detail: unis }));
  } catch (e) {
    console.error('Failed to save universities to localStorage', e);
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

  // 5. Universities, Campuses & Meeting Points
  getUniversities: async (): Promise<ApiResponse<UniversityItem[]>> => {
    try {
      const res: any = await apiClient.get('/admin/universities');
      if (res && res.data && res.data.length > 0) {
        return res as ApiResponse<UniversityItem[]>;
      }
      return { success: true, data: getStoredUniversities() };
    } catch {
      return { success: true, data: getStoredUniversities() };
    }
  },

  createUniversity: async (payload: {
    name: string;
    shortName: string;
    emailDomains: string;
  }): Promise<ApiResponse<UniversityItem>> => {
    try {
      const res: any = await apiClient.post('/admin/universities', payload);
      if (res && res.data) {
        const unis = getStoredUniversities();
        saveStoredUniversities([...unis, res.data]);
        return res;
      }
    } catch {}
    const unis = getStoredUniversities();
    const newUni: UniversityItem = {
      id: Date.now(),
      name: payload.name.trim(),
      shortName: payload.shortName.trim().toUpperCase(),
      emailDomains: payload.emailDomains.trim().toLowerCase(),
      campuses: [],
    };
    saveStoredUniversities([...unis, newUni]);
    return { success: true, data: newUni };
  },

  updateUniversity: async (
    id: number,
    payload: { name: string; shortName: string; emailDomains: string }
  ): Promise<ApiResponse<UniversityItem>> => {
    try {
      const res: any = await apiClient.put(`/admin/universities/${id}`, payload);
      if (res && res.data) {
        const unis = getStoredUniversities();
        const updated = unis.map((u) => (u.id === id ? { ...u, ...res.data } : u));
        saveStoredUniversities(updated);
        return res;
      }
    } catch {}
    const unis = getStoredUniversities();
    const updated = unis.map((u) =>
      u.id === id
        ? {
            ...u,
            name: payload.name.trim(),
            shortName: payload.shortName.trim().toUpperCase(),
            emailDomains: payload.emailDomains.trim().toLowerCase(),
          }
        : u
    );
    saveStoredUniversities(updated);
    return { success: true, data: updated.find((u) => u.id === id)! };
  },

  deleteUniversity: async (id: number): Promise<ApiResponse<void>> => {
    try {
      await apiClient.delete(`/admin/universities/${id}`);
    } catch {}
    const unis = getStoredUniversities().filter((u) => u.id !== id);
    saveStoredUniversities(unis);
    return { success: true };
  },

  createCampus: async (payload: {
    universityId: number;
    name: string;
    location?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const res: any = await apiClient.post('/admin/campuses', payload);
      if (res && res.data) {
        const unis = getStoredUniversities();
        const updated = unis.map((u) => {
          if (u.id === payload.universityId) {
            return { ...u, campuses: [...(u.campuses || []), res.data] };
          }
          return u;
        });
        saveStoredUniversities(updated);
        return res;
      }
    } catch {}
    const unis = getStoredUniversities();
    const newCamp = {
      id: Date.now(),
      name: payload.name.trim(),
      location: payload.location?.trim() || '',
    };
    const updated = unis.map((u) => {
      if (u.id === payload.universityId) {
        return { ...u, campuses: [...(u.campuses || []), newCamp] };
      }
      return u;
    });
    saveStoredUniversities(updated);
    return { success: true, data: newCamp };
  },

  updateCampus: async (
    id: number,
    payload: { universityId?: number; name: string; location?: string }
  ): Promise<ApiResponse<any>> => {
    try {
      await apiClient.put(`/admin/campuses/${id}`, payload);
    } catch {}
    const unis = getStoredUniversities();
    const updated = unis.map((u) => ({
      ...u,
      campuses: (u.campuses || []).map((c) =>
        c.id === id
          ? { ...c, name: payload.name.trim(), location: payload.location?.trim() || '' }
          : c
      ),
    }));
    saveStoredUniversities(updated);
    return { success: true };
  },

  deleteCampus: async (id: number): Promise<ApiResponse<void>> => {
    try {
      await apiClient.delete(`/admin/campuses/${id}`);
    } catch {}
    const unis = getStoredUniversities();
    const updated = unis.map((u) => ({
      ...u,
      campuses: (u.campuses || []).filter((c) => c.id !== id),
    }));
    saveStoredUniversities(updated);
    return { success: true };
  },

  // 6. Safe Meeting Points Management
  getMeetingPoints: (): PhenikaaSafePoint[] => {
    return getSafeMeetingPoints();
  },

  createMeetingPoint: (payload: Omit<PhenikaaSafePoint, 'id'>): PhenikaaSafePoint => {
    const points = getSafeMeetingPoints();
    const newPt: PhenikaaSafePoint = {
      id: Date.now(),
      name: payload.name.trim(),
      address: payload.address.trim(),
      campusName: payload.campusName.trim(),
      description: payload.description.trim(),
      recommendedHours: payload.recommendedHours.trim(),
      isCctvMonitored: Boolean(payload.isCctvMonitored),
    };
    saveSafeMeetingPoints([...points, newPt]);
    return newPt;
  },

  updateMeetingPoint: (
    id: number,
    payload: Partial<PhenikaaSafePoint>
  ): PhenikaaSafePoint | null => {
    const points = getSafeMeetingPoints();
    const updated = points.map((p) =>
      p.id === id
        ? {
            ...p,
            ...payload,
            name: payload.name !== undefined ? payload.name.trim() : p.name,
            address: payload.address !== undefined ? payload.address.trim() : p.address,
            campusName: payload.campusName !== undefined ? payload.campusName.trim() : p.campusName,
            description: payload.description !== undefined ? payload.description.trim() : p.description,
            recommendedHours:
              payload.recommendedHours !== undefined
                ? payload.recommendedHours.trim()
                : p.recommendedHours,
            isCctvMonitored:
              payload.isCctvMonitored !== undefined
                ? Boolean(payload.isCctvMonitored)
                : p.isCctvMonitored,
          }
        : p
    );
    saveSafeMeetingPoints(updated);
    return updated.find((p) => p.id === id) || null;
  },

  deleteMeetingPoint: (id: number): boolean => {
    const points = getSafeMeetingPoints();
    const filtered = points.filter((p) => p.id !== id);
    saveSafeMeetingPoints(filtered);
    return true;
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
