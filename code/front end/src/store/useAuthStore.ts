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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('access_token'),

  login: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, isAuthenticated: true, token });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false, token: null });
  },

  updateKarma: (newScore) =>
    set((state) => ({
      user: state.user ? { ...state.user, karmaScore: newScore } : null,
    })),
}));
