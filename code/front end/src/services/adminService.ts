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
  imageUrls: string[];
  createdAt: string;
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
  studentCardImageUrl?: string;
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

const LOCAL_STORAGE_USERS_KEY = 'campus_admin_users_phenikaa_v9';

// Xóa triệt để các cache cũ từng chứa dữ liệu trường ngoài (HUST, NEU, VNU,...)
try {
  ['campus_admin_users', 'campus_admin_users_v2', 'campus_admin_users_v3', 'campus_admin_users_v4', 'campus_admin_users_v5', 'campus_admin_users_phenikaa_v6', 'campus_admin_users_phenikaa_v7', 'campus_admin_users_phenikaa_v8'].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch {}

export const INITIAL_ADMIN_USERS: AdminUserItem[] = [
  {
    id: 1,
    fullName: 'Hoàng Minh Đức (Phenikaa K17)',
    email: '1@st.phenikaa-uni.edu.vn',
    studentCode: '23010001',
    phone: '0981000001',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 302',
    karmaScore: 45,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 2,
    fullName: 'Vũ Hải Đăng (Phenikaa K17)',
    email: '2@st.phenikaa-uni.edu.vn',
    studentCode: '23010002',
    phone: '0981000002',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K2 - Phòng 405',
    karmaScore: 35,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T11:00:00Z',
  },
  {
    id: 3,
    fullName: 'Trần Tuấn Cường (Phenikaa K17)',
    email: '3@st.phenikaa-uni.edu.vn',
    studentCode: '23010003',
    phone: '0981000003',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 510',
    karmaScore: 30,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T14:20:00Z',
  },
  {
    id: 4,
    fullName: 'Lê Thu Hà (Phenikaa K16)',
    email: '4@st.phenikaa-uni.edu.vn',
    studentCode: '23010004',
    phone: '0981000004',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Nữ Phenikaa - Phòng 204',
    karmaScore: 40,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-02T09:30:00Z',
  },
  {
    id: 5,
    fullName: 'Đỗ Gia Huy (Phenikaa K17)',
    email: '5@st.phenikaa-uni.edu.vn',
    studentCode: '23010005',
    phone: '0981000005',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K3 - Phòng 108',
    karmaScore: 35,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-03T10:15:00Z',
  },
  {
    id: 6,
    fullName: 'Trần Đức Anh (Phenikaa K16)',
    email: 'anh.td22@st.phenikaa-uni.edu.vn',
    studentCode: '22010156',
    phone: '0981000066',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K2 - Phòng 301',
    karmaScore: 65,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-08-15T08:00:00Z',
  },
  {
    id: 7,
    fullName: 'Nguyễn Thị Mai (Phenikaa K17)',
    email: 'mai.nt23@st.phenikaa-uni.edu.vn',
    studentCode: '23010345',
    phone: '0981000077',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Nữ Phenikaa - Phòng 412',
    karmaScore: 48,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-08-20T09:00:00Z',
  },
  {
    id: 8,
    fullName: 'Phạm Tuấn Minh (Phenikaa K18)',
    email: 'minh.pt24@st.phenikaa-uni.edu.vn',
    studentCode: '24010190',
    phone: '0981000055',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 105',
    karmaScore: 50,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-08-22T14:00:00Z',
  },
  {
    id: 9,
    fullName: 'Lê Hoàng Long (Phenikaa K17)',
    email: 'long.lh23@st.phenikaa-uni.edu.vn',
    studentCode: '23010567',
    phone: '0981000044',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K3 - Phòng 204',
    karmaScore: 42,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-08-25T11:00:00Z',
  },
  {
    id: 10,
    fullName: 'Nguyễn Văn Nam (Phenikaa K18)',
    email: 'nam.nv24@st.phenikaa-uni.edu.vn',
    studentCode: '24010892',
    phone: '0981000088',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 212',
    karmaScore: 40,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-05T15:30:00Z',
  },
  {
    id: 11,
    fullName: 'Bùi Phương Nga (Phenikaa K17)',
    email: 'nga.bp23@st.phenikaa-uni.edu.vn',
    studentCode: '23010088',
    phone: '0981000099',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Nữ Phenikaa - Phòng 305',
    karmaScore: 55,
    studentCardVerified: true,
    studentCardImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-06T16:00:00Z',
  },
];

const getStoredUsers = (): AdminUserItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(INITIAL_ADMIN_USERS));
      return INITIAL_ADMIN_USERS;
    }
    const parsed: AdminUserItem[] = JSON.parse(raw);
    const phenikaaOnly = parsed.filter(
      (u) =>
        u.email.toLowerCase().includes('phenikaa-uni.edu.vn') ||
        u.universityName?.toLowerCase().includes('phenikaa')
    );
    if (phenikaaOnly.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(INITIAL_ADMIN_USERS));
      return INITIAL_ADMIN_USERS;
    }
    return phenikaaOnly;
  } catch {
    return INITIAL_ADMIN_USERS;
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
      totalListings: 27,
      completedTransactionsCount: 15,
      pendingListingsCount: 3,
      openReportsCount: 2,
      todayNewUsersCount: 1,
      listingsByCategory: {
        'Giáo trình & Sách chuyên ngành': 12,
        'Đồ công nghệ, Laptop & Phụ kiện': 8,
        'Đồ gia dụng phòng trọ & KTX': 4,
        'Thời trang & Đồ dùng sinh viên': 3,
      },
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
      const res = await apiClient.get<ApiResponse<AdminStats>>('/admin/dashboard/stats');
      if (res && res.data && res.data.totalUsers > 0) {
        return res;
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
      const res = await apiClient.get<ApiResponse<PaginatedResult<AdminUserItem>>>('/admin/users', {
        params,
      });
      if (res && res.data && res.data.items && res.data.items.length > 0) {
        // Enforce STRICT Phenikaa-only filter
        const phenikaaOnly = res.data.items.filter(
          (u) =>
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
    const updated = users.map((u) => {
      if (u.id === id) {
        return {
          ...u,
          studentCardVerified: payload.action === 'APPROVE',
          karmaScore: payload.karmaAward ? u.karmaScore + payload.karmaAward : u.karmaScore,
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
};
