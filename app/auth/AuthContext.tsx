'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

// ✅ URL бэкенда
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Загружаем токен из localStorage при старте
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedToken = window.localStorage.getItem('wishlist_token');
      const storedUser = window.localStorage.getItem('wishlist_user');
      
      if (storedToken && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        console.log('✅ Токен загружен из localStorage');
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки токена:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ЛОГИН
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка входа');
      }

      const data = await response.json();
      const { access_token, user } = data;

      setUser(user);
      setToken(access_token);
      
      window.localStorage.setItem('wishlist_token', access_token);
      window.localStorage.setItem('wishlist_user', JSON.stringify(user));
      
      document.cookie = `wishlist_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
      
      console.log('✅ Успешный вход:', user.name);
    } catch (error) {
      console.error('❌ Ошибка входа:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ РЕГИСТРАЦИЯ
  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка регистрации');
      }

      const data = await response.json();
      const { access_token, user } = data;

      setUser(user);
      setToken(access_token);
      
      window.localStorage.setItem('wishlist_token', access_token);
      window.localStorage.setItem('wishlist_user', JSON.stringify(user));
      
      document.cookie = `wishlist_token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
      
      console.log('✅ Успешная регистрация:', user.name);
    } catch (error) {
      console.error('❌ Ошибка регистрации:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ВЫХОД
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('wishlist_token');
      window.localStorage.removeItem('wishlist_user');
      document.cookie = 'wishlist_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      console.log('✅ Выход выполнен');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}