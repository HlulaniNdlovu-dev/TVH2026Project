import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// One light/dark setting for the whole app: landing, login and every portal share it.
// It lives on <html data-theme>, which switches the design tokens in tokens.css.
// The simulator keeps its own, separate setting (see useStoredTheme below).
const ThemeContext = createContext(null);
const APP_KEY = 'pl_theme';

// Light unless this browser chose dark before. Storage can be blocked, so every access is guarded.
function readTheme(key) {
  try {
    return localStorage.getItem(key) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function useStoredTheme(key) {
  const [theme, setTheme] = useState(() => readTheme(key));
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(key, next);
      } catch {
        /* storage blocked: the toggle still works until the page is reloaded */
      }
      return next;
    });
  }, [key]);
  return [theme, toggle];
}

export function ThemeProvider({ children }) {
  const [theme, toggle] = useStoredTheme(APP_KEY);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
