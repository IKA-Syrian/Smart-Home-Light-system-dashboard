// Authentication API Service
import { apiClient, ApiResponse, ApiError } from '../lib/api';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/api';

// apiConfig is removed as apiClient manages its own baseURL via VITE_API_URL

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/users/login', credentials);

    if (response.success && response.data?.token && response.data?.user) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } else {
      const errorMsg = response.error || response.message || 'Login failed: Invalid server response.';
      console.error('Login error in authService.ts:', errorMsg, 'Full API response:', response);
      throw new Error(errorMsg);
    }
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/users/register', userData);

    if (response.success && response.data?.token && response.data?.user) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } else {
      const errorMsg = response.error || response.message || 'Registration failed: Invalid server response.';
      console.error('Register error in authService.ts:', errorMsg, 'Full API response:', response);
      throw new Error(errorMsg);
    }
  },

  // Get current user profile
  getProfile: async (): Promise<User | null> => {
    try {
      // Expecting ApiResponse<User> from the backend for this route.
      const response = await apiClient.get<ApiResponse<User>>('/users/profile');
      console.log('[authService.getProfile] Raw response from /api/users/profile:', response);

      if (response.success && response.data) {
        // Successfully fetched profile
        return response.data;
      } else {
        // HTTP call was okay, but backend indicated not successful or data is missing
        console.warn('[authService.getProfile] Profile fetch was not successful or data missing in response:', response);
        return null;
      }
    } catch (error) {
      // This catches errors from apiClient.get (network errors, non-2xx status codes like 401, 500)
      // Also catches if response.json() fails in apiClient, though less likely for GET profile
      if (error instanceof ApiError && error.status === 401) {
        // Specifically for 401, it means the token is invalid or expired.
        // It's useful to not spam the console with "Error fetching profile" if it's just an expected 401.
        console.log('[authService.getProfile] Unauthorized (401) fetching profile. Token might be invalid or expired.');
      } else {
        console.error('[authService.getProfile] Error fetching profile (apiClient error or unexpected issue):', error);
      }
      // Re-throw the error so React Query or other callers can handle it (e.g., to update loading/error states)
      // For a 401, useAuth hook in AuthProvider will catch this and trigger logout.
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>('/users/profile', userData);

    if (response.success && response.data) {
      return response.data;
    } else {
      const errorMsg = response.error || response.message || 'Profile update failed: Invalid server response.';
      console.error('UpdateProfile error in authService.ts:', errorMsg, 'Full API response:', response);
      throw new Error(errorMsg);
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    // No API call needed for basic logout, just clear local storage.
    // If backend had session invalidation, it would be called here.
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Optionally, notify other parts of the app or clear other caches.
    console.log('[authService.logout] User logged out, token and user data cleared from localStorage.');
  },

  // Check if user is authenticated (basic check based on token presence)
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Get stored user data
  getStoredUser: (): User | null => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData) as User;
        // console.log('[authService.getStoredUser] Parsed user data:', parsedUser); // Kept for debugging if needed
        return parsedUser;
      } catch (e) {
        console.error("[authService.getStoredUser] Failed to parse stored user data. Removing item.", e);
        localStorage.removeItem('user'); // Remove corrupted item
        return null;
      }
    }
    // console.log('[authService.getStoredUser] No user data found in localStorage.'); // Kept for debugging
    return null;
  }
};
