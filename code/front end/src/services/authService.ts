import { postRequest, getRequest } from './api';
import { User, ApiResponse } from '../types';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { API_ROUTES } from '../constants';

export interface AuthResponseData {
  user: User;
  token: string;
}

export const authService = {
  login: async (credentials: LoginFormData): Promise<ApiResponse<AuthResponseData>> => {
    return postRequest<AuthResponseData>(API_ROUTES.AUTH_LOGIN, credentials);
  },

  register: async (data: RegisterFormData): Promise<ApiResponse<AuthResponseData>> => {
    return postRequest<AuthResponseData>(API_ROUTES.AUTH_REGISTER, data);
  },

  sendOtp: async (email: string): Promise<ApiResponse<{ messageId: string }>> => {
    return postRequest<{ messageId: string }>(API_ROUTES.AUTH_SEND_OTP, { email });
  },

  verifyOtp: async (email: string, otp: string): Promise<ApiResponse<boolean>> => {
    return postRequest<boolean>(API_ROUTES.AUTH_VERIFY_OTP, { email, otp });
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return getRequest<User>(API_ROUTES.STUDENT_PROFILE);
  },
};
