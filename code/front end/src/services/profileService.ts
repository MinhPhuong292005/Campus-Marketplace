import { getRequest, putRequest } from './api';
import { User, PublicProfile, University, Campus, ApiResponse } from '../types';
import { API_ROUTES } from '../constants';

export interface UserProfileFormData {
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  universityId?: number;
  campusId?: number;
  dormitory?: string;
  studentCode?: string;
  major?: string;
  academicYear?: string;
  bio?: string;
}

export const profileService = {
  getMyProfile: async (): Promise<ApiResponse<User>> => {
    return getRequest<User>(API_ROUTES.STUDENT_PROFILE);
  },

  updateProfile: async (data: UserProfileFormData): Promise<ApiResponse<User>> => {
    return putRequest<User>(API_ROUTES.STUDENT_PROFILE, data);
  },

  getPublicProfile: async (userId: number): Promise<ApiResponse<PublicProfile>> => {
    return getRequest<PublicProfile>(`${API_ROUTES.PUBLIC_PROFILE}/${userId}`);
  },

  getUniversities: async (): Promise<ApiResponse<University[]>> => {
    return getRequest<University[]>(API_ROUTES.UNIVERSITIES);
  },

  getCampuses: async (universityId: number): Promise<ApiResponse<Campus[]>> => {
    return getRequest<Campus[]>(`${API_ROUTES.UNIVERSITIES}/${universityId}/campuses`);
  },
};
