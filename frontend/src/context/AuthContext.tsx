import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'COMMITTEE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  institution?: string | null;
  department?: string | null;
  academicStanding?: string | null;
  avatarUrl?: string | null;
  consentAgreed?: boolean;
  notifyNewReview?: boolean;
  notifyDeadlineApproaching?: boolean;
  notifyDisputeStatusChange?: boolean;
  timezone?: string | null;
  dataRequestStatus?: string | null;
  profileComplete?: boolean;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserState: (updated: Partial<User>) => void;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: Role;
  institution: string;
  department: string;
  consentAgreed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get<User>('/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiClient.post<User>('/auth/login', { email, password });
    setUser(res.data);
    return res.data;
  };

  const register = async (data: RegisterPayload): Promise<User> => {
    const res = await apiClient.post<User>('/auth/register', data);
    setUser(res.data);
    return res.data;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const updateUserState = (updated: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updated } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateUserState }}>
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
