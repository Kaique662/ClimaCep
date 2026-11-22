import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from './api';

const TOKEN_KEY = 'climacep.jwt';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!saved) return;
        const current = await apiRequest('/api/users/me', { token: saved });
        if (active) { setUser(current); setToken(saved); }
      } catch (e) {
        console.info('Sessão anterior indisponível:', e.message);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const acceptAuth = useCallback(async (result) => {
    if (!result?.accessToken || !result?.user) throw new Error('Resposta de autenticação inválida.');
    await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await apiRequest('/api/auth/login', { method: 'POST', data: { email, password } });
    await acceptAuth(result);
  }, [acceptAuth]);

  const register = useCallback(async (name, email, password) => {
    const result = await apiRequest('/api/auth/register', { method: 'POST', data: { name, email, password } });
    await acceptAuth(result);
  }, [acceptAuth]);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateName = useCallback(async (name) => {
    const result = await apiRequest('/api/users/me', { token, method: 'PUT', data: { name } });
    setUser(result);
  }, [token]);

  const value = useMemo(() => ({ user, token, initializing, login, register, logout, updateName }),
    [user, token, initializing, login, register, logout, updateName]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve estar dentro de AuthProvider');
  return context;
}
