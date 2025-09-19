import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

interface AuthResponse {
  user_id: string;
  auth_token: string;
  refresh_token: string;
  user_data?: any;
  requires_verification?: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
}

// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, teacherCode?: string) => Promise<AuthResponse>; // Fixed return type
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('regod_access_token');
      if (token) {
        // Try to get user profile to verify token is valid
        const profile = await ApiService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      // Token invalid or expired
      await AsyncStorage.removeItem('regod_access_token');
      await AsyncStorage.removeItem('regod_refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await ApiService.login({
        identifier: email,
        password,
      });
      
      if (response.user_data) {
        setUser(response.user_data);
      } else {
        // Get profile if user_data not included
        const profile = await ApiService.getProfile();
        setUser(profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, teacherCode?: string): Promise<AuthResponse> => {
  try {
    setError(null);
    setLoading(true);
    
    const registerData = {
      email,
      password,
      name,
      ...(teacherCode && { teacher_code: teacherCode }),
    };
    
    const response = await ApiService.register(registerData);
    
    // Get profile after registration
    try {
      const profile = await ApiService.getProfile();
      setUser(profile);
    } catch (profileError) {
      // If profile fetch fails, set basic user info from response
      setUser({
        id: response.user_id,
        email,
        name,
        role: 'student',
        verified: !response.requires_verification,
      });
    }
    
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
      await ApiService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
