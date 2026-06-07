import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    const { accessToken, role, userId, studentId, name } = res.data;
    const u = {id: userId,studentId,name,role};
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await registerApi(data);
    const { accessToken, role, userId, studentId, name } = res.data;
    const u = { id: userId,studentId ,name, role };
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user?.role === 'admin', isFaculty: user?.role === 'faculty', isStudent: user?.role === 'student' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
