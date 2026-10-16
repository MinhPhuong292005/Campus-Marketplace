import { getRequest, postRequest, putRequest, deleteRequest, patchRequest } from './api';
import { Listing, PaginatedResult, ApiResponse } from '../types';
import { ListingFormData } from '../schemas/listing.schema';
import { API_ROUTES } from '../constants';

export interface ListingFilterParams {
  page?: number;
  size?: number;
  keyword?: string;
  categoryId?: number;
  universityId?: number;
  campusId?: number;
  transactionType?: string;
  conditionStatus?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Normalizer to guarantee both `images` array and `imageUrls` are always populated and clean
export const normalizeListing = (raw: any): Listing => {
  if (!raw) return raw;

  let imageUrls: string[] = [];
  if (Array.isArray(raw.imageUrls) && raw.imageUrls.length > 0) {
    imageUrls = raw.imageUrls;
  } else if (Array.isArray(raw.images) && raw.images.length > 0) {
    imageUrls = raw.images.map((img: any) => (typeof img === 'string' ? img : img.mediaUrl));
  }

  const images = (Array.isArray(raw.images) && raw.images.length > 0)
    ? raw.images.map((img: any, i: number) => {
        if (typeof img === 'string') {
          return {
            id: i + 1,
            listingId: raw.id,
            mediaUrl: img,
            mediaType: img.endsWith('.mp4') ? 'VIDEO' : 'IMAGE',
            sortOrder: i,
          };
        }
        return img;
      })
    : imageUrls.map((url: string, i: number) => ({
        id: i + 1,
        listingId: raw.id,
        mediaUrl: url,
        mediaType: url.endsWith('.mp4') ? 'VIDEO' : 'IMAGE',
        sortOrder: i,
      }));

  return {
    ...raw,
    images,
    imageUrls,
  };
};

export const listingService = {
  getListings: async (params?: ListingFilterParams): Promise<ApiResponse<PaginatedResult<Listing>>> => {
    try {
      const hasFilterOrSearch =
        Boolean(params?.keyword) ||
        Boolean(params?.categoryId) ||
        Boolean(params?.transactionType && params.transactionType !== 'ALL') ||
        Boolean(params?.conditionStatus && params.conditionStatus !== 'ALL') ||
        Boolean(params?.universityId) ||
        params?.minPrice !== undefined ||
        params?.maxPrice !== undefined;

      const endpoint = hasFilterOrSearch
        ? `${API_ROUTES.PUBLIC_LISTINGS}/search`
        : API_ROUTES.PUBLIC_LISTINGS;

      const queryParams: Record<string, unknown> = {
        page: params?.page ?? 0,
        size: params?.size ?? 24,
      };

      if (params?.keyword) queryParams.keyword = params.keyword;
      if (params?.categoryId) queryParams.categoryId = params.categoryId;
      if (params?.transactionType && params.transactionType !== 'ALL') {
        queryParams.transactionType = params.transactionType;
      }
      if (params?.conditionStatus && params.conditionStatus !== 'ALL') {
        queryParams.conditionStatus = params.conditionStatus;
      }
      if (params?.universityId) queryParams.universityId = params.universityId;
      if (params?.minPrice !== undefined) queryParams.minPrice = params.minPrice;
      if (params?.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;

      const res = await getRequest<PaginatedResult<any>>(endpoint, queryParams);
      if (res?.data) {
        const rawItems = res.data.content || res.data.items || [];
        const normalizedItems = rawItems.map(normalizeListing);
        return {
          ...res,
          data: {
            ...res.data,
            content: normalizedItems,
            items: normalizedItems,
          },
        };
      }

      return {
        success: true,
        data: {
          content: [],
          items: [],
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: 24,
        },
      };
    } catch (err: any) {
      console.warn('Failed to fetch public listings:', err);
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Không thể tải danh sách sản phẩm',
        data: {
          content: [],
          items: [],
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: 24,
        },
      };
    }
  },

  getListingById: async (id: number): Promise<ApiResponse<Listing>> => {
    try {
      const res = await getRequest<any>(`${API_ROUTES.PUBLIC_LISTINGS}/${id}`);
      if (res?.data && res.data.id) {
        return {
          ...res,
          data: normalizeListing(res.data),
        };
      }
      return {
        success: false,
        message: res.message || 'Không tìm thấy sản phẩm.',
        data: null as unknown as Listing,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Không tìm thấy sản phẩm hoặc sản phẩm đã bị gỡ bỏ.',
        data: null as unknown as Listing,
      };
    }
  },

  createListing: async (formData: ListingFormData): Promise<ApiResponse<Listing>> => {
    const res = await postRequest<any>(API_ROUTES.LISTINGS, formData);
    if (res?.data) {
      return {
        ...res,
        data: normalizeListing(res.data),
      };
    }
    return res as unknown as ApiResponse<Listing>;
  },

  updateListing: async (id: number, formData: Partial<ListingFormData>): Promise<ApiResponse<Listing>> => {
    const res = await putRequest<any>(`${API_ROUTES.LISTINGS}/${id}`, formData);
    if (res?.data) {
      return {
        ...res,
        data: normalizeListing(res.data),
      };
    }
    return res as unknown as ApiResponse<Listing>;
  },

  deleteListing: async (id: number): Promise<ApiResponse<void>> => {
    return deleteRequest<void>(`${API_ROUTES.LISTINGS}/${id}`);
  },

  getMyListings: async (status?: string, page = 0, size = 20): Promise<ApiResponse<PaginatedResult<Listing>>> => {
    try {
      const params: Record<string, unknown> = { page, size };
      if (status && status !== 'ALL') {
        params.status = status;
      }
      const res = await getRequest<PaginatedResult<any>>(API_ROUTES.MY_LISTINGS, params);
      if (res?.data) {
        const rawItems = res.data.content || res.data.items || [];
        const normalizedItems = rawItems.map(normalizeListing);
        return {
          ...res,
          data: {
            ...res.data,
            content: normalizedItems,
            items: normalizedItems,
          },
        };
      }
      return {
        success: true,
        data: {
          content: [],
          items: [],
          totalElements: 0,
          totalPages: 0,
          page,
          size,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message,
        data: {
          content: [],
          items: [],
          totalElements: 0,
          totalPages: 0,
          page,
          size,
        },
      };
    }
  },

  updateListingStatus: async (id: number, status: string): Promise<ApiResponse<Listing>> => {
    const res = await patchRequest<any>(`${API_ROUTES.LISTINGS}/${id}/status`, { status });
    if (res?.data) {
      return {
        ...res,
        data: normalizeListing(res.data),
      };
    }
    return res as unknown as ApiResponse<Listing>;
  },

  uploadMedia: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const { apiClient } = await import('../lib/axios');
    const res = await apiClient.post(API_ROUTES.MEDIA_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res as unknown as ApiResponse<{ url: string }>;
  },

  getCategories: async (): Promise<ApiResponse<Array<{ id: number; name: string; slug: string; icon?: string }>>> => {
    return getRequest<Array<{ id: number; name: string; slug: string; icon?: string }>>(API_ROUTES.CATEGORIES);
  },
};
