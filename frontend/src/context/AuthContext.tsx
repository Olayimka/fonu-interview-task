import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
  quickLoginAsAdmin: () => Promise<void>;
  quickLoginAsCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fonu_jwt_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('fonu_jwt_token');
      if (storedToken) {
        try {
          const res = await api.getProfile();
          setUser(res.user);
        } catch (error) {
          console.error('Session expired or invalid token:', error);
          localStorage.removeItem('fonu_jwt_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('fonu_jwt_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, password: string, role: Role = 'CUSTOMER') => {
    const res = await api.register(email, password, role);
    localStorage.setItem('fonu_jwt_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('fonu_jwt_token');
    setToken(null);
    setUser(null);
  };

  const quickLoginAsAdmin = async () => {
    await login('admin@fonu.com', 'admin123');
  };

  const quickLoginAsCustomer = async () => {
    await login('customer@fonu.com', 'customer123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        quickLoginAsAdmin,
        quickLoginAsCustomer,
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
