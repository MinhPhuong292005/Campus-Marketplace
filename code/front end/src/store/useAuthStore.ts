import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateKarma: (newScore: number) => void;
  updateUser: (fields: Partial<User>) => void;
  updateUserStatus: (
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'BLOCKED',
    blockReason?: string,
    suspendedUntil?: string
  ) => void;
}

const getInitialUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user_info');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialToken = localStorage.getItem('access_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!initialToken,
  token: initialToken,

  login: (user, token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, isAuthenticated: true, token });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    set({ user: null, isAuthenticated: false, token: null });
  },

  updateKarma: (newScore) =>
    set((state) => ({
      user: state.user ? { ...state.user, karmaScore: newScore } : null,
    })),

  updateUser: (fields) =>
    set((state) => {
      if (!state.user) return state;
      const updatedUser: User = { ...state.user, ...fields };
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      return { user: updatedUser };
    }),

  updateUserStatus: (status, blockReason, suspendedUntil) =>
    set((state) => {
      if (!state.user) return state;
      const updatedUser: User = {
        ...state.user,
        status: status as any,
        blockReason: status === 'ACTIVE' ? undefined : (blockReason || state.user.blockReason),
        suspendedUntil: status === 'ACTIVE' ? undefined : (suspendedUntil || state.user.suspendedUntil),
      };
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      return { user: updatedUser };
    }),
}));
