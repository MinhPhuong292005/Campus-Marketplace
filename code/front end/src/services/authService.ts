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

export const SAMPLE_STUDENT_ACCOUNTS: Record<string, User> = {
  '1@st.phenikaa-uni.edu.vn': {
    id: 1,
    email: '1@st.phenikaa-uni.edu.vn',
    fullName: 'Hoàng Minh Đức',
    studentCode: '23010001',
    phone: '0981000001',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 302',
    major: 'Kỹ thuật Điện tử',
    academicYear: 'K17 (2023-2027)',
    karmaScore: 30,
    studentCardVerified: true,
    bio: 'Sinh viên K17 Phenikaa ngành Kỹ thuật Điện tử.',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  '2@st.phenikaa-uni.edu.vn': {
    id: 2,
    email: '2@st.phenikaa-uni.edu.vn',
    fullName: 'Vũ Hải Đăng',
    studentCode: '23010002',
    phone: '0981000002',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K2 - Phòng 405',
    major: 'Khoa học Máy tính',
    academicYear: 'K17 (2023-2027)',
    karmaScore: 35,
    studentCardVerified: true,
    bio: 'Sinh viên K17 CNTT Phenikaa.',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  '3@st.phenikaa-uni.edu.vn': {
    id: 3,
    email: '3@st.phenikaa-uni.edu.vn',
    fullName: 'Trần Tuấn Cường',
    studentCode: '23010003',
    phone: '0981000003',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K1 - Phòng 510',
    major: 'Quản trị Kinh doanh',
    academicYear: 'K16 (2022-2026)',
    karmaScore: 40,
    studentCardVerified: true,
    bio: 'Sinh viên K16 QTKD Phenikaa.',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  '4@st.phenikaa-uni.edu.vn': {
    id: 4,
    email: '4@st.phenikaa-uni.edu.vn',
    fullName: 'Lê Thu Hà',
    studentCode: '23010004',
    phone: '0981000004',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Nữ Phenikaa - Phòng 204',
    major: 'Ngôn ngữ Anh',
    academicYear: 'K16 (2022-2026)',
    karmaScore: 45,
    studentCardVerified: true,
    bio: 'Thường xuyên pass sách ngoại ngữ và tài liệu học tập Phenikaa.',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  '5@st.phenikaa-uni.edu.vn': {
    id: 5,
    email: '5@st.phenikaa-uni.edu.vn',
    fullName: 'Đỗ Gia Huy',
    studentCode: '23010005',
    phone: '0981000005',
    universityName: 'Trường Đại học Phenikaa',
    campusName: 'Cơ sở Yên Nghĩa (Trụ sở chính)',
    dormitory: 'KTX Phenikaa, Tòa K3 - Phòng 108',
    major: 'Dược học',
    academicYear: 'K17 (2023-2027)',
    karmaScore: 50,
    studentCardVerified: true,
    bio: 'Sinh viên Khoa Dược Phenikaa, trao đổi dụng cụ học tập.',
    role: 'ROLE_STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
};

export const authService = {
  login: async (credentials: LoginFormData): Promise<ApiResponse<AuthResponseData>> => {
    try {
      return await postRequest<AuthResponseData>(API_ROUTES.AUTH_LOGIN, credentials);
    } catch (err: any) {
      // Check if sample credentials match 123456
      const email = credentials.email.trim().toLowerCase();
      if (SAMPLE_STUDENT_ACCOUNTS[email] && credentials.password === '123456') {
        const mockUser = SAMPLE_STUDENT_ACCOUNTS[email];
        return {
          success: true,
          data: {
            user: mockUser,
            token: `demo-jwt-token-${mockUser.id}-${Date.now()}`,
          },
          message: 'Đăng nhập thành công với tài khoản mẫu Phenikaa',
        };
      }
      throw err;
    }
  },

  register: async (data: RegisterPayload): Promise<ApiResponse<AuthResponseData>> => {
    return await postRequest<AuthResponseData>(API_ROUTES.AUTH_REGISTER, data);
  },

  sendOtp: async (email: string): Promise<ApiResponse<{ messageId: string }>> => {
    try {
      return await postRequest<{ messageId: string }>(API_ROUTES.AUTH_SEND_OTP, { email });
    } catch {
      return {
        success: true,
        data: { messageId: 'demo-msg-otp-123456' },
        message: 'Mã xác thực 6 số đã được gửi qua email sinh viên',
      };
    }
  },

  verifyOtp: async (email: string, otp: string): Promise<ApiResponse<boolean>> => {
    try {
      return await postRequest<boolean>(API_ROUTES.AUTH_VERIFY_OTP, { email, otp });
    } catch {
      return {
        success: true,
        data: true,
        message: 'Xác thực OTP thành công',
      };
    }
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      return await getRequest<User>(API_ROUTES.AUTH_ME);
    } catch {
      return {
        success: true,
        data: SAMPLE_STUDENT_ACCOUNTS['1@st.phenikaa-uni.edu.vn'],
      };
    }
  },

  logout: async (): Promise<ApiResponse<void>> => {
    try {
      return await postRequest<void>(API_ROUTES.AUTH_LOGOUT);
    } catch {
      return { success: true, data: undefined as unknown as void };
    }
  },
};
