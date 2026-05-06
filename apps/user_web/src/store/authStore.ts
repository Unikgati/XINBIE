import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, ApiException } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  phoneWa?: string | null;
  emailVerifiedAt?: string | null;
  isActive: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  
  /** Login with email + password */
  login: (email: string, password: string) => Promise<void>;

  /** Register (sends OTP, does NOT create user yet) */
  register: (name: string, email: string, password: string) => Promise<void>;
  
  /** Verify email OTP after registration → returns tokens + user */
  verifyEmail: (email: string, otp: string) => Promise<void>;
  
  /** Google sign-in */
  loginWithGoogle: (idToken: string, name: string, email: string, avatarUrl?: string, googleId?: string) => Promise<void>;
  
  /** Forgot password → sends OTP */
  forgotPassword: (email: string) => Promise<void>;
  
  /** Verify reset OTP */
  verifyResetOtp: (email: string, otp: string) => Promise<void>;
  
  /** Reset password with OTP */
  resetPassword: (email: string, otp: string, password: string) => Promise<void>;
  
  /** Resend OTP */
  resendOtp: (email: string, type: 'verification' | 'password_reset') => Promise<void>;
  
  /** Refresh access token */
  refreshAccessToken: () => Promise<boolean>;
  
  /** Get current user profile */
  fetchMe: () => Promise<void>;
  
  /** Logout */
  logout: () => Promise<void>;
  
  /** Update local user data */
  setUser: (user: User) => void;

  /** Check if authenticated */
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      login: async (email, password) => {
        const data = await api.post<{
          accessToken: string;
          refreshToken: string;
          user: User;
        }>('/auth/login', { email, password });

        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
      },

      register: async (name, email, password) => {
        await api.post('/auth/register', { name, email, password });
        // Does NOT set tokens — user must verify email first
      },

      verifyEmail: async (email, otp) => {
        const data = await api.post<{
          accessToken: string;
          refreshToken: string;
          user: User;
        }>('/auth/verify-email', { email, otp });

        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
      },

      loginWithGoogle: async (idToken, name, email, avatarUrl, googleId) => {
        const data = await api.post<{
          accessToken: string;
          refreshToken: string;
          user: User;
        }>('/auth/google', { idToken, name, email, avatarUrl, googleId });

        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
      },

      forgotPassword: async (email) => {
        await api.post('/auth/forgot-password', { email });
      },

      verifyResetOtp: async (email, otp) => {
        await api.post('/auth/verify-reset-otp', { email, otp });
      },

      resetPassword: async (email, otp, password) => {
        await api.post('/auth/reset-password', { email, otp, password });
      },

      resendOtp: async (email, type) => {
        await api.post('/auth/resend-otp', { email, type });
      },

      refreshAccessToken: async () => {
        const { refreshToken: token } = get();
        if (!token) return false;

        try {
          const data = await api.post<{
            accessToken: string;
            refreshToken: string;
          }>('/auth/refresh', { refreshToken: token });

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          return true;
        } catch {
          // Refresh failed → force logout
          set({ accessToken: null, refreshToken: null, user: null });
          return false;
        }
      },

      fetchMe: async () => {
        const data = await api.get<User>('/auth/me');
        set({ user: data });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch { /* ignore if fails */ }
        set({ accessToken: null, refreshToken: null, user: null });
      },

      setUser: (user) => set({ user }),

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'dapurgizi-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
