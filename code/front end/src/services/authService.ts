import { postRequest, getRequest } from './api';
import { User, ApiResponse } from '../types';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { API_ROUTES } from '../constants';

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface RegisterPayload extends RegisterFormData {
  otp?: string;
}

export const SAMPLE_STUDENT_ACCOUNTS: Record<string, User> = {};

export const authService = {
  login: async (credentials: LoginFormData): Promise<ApiResponse<AuthResponseData>> => {
    return await postRequest<AuthResponseData>(API_ROUTES.AUTH_LOGIN, credentials);
  },

  register: async (data: RegisterPayload): Promise<ApiResponse<AuthResponseData>> => {
    return await postRequest<AuthResponseData>(API_ROUTES.AUTH_REGISTER, data);
  },

  sendOtp: async (email: string): Promise<ApiResponse<{ messageId: string }>> => {
    return await postRequest<{ messageId: string }>(API_ROUTES.AUTH_SEND_OTP, { email });
  },

  verifyOtp: async (email: string, otp: string): Promise<ApiResponse<boolean>> => {
    return await postRequest<boolean>(API_ROUTES.AUTH_VERIFY_OTP, { email, otp });
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return await getRequest<User>(API_ROUTES.AUTH_ME);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    try {
      return await postRequest<void>(API_ROUTES.AUTH_LOGOUT);
    } catch {
      return { success: true, data: undefined as unknown as void };
    }
  },
};
