import { create } from 'zustand';
import { User } from '../types';

interface AdminAuthState {
  adminUser: User | null;
  isAdminAuthenticated: boolean;
  adminToken: string | null;
  loginAdmin: (user: User, token: string) => void;
  logoutAdmin: () => void;
}

const getInitialAdminUser = (): User | null => {
  try {
    const raw = localStorage.getItem('admin_user_info');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialAdminToken = localStorage.getItem('admin_access_token');

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  adminUser: getInitialAdminUser(),
  isAdminAuthenticated: !!initialAdminToken,
  adminToken: initialAdminToken,

  loginAdmin: (user, token) => {
    localStorage.setItem('admin_access_token', token);
    localStorage.setItem('admin_user_info', JSON.stringify(user));
    set({ adminUser: user, isAdminAuthenticated: true, adminToken: token });
  },

  logoutAdmin: () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user_info');
    set({ adminUser: null, isAdminAuthenticated: false, adminToken: null });
  },
}));
