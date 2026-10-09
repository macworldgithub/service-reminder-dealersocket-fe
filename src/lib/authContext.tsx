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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {}
    }
    return null;
  });

  const [dealerships, setDealerships] = useState<Dealership[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('dealerships');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  const [activeDealership, setActiveDealershipState] = useState<Dealership | null>(() => {
    if (typeof window === 'undefined') return null;
    const storedActive = localStorage.getItem('activeDealership');
    if (storedActive) {
      try {
        return JSON.parse(storedActive);
      } catch {}
    }
    const storedDealershipId = localStorage.getItem('activeDealershipId');
    const storedList = localStorage.getItem('dealerships');
    if (storedDealershipId && storedList) {
      try {
        const list = JSON.parse(storedList);
        return list.find((d: any) => d._id === storedDealershipId) || null;
      } catch {}
    }
    return null;
  });

  // If user and token already exist in localStorage, start with isLoading = false immediately (0ms wait)
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    return !(storedToken && storedUser);
  });

  const fetchDealerships = async () => {
    try {
      const res = await api.get('/dealerships');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const list: Dealership[] = res.data.data;
        setDealerships(list);
        localStorage.setItem('dealerships', JSON.stringify(list));

        const storedDealershipId = localStorage.getItem('activeDealershipId');
        const found =
          list.find((d: Dealership) => d._id === storedDealershipId) ||
          list.find((d: Dealership) => d.code === 'SMH-01') ||
          list[0];

        if (found) {
          setActiveDealershipState(found);
          localStorage.setItem('activeDealershipId', found._id);
          localStorage.setItem('activeDealership', JSON.stringify(found));
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
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Revalidate profile and dealerships in background without blocking the UI
      try {
        await Promise.all([refreshProfile(), fetchDealerships()]);
      } catch (err) {
        console.error('Background auth sync error', err);
      } finally {
        setIsLoading(false);
      }
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
    localStorage.removeItem('activeDealershipId');
    localStorage.removeItem('activeDealership');
    localStorage.removeItem('dealerships');
    setUser(null);
    setActiveDealershipState(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const setActiveDealership = (dealership: Dealership) => {
    setActiveDealershipState(dealership);
    localStorage.setItem('activeDealershipId', dealership._id);
    localStorage.setItem('activeDealership', JSON.stringify(dealership));
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
