import { getRequest, postRequest, putRequest, deleteRequest } from './api';
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
  minPrice?: number;
  maxPrice?: number;
}

export const listingService = {
  getListings: async (params?: ListingFilterParams): Promise<ApiResponse<PaginatedResult<Listing>>> => {
    return getRequest<PaginatedResult<Listing>>(API_ROUTES.LISTINGS, params as Record<string, unknown>);
  },

  getListingById: async (id: number): Promise<ApiResponse<Listing>> => {
    return getRequest<Listing>(`${API_ROUTES.LISTINGS}/${id}`);
  },

  createListing: async (formData: ListingFormData): Promise<ApiResponse<Listing>> => {
    return postRequest<Listing>(API_ROUTES.LISTINGS, formData);
  },

  updateListing: async (id: number, formData: Partial<ListingFormData>): Promise<ApiResponse<Listing>> => {
    return putRequest<Listing>(`${API_ROUTES.LISTINGS}/${id}`, formData);
  },

  deleteListing: async (id: number): Promise<ApiResponse<void>> => {
    return deleteRequest<void>(`${API_ROUTES.LISTINGS}/${id}`);
  },
};
