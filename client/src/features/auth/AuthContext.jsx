import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authService.js';
import { homeFor, userIdFromPath } from './userPaths.js';

export const AuthContext = createContext(null);

// There are no sessions: the user id in the address says who is using the app (see userPaths.js).
// Logging in finds the account and opens that user's pages; the profile is then loaded from the id in the URL.
export function AuthProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = userIdFromPath(location.pathname);
  const [user, setUser] = useState(null);
  const [missing, setMissing] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setMissing(false);
    if (!userId) return setUser(null);
    if (user?.id === userId) return undefined;
    let active = true;
    let retry = null;
    authService
      .fetchMe()
      .then((found) => active && setUser(found))
      .catch((err) => {
        if (!active) return;
        setUser(null);
        // 401: no account has this id (for example it was registered before the server restarted).
        if (err.status === 401) setMissing(true);
        // Anything else: the server is probably still waking up, so try again shortly.
        else retry = setTimeout(() => setAttempt((n) => n + 1), 2000);
      });
    return () => {
      active = false;
      clearTimeout(retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, attempt]);

  const open = useCallback((nextUser) => {
    setUser(nextUser);
    navigate(homeFor(nextUser), { replace: true });
    return nextUser;
  }, [navigate]);

  const login = useCallback((phone, password) => authService.login(phone, password).then(open), [open]);
  const register = useCallback((details) => authService.register(details).then(open), [open]);
  const logout = useCallback(() => navigate('/login'), [navigate]);

  // Lets profile edits show straight away.
  const refreshUser = useCallback((nextUser) => setUser(nextUser), []);

  const current = user?.id === userId ? user : null;
  const checking = Boolean(userId) && !current && !missing;
  const value = useMemo(() => ({ user: current, checking, missing, login, register, logout, refreshUser }), [current, checking, missing, login, register, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
