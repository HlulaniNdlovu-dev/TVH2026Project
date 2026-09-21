import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../../services/authService.js';
import { clearStoredUser, getStoredUser, setStoredUser } from '../../utils/storage.js';

export const AuthContext = createContext(null);

export const homeForRole = (role) =>
  ({ citizen: '/citizen/dashboard', technician: '/technician/dashboard', admin: '/admin/dashboard' }[role] ?? '/login');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [checking, setChecking] = useState(Boolean(getStoredUser()));

  // On start, confirm the saved session is still valid on the server.
  useEffect(() => {
    if (!getStoredUser()) return;
    authService
      .fetchMe()
      .then((fresh) => {
        setStoredUser(fresh);
        setUser(fresh);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const signIn = useCallback((nextUser) => {
    setStoredUser(nextUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback((phone, password) => authService.login(phone, password).then(signIn), [signIn]);
  const register = useCallback((details) => authService.register(details).then(signIn), [signIn]);

  const logout = useCallback(() => {
    clearStoredUser();
    setUser(null);
  }, []);

  // Lets profile edits update the copy kept in localStorage.
  const refreshUser = useCallback((nextUser) => signIn(nextUser), [signIn]);

  const value = useMemo(() => ({ user, checking, login, register, logout, refreshUser }), [user, checking, login, register, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
