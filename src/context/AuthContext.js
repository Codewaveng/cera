import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser, loginUser, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on app start
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('cera_token');
        if (saved) {
          setToken(saved);
          const res = await getMe();
          setUser(res.data.user);
        }
      } catch {
        await AsyncStorage.removeItem('cera_token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function register(data) {
    const res = await registerUser(data);
    const { token: t, user: u } = res.data;
    await AsyncStorage.setItem('cera_token', t);
    setToken(t);
    setUser(u);
    return u;
  }

  async function login(email, password) {
    const res = await loginUser({ email, password });
    const { token: t, user: u } = res.data;
    await AsyncStorage.setItem('cera_token', t);
    setToken(t);
    setUser(u);
    return u;
  }

  async function logout() {
    await AsyncStorage.removeItem('cera_token');
    setToken(null);
    setUser(null);
  }

  function refreshUser(updatedUser) {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
