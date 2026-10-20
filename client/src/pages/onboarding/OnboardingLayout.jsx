import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle.jsx';

// Onboarding-only theme shell. Deliberately separate from the app's global design
// tokens so the citizen/technician/admin dashboards are unaffected.
const STORAGE_KEY = 'pl_theme';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage blocked: fall through to system preference */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export default function OnboardingLayout() {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage blocked: the toggle still works for this page view */
      }
      return next;
    });
  }, []);

  return (
    <div className="pl-onb" data-theme={theme}>
      <Outlet />
      <ThemeToggle theme={theme} onToggle={toggle} />
    </div>
  );
}