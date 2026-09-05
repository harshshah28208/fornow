import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dealflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dealflow_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('dealflow_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.error('Session verify failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('dealflow_token', res.data.token);
      localStorage.setItem('dealflow_user', JSON.stringify(res.data.user));
    }
    return res;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    if (res.data && res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('dealflow_token', res.data.token);
      localStorage.setItem('dealflow_user', JSON.stringify(res.data.user));
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dealflow_token');
    localStorage.removeItem('dealflow_user');
  };

  // Instant switch role helper for easy demo testing
  const switchRole = async (role) => {
    try {
      const res = await api.post('/auth/demo-switch', { role });
      if (res.data && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('dealflow_token', res.data.token);
        localStorage.setItem('dealflow_user', JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch (err) {
      console.error('Failed to switch demo role:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchRole,
        isAuthenticated: !!token && !!user,
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
