import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateKarma: (newScore: number) => void;
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
}));
