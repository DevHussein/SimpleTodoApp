import { create } from 'zustand';
import type { AppwriteUser } from '../services/authService';

type AuthStore = {
  user: AppwriteUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setUser: (user: AppwriteUser | null) => void;
  setBootstrapping: (isBootstrapping: boolean) => void;
  resetAuth: () => void;
};

export const useAuthStore = create<AuthStore>(set => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  setUser: user =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  setBootstrapping: isBootstrapping =>
    set({
      isBootstrapping,
    }),
  resetAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
    }),
}));
