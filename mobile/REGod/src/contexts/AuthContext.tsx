import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import ApiService, { type User } from '../services/api';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

interface AuthResponse {
  user_id: string;
  auth_token: string;
  refresh_token: string;
  user_data?: any;
  requires_verification?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, teacherCode?: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  socialLogin: (provider: 'google' | 'apple' | 'facebook') => Promise<void>;
  refreshUserData: () => Promise<void>;
  debugJWT: () => Promise<any>;
  migrateFromClerk: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Clerk hooks
  const { signOut, getToken } = useClerkAuth();
  const { user: clerkUser, isSignedIn } = useUser();

  useEffect(() => {
    checkAuthStatus();
    // Set up periodic token refresh check (every 5 minutes)
    const tokenRefreshInterval = setInterval(async () => {
      const token = await AsyncStorage.getItem('regod_access_token');
      if (token && ApiService.isTokenExpiringSoon(token, 10)) { // Refresh if expiring within 10 minutes
        console.log('Token expiring soon, refreshing proactively...');
        try {
          const newToken = await ApiService.refreshTokenIfNeeded();
          if (newToken) {
            console.log('Token refreshed successfully in background');
            // Re-validate user profile with new token
            const profile = await ApiService.getProfile();
            setUser(profile);
          }
        } catch (error) {
          console.error('Background token refresh failed:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(tokenRefreshInterval);
  }, []);

  // Sync with Clerk user state
  useEffect(() => {
    const syncClerkUser = async () => {
      if (isSignedIn && clerkUser) {
        setLoading(true);
        try {
          await syncUserWithClerk();
        } finally {
          setLoading(false);
        }
      } else if (!isSignedIn) {
        setUser(null);
        ApiService.clearTokens();
        setLoading(false);
      }
    };
    
    syncClerkUser();
  }, [isSignedIn, clerkUser]);

  // Check for stored tokens when component mounts or when Clerk state changes
  useEffect(() => {
    if (isSignedIn && clerkUser && !user) {
      checkAuthStatus();
    }
  }, [isSignedIn, clerkUser, user]);

  const checkAuthStatus = async () => {
    if (loading) return; // Prevent multiple simultaneous calls

    try {
      setLoading(true);
      
      // First, check if we have stored user data (fastest check)
      const storedUserData = await AsyncStorage.getItem('regod_user_data');
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          console.log('User loaded from stored data');
        } catch (e) {
          console.log('Failed to parse stored user data');
        }
      }
      
      // Check for JWT tokens (priority)
      const accessToken = await AsyncStorage.getItem('regod_access_token');
      if (accessToken) {
        try {
          // Try to get user profile to verify token is still valid
          const profile = await ApiService.getProfile();
          setUser(profile);
          await AsyncStorage.setItem('regod_user_data', JSON.stringify(profile));
          console.log('User authenticated with JWT tokens');
          return;
        } catch (error: any) {
          console.log('JWT token invalid, clearing and checking other auth methods:', error.message);
          // Clear invalid JWT tokens
          await AsyncStorage.removeItem('regod_access_token');
          await AsyncStorage.removeItem('regod_refresh_token');
        }
      }

      // Check for refresh token
      const refreshToken = await AsyncStorage.getItem('regod_refresh_token');
      if (refreshToken) {
        try {
          console.log('Attempting to refresh access token...');
          const newToken = await ApiService.refreshTokenIfNeeded();
          if (newToken) {
            const profile = await ApiService.getProfile();
            setUser(profile);
            await AsyncStorage.setItem('regod_user_data', JSON.stringify(profile));
            console.log('User authenticated with refreshed token');
            return;
          }
        } catch (error) {
          console.log('Token refresh failed:', error);
          await AsyncStorage.removeItem('regod_refresh_token');
        }
      }

      // Fallback to Clerk if signed in (for migration)
      if (isSignedIn && clerkUser) {
        console.log('No valid JWT tokens, but Clerk is signed in - attempting migration...');
        try {
          await syncUserWithClerk();
          return;
        } catch (error) {
          console.log('Clerk sync failed:', error);
          // If migration fails, still try to use Clerk token directly
          try {
            const profile = await ApiService.getProfile();
            setUser(profile);
            await AsyncStorage.setItem('regod_user_data', JSON.stringify(profile));
            console.log('Using Clerk token directly (migration failed)');
            return;
          } catch (profileError) {
            console.log('Profile fetch with Clerk token also failed:', profileError);
          }
        }
      }

      // No valid authentication found
      console.log('No valid authentication found, clearing all data');
      setUser(null);
      await ApiService.clearTokens();
      await AsyncStorage.removeItem('regod_user_data');
      
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      await ApiService.clearTokens();
      await AsyncStorage.removeItem('regod_user_data');
    } finally {
      setLoading(false);
    }
  };

  const syncUserWithClerk = async () => {
    try {
      if (!clerkUser) return;

      const email = clerkUser.primaryEmailAddress?.emailAddress || '';

          // Prefer Clerk JWT (template) for backend API calls; fallback to session token
          let sessionToken: string | null = null;
          try {
            sessionToken = (await getToken({ template: 'regod-backend' } as any)) || null;
          } catch (e) {
            // Template token might not be available; fallback to session token
            sessionToken = (await getToken()) || null;
          }

          if (sessionToken) {
            await ApiService.setClerkToken(sessionToken);
            console.log('Clerk token obtained and stored');
          } else {
            console.warn('No Clerk token available from getToken');
          }

        // Try Clerk exchange first to get JWT tokens
        try {
          console.log('Attempting Clerk exchange to get JWT tokens...');
          const exchangeResponse = await ApiService.clerkExchange(email);
          
          // Store the JWT tokens from exchange
          await AsyncStorage.setItem('regod_access_token', exchangeResponse.auth_token);
          await AsyncStorage.setItem('regod_refresh_token', exchangeResponse.refresh_token);
          
          // Use the user data from exchange or fetch profile
          if (exchangeResponse.user_data) {
            setUser(exchangeResponse.user_data);
            await AsyncStorage.setItem('regod_user_data', JSON.stringify(exchangeResponse.user_data));
            console.log('User migrated to JWT tokens via Clerk exchange:', exchangeResponse.user_data);
          } else {
            // Fetch profile with new JWT token
            const profile = await ApiService.getProfile();
            setUser(profile);
            await AsyncStorage.setItem('regod_user_data', JSON.stringify(profile));
            console.log('User profile fetched after Clerk exchange:', profile);
          }
          
          // Clear Clerk token since we now have JWT tokens
          await AsyncStorage.removeItem('clerk_session_token');
          
        } catch (exchangeError) {
          console.error('Clerk exchange failed:', exchangeError);
          
          // Try direct profile fetch with Clerk token
          try {
            const profile = await ApiService.getProfile();
            setUser(profile);
            await AsyncStorage.setItem('regod_user_data', JSON.stringify(profile));
            console.log('User profile synced with Clerk token:', profile);
          } catch (profileError) {
            console.error('Profile fetch also failed:', profileError);

            // Final fallback to basic Clerk user data
            const clerkUserData = {
              id: clerkUser.id,
              email: email,
              name: clerkUser.fullName || `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'User',
              role: 'student',
              verified: clerkUser.emailAddresses.some(e => e.verification?.status === 'verified'),
            };

            setUser(clerkUserData);
            await AsyncStorage.setItem('regod_user_data', JSON.stringify(clerkUserData));
            console.log('Using fallback Clerk user data:', clerkUserData);
          }
        }
      
      // Store user data in AsyncStorage for offline access
      const userData = user || {
        id: clerkUser.id,
        email: email,
        name: clerkUser.fullName || `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
        role: 'student',
        verified: clerkUser.emailAddresses.some(e => e.verification?.status === 'verified'),
      };
      await AsyncStorage.setItem('regod_user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Error syncing user with Clerk:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Use the backend JWT authentication
      const response = await ApiService.login({
        identifier: email,
        password,
      });
      
      // Store tokens in AsyncStorage
      await AsyncStorage.setItem('regod_access_token', response.auth_token);
      await AsyncStorage.setItem('regod_refresh_token', response.refresh_token);
      
      if (response.user_data) {
        setUser(response.user_data);
        await AsyncStorage.setItem('regod_user_data', JSON.stringify(response.user_data));
      } else {
        // Get profile if user_data not included
        const profile = await ApiService.getProfile();
        setUser(profile);
        await AsyncStorage.setItem('regod_user_data', JSON.stringify(profile));
      }
      
      console.log('Login successful with JWT tokens');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, teacherCode?: string): Promise<AuthResponse> => {
    try {
      setError(null);
      setLoading(true);
      
      // Use backend JWT registration
      const registerData = {
        email,
        password,
        name,
        ...(teacherCode && { teacher_code: teacherCode }),
      };
      
      const response = await ApiService.register(registerData);
      
      // Store tokens in AsyncStorage
      await AsyncStorage.setItem('regod_access_token', response.auth_token);
      await AsyncStorage.setItem('regod_refresh_token', response.refresh_token);
      
      // Get profile after registration
      try {
        const profile = await ApiService.getProfile();
        setUser(profile);
        await AsyncStorage.setItem('regod_user_data', JSON.stringify(profile));
        
        // If teacher code was provided, use it after successful registration
        if (teacherCode) {
          try {
            await ApiService.useTeacherCode(teacherCode);
            // Refresh profile to get updated access
            const updatedProfile = await ApiService.getProfile();
            setUser(updatedProfile);
            await AsyncStorage.setItem('regod_user_data', JSON.stringify(updatedProfile));
          } catch (teacherCodeError) {
            console.warn('Teacher code could not be applied:', teacherCodeError);
            // Don't fail registration if teacher code is invalid
          }
        }
      } catch (profileError) {
        // If profile fetch fails, set basic user info from response
        const basicUser = {
          id: response.user_id,
          email,
          name,
          role: 'student',
          verified: !response.requires_verification,
        };
        setUser(basicUser);
        await AsyncStorage.setItem('regod_user_data', JSON.stringify(basicUser));
      }
      
      console.log('Registration successful with JWT tokens');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Sign out from Clerk if signed in
      if (isSignedIn) {
        await signOut();
      }
      
      // Clear all tokens and user data
      await ApiService.clearTokens();
      await AsyncStorage.removeItem('regod_user_data');
      setUser(null);
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      await ApiService.clearTokens();
      await AsyncStorage.removeItem('regod_user_data');
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      setError(null);
      setLoading(true);

      // For now, show a placeholder message until social login is fully implemented
      throw new Error(`${provider} login is not yet implemented. Please use email/password authentication.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${provider} login failed`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      await syncUserWithClerk();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const debugJWT = async () => {
    try {
      // Try different tokens for debugging
      const tokens = {
        access_token: await AsyncStorage.getItem('regod_access_token'),
        refresh_token: await AsyncStorage.getItem('regod_refresh_token'),
        clerk_session_token: await AsyncStorage.getItem('clerk_session_token'),
      };
      
      console.log('Available tokens:', Object.keys(tokens).filter(key => tokens[key as keyof typeof tokens]));
      
      // Debug the first available token
      for (const [tokenType, token] of Object.entries(tokens)) {
        if (token) {
          console.log(`Debugging ${tokenType}...`);
          const result = await ApiService.debugJWTToken(token);
          console.log(`${tokenType} debug result:`, result);
          return { ...result, tokenType };
        }
      }
      
      console.log('No tokens found for debugging');
      return { error: 'No tokens found', success: false };
    } catch (error) {
      console.error('Debug JWT failed:', error);
      return { error: 'Debug failed', success: false };
    }
  };

  // Migration utility to help users move from Clerk to JWT
  const migrateFromClerk = async () => {
    try {
      console.log('Starting migration from Clerk to JWT...');
      
      if (!isSignedIn || !clerkUser) {
        console.log('No Clerk user to migrate');
        return false;
      }
      
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (!email) {
        console.log('No email found for Clerk user');
        return false;
      }
      
      // Try Clerk exchange
      const exchangeResponse = await ApiService.clerkExchange(email);
      
      // Store JWT tokens
      await AsyncStorage.setItem('regod_access_token', exchangeResponse.auth_token);
      await AsyncStorage.setItem('regod_refresh_token', exchangeResponse.refresh_token);
      
      // Update user data
      if (exchangeResponse.user_data) {
        setUser(exchangeResponse.user_data);
        await AsyncStorage.setItem('regod_user_data', JSON.stringify(exchangeResponse.user_data));
      }
      
      // Clear Clerk token
      await AsyncStorage.removeItem('clerk_session_token');
      
      console.log('Migration from Clerk to JWT completed successfully');
      return true;
      
    } catch (error) {
      console.error('Migration from Clerk failed:', error);
      return false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,  // Only consider user authenticated if we have user data
    loading,
    login,
    register,
    logout,
    error,
    clearError,
    socialLogin,
    refreshUserData,
    debugJWT,
    migrateFromClerk,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
