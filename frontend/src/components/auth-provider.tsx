// Auth Provider Component
import React, { useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useApi';
import { authApi } from '../services/authService';
import { Loader2 } from 'lucide-react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';

interface AuthProviderProps {
  children: ReactNode;
}

let renderCount = 0;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  renderCount++;
  console.log(`[AuthProvider Render #${renderCount}] START =========================`);

  const navigate = useNavigate();
  const location = useLocation();

  // Destructure from Zustand store with clearer names
  const {
    user: storeUser,
    isAuthenticated: storeIsAuthenticated,
    isLoading: isStoreLoading, // True while Zustand is rehydrating
    logoutAction: storeLogoutAction,
    setUserAction: storeSetUserAction,
  } = useAuthStore();

  console.log(`[AuthProvider Render #${renderCount}] Store state:`, {
    storeUser,
    storeIsAuthenticated,
    isStoreLoading,
  });
  // Removed immediate localStorage logging here, as it's in effects now.

  // Fetch user profile - useAuth enabled only when storeIsAuthenticated is true initially (or token exists)
  // The `useAuth` hook itself should handle the enabled condition based on token/initial auth state.
  const { 
    data: profileData, 
    error: profileError,
    status: profileStatus, // 'pending', 'success', 'error'
    isLoading: isProfileQueryLoading, // isLoading from React Query for the profile fetch
  } = useAuth(); // useAuth internally calls authApi.getProfile

  console.log(`[AuthProvider Render #${renderCount}] useAuth() hook state:`, {
    profileData,
    profileError,
    profileStatus,
    isProfileQueryLoading
  });

  // isLoadingUI: True if store is hydrating, or if we are authenticated and fetching profile.
  const isLoadingUI = isStoreLoading || (storeIsAuthenticated && isProfileQueryLoading);

  console.log(`[AuthProvider Render #${renderCount}] Derived isLoadingUI:`, isLoadingUI);

  // Effect to handle results of profile fetching
  useEffect(() => {
    console.log(`[AuthProvider Effect - ProfileResult] Status: ${profileStatus}, ProfileData:`, profileData, "StoreUser:", storeUser);
    console.log(`[AuthProvider Effect - ProfileResult] localStorage snapshot:`, {
      authToken: localStorage.getItem('authToken'), userItem: localStorage.getItem('user'), authStorage: localStorage.getItem('auth-storage')
    });

    if (profileStatus === 'success') {
      // Profile fetched successfully (profileData can be User or null)
      // setUserAction updates store and localStorage.user
      if (profileData !== storeUser) { // Only update if different
        console.log('[AuthProvider Effect - ProfileResult] Profile data received. Updating store user.', profileData);
        storeSetUserAction(profileData);
      }
    } else if (profileStatus === 'error') {
      console.error('[AuthProvider Effect - ProfileResult] Error fetching profile:', profileError);
      if (profileError instanceof ApiError && profileError.status === 401) {
        console.log('[AuthProvider Effect - ProfileResult] Profile fetch returned 401. Logging out.');
        authApi.logout(); // Clear localStorage items (token, user)
        storeLogoutAction(); // Clear Zustand store
        // Redirect will be handled by the redirect effect due to storeIsAuthenticated changing
      } else {
        // For other errors (e.g., 500, network error), we might not want to log out immediately.
        // If the session was previously valid, a temporary server issue shouldn't kill the session.
        // However, if profileData becomes null due to this, storeSetUserAction(null) could be called if desired.
        // For now, only 401 explicitly logs out. The frontend will show previously authenticated state until token expires or is cleared.
        console.warn('[AuthProvider Effect - ProfileResult] Non-401 error during profile fetch. User state not changed by this error directly.', profileError);
      }
    }
  }, [profileStatus, profileData, profileError, storeUser, storeSetUserAction, storeLogoutAction]);

  // Effect for handling redirects
  useEffect(() => {
    const currentPath = location.pathname;
    // Wait for store hydration to finish before any redirect logic
    if (isStoreLoading) {
      console.log('[AuthProvider Effect - Redirect] Store is hydrating. No redirect actions yet.');
      return;
    }
    console.log(`[AuthProvider Effect - Redirect] Running. StoreAuth: ${storeIsAuthenticated}, UI Load: ${isLoadingUI}, Path: ${currentPath}`);
    console.log(`[AuthProvider Effect - Redirect] localStorage snapshot:`, {
      authToken: localStorage.getItem('authToken'), userItem: localStorage.getItem('user'), authStorage: localStorage.getItem('auth-storage')
    });

    const publicRoutes = ['/login', '/register', '/arduino-demo'];
    const isPublicRoute = publicRoutes.includes(currentPath);

    if (!storeIsAuthenticated && !isPublicRoute) {
      console.log(`[AuthProvider Effect - Redirect] Not authenticated and on protected route. Navigating to /login. Path: ${currentPath}`);
      navigate('/login');
    } else if (storeIsAuthenticated && currentPath === '/login' || currentPath === '/register') {
      // If authenticated and on login/register, redirect to dashboard
      console.log(`[AuthProvider Effect - Redirect] Authenticated on login/register page. Navigating to /dashboard. Path: ${currentPath}`);
      navigate('/dashboard');
    }
  }, [storeIsAuthenticated, isStoreLoading, isLoadingUI, location.pathname, navigate]);

  // Logout function for AuthContext consumers
  const contextLogout = useCallback(() => {
    console.log('[AuthProvider ContextLogout] User initiated logout.');
    authApi.logout(); // Clear localStorage (token and user)
    storeLogoutAction(); // Clear Zustand store
    // navigate('/login'); // Redirect is handled by the useEffect hook when storeIsAuthenticated changes
  }, [storeLogoutAction, navigate]); // navigate was removed from deps as redirect effect handles it

  // Early return for fully public demo routes to bypass auth logic/loading UI
  const demoPublicRoutes = ['/arduino-demo'];
  if (demoPublicRoutes.includes(location.pathname) && !storeIsAuthenticated) { // Only bypass if not authenticated
    console.log(`[AuthProvider Render #${renderCount}] Rendering unprotected /arduino-demo directly.`);
    console.log(`[AuthProvider Render #${renderCount}] END ===========================`);
    return <>{children}</>;
  }

  if (isLoadingUI) {
    console.log(`[AuthProvider Render #${renderCount}] Showing loading spinner (UI).`);
    console.log(`[AuthProvider Render #${renderCount}] END ===========================`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  console.log(`[AuthProvider Render #${renderCount}] Rendering children. Context:`, { storeIsAuthenticated, isLoadingUI, storeUser });
  console.log(`[AuthProvider Render #${renderCount}] END ===========================`);

  const contextValue: AuthContextType = {
    isAuthenticated: storeIsAuthenticated,
    isLoading: isLoadingUI, //isLoadingUI is the combined one for consumers
    user: storeUser,
    logout: contextLogout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
