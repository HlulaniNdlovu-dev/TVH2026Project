import { Outlet } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { useTheme } from '../../features/theme/ThemeContext.jsx';

// Landing, login and register. Uses the app-wide theme, so switching here also switches the portals.
export default function OnboardingLayout() {
  const { theme, toggle } = useTheme();
  return (
    <div className="pl-onb" data-theme={theme}>
      <Outlet />
      <ThemeToggle theme={theme} onToggle={toggle} />
    </div>
  );
}
