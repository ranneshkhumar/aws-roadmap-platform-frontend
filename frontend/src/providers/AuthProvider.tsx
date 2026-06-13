'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { UserProfile, LoginDto, RegisterDto } from '@/services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    authService.logout();
    setUser(null);
    router.replace('/login');
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      localStorage.setItem('user', JSON.stringify(profile));
      setUser(profile);
    } catch (err) {
      console.error('Session validation failed, logging out:', err);
      logout();
    }
  };

  const login = async (dto: LoginDto) => {
    const res = await authService.login(dto);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const register = async (dto: RegisterDto) => {
    const res = await authService.register(dto);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
          await refreshProfile();
        } else {
          setUser(null);
          // Protect routes if guest is attempting to access protected layout/pages
          const isCoreRoute = pathname.startsWith('/core');
          const isRoadmapRoute = pathname.startsWith('/roadmap');
          const isLearnRoute = pathname.startsWith('/learn');
          if (isCoreRoute || isRoadmapRoute || isLearnRoute) {
            router.replace('/login');
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
