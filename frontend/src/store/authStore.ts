import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../services/authService';
import type { User } from '../types/api';

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAction: (user: User, token: string) => void;
  logoutAction: () => void;
  setUserAction: (user: User | null) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      loginAction: (user, token) => {
        set({ user, isAuthenticated: true, isLoading: false });
      },
      
      logoutAction: () => {
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
      
      setUserAction: (newUser: User | null) => {
        if (newUser) {
          localStorage.setItem('user', JSON.stringify(newUser));
        } else {
          localStorage.removeItem('user');
        }
        set({ user: newUser, isAuthenticated: !!newUser });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Zustand authStore: Hydration complete from auth-storage.');
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
