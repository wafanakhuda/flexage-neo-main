"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, UserResponse, Token } from '@/services/api';

// Re-export types for backward compatibility
export type User = UserResponse;
export type AuthToken = Token;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('flexage_token');
    const storedUser = localStorage.getItem('flexage_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('flexage_token');
        localStorage.removeItem('flexage_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Login request using the new API
      const tokenData = await authAPI.login({ username, password });
      
      // Store token in localStorage first so the interceptor can use it
      localStorage.setItem('flexage_token', tokenData.access_token);
      
      // Fetch user details (now with token available in localStorage)
      const userData = await authAPI.me();

      // Store user data in localStorage
      localStorage.setItem('flexage_user', JSON.stringify(userData));

      // Update state
      setToken(tokenData.access_token);
      setUser(userData);

      // Redirect based on role
      if (userData.role === 'student') {
        router.push('/student/dashboard');
      } else if (userData.role === 'configurator' || userData.role === 'admin') {
        router.push('/configure/flexagecomps');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Handle API error format
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('flexage_token');
    localStorage.removeItem('flexage_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
