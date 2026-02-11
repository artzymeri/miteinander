'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'support' | 'care_giver' | 'care_recipient';
  profileImageUrl?: string | null;
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled' | 'none' | 'expired';
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string; code?: string; data?: { email?: string }; subscriptionRequired?: boolean }>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfileImage: (imageUrl: string | null) => void;
  updateSubscriptionStatus: (status: string) => void;
  handleUnauthorized: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const { token: newToken, user: userData, role, subscriptionStatus, trialEndsAt, subscriptionEndsAt, subscriptionRequired } = data.data;
        const userWithRole = { ...userData, role, subscriptionStatus, trialEndsAt, subscriptionEndsAt };
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userWithRole));
        
        setToken(newToken);
        setUser(userWithRole);
        
        return { success: true, role, subscriptionRequired: !!subscriptionRequired };
      } else {
        return { success: false, error: data.error?.message || 'Login failed', code: data.error?.code, data: data.error?.data };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Auto-logout on 401 — called when any API returns unauthorized
  const handleUnauthorized = useCallback(() => {
    // Only act if currently logged in to avoid redirect loops
    if (!token && !localStorage.getItem('token')) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [token, router]);

  // Global fetch interceptor: automatically detect 401 responses
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        // Only auto-logout for our API calls, not third-party requests
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
        if (url.includes('/api/') && !url.includes('/api/auth/login')) {
          handleUnauthorized();
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [handleUnauthorized]);

  const updateProfileImage = (imageUrl: string | null) => {
    if (user) {
      const updatedUser = { ...user, profileImageUrl: imageUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updateSubscriptionStatus = (status: string) => {
    if (user) {
      const updatedUser = { ...user, subscriptionStatus: status as User['subscriptionStatus'] };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        updateProfileImage,
        updateSubscriptionStatus,
        handleUnauthorized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
