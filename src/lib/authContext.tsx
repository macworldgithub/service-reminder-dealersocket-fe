'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { User, Dealership } from './types';

interface AuthContextType {
  user: User | null;
  dealerships: Dealership[];
  activeDealership: Dealership | null;
  setActiveDealership: (dealership: Dealership) => void;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [activeDealership, setActiveDealershipState] = useState<Dealership | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDealerships = async () => {
    try {
      const res = await api.get('/dealerships');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDealerships(res.data.data);
        const storedDealershipId = localStorage.getItem('activeDealershipId');
        const found =
          res.data.data.find((d: Dealership) => d._id === storedDealershipId) ||
          res.data.data.find((d: Dealership) => d.code === 'SMH-01') ||
          res.data.data[0];

        if (found) {
          setActiveDealershipState(found);
          localStorage.setItem('activeDealershipId', found._id);
        }
      }
    } catch (err) {
      console.error('Failed to load dealerships', err);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {}
      }

      if (storedToken) {
        await Promise.all([refreshProfile(), fetchDealerships()]);
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    fetchDealerships();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const setActiveDealership = (dealership: Dealership) => {
    setActiveDealershipState(dealership);
    localStorage.setItem('activeDealershipId', dealership._id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dealerships,
        activeDealership,
        setActiveDealership,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
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
