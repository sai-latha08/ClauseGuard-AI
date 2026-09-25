import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clauseguard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('clauseguard_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('clauseguard_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('clauseguard_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data?.success) {
      const { token: receivedToken, ...userData } = res.data.data;
      setToken(receivedToken);
      setUser(userData);
      localStorage.setItem('clauseguard_token', receivedToken);
      localStorage.setItem('clauseguard_user', JSON.stringify(userData));
      return userData;
    }
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    if (res.data?.success) {
      const { token: receivedToken, ...userData } = res.data.data;
      setToken(receivedToken);
      setUser(userData);
      localStorage.setItem('clauseguard_token', receivedToken);
      localStorage.setItem('clauseguard_user', JSON.stringify(userData));
      return userData;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('clauseguard_token');
    localStorage.removeItem('clauseguard_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
