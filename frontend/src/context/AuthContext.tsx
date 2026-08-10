import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { User } from '../services/api';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('qr_inventory_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('qr_inventory_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('qr_inventory_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('qr_inventory_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Error al verificar sesión inicial:', err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: newToken, user: newUser } = res.data;

    localStorage.setItem('qr_inventory_token', newToken);
    localStorage.setItem('qr_inventory_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('qr_inventory_token');
    localStorage.removeItem('qr_inventory_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
