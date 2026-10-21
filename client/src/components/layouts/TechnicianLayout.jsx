import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Icon from '../Icon.jsx';
import Logo from '../Logo.jsx';
import Spinner from '../Spinner.jsx';
import ThemeToggle from '../ThemeToggle.jsx';
import { useTheme } from '../../features/theme/ThemeContext.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { withUser } from '../../features/auth/userPaths.js';

const TABS = [
  { to: '/technician/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/technician/history', label: 'History', icon: 'clock' },
];

export default function TechnicianLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  return (
    <div className="m-shell">
      <header className="m-topbar">
        <Logo size={30} />
        <div className="row">
          <span className="small muted">{user.name} · {user.employeeId}</span>
          <ThemeToggle theme={theme} onToggle={toggle} inline />
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout} aria-label="Log out">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </header>
      {/* Only this area scrolls, and only it waits while a page loads, so the bars stay put. */}
      <main className="m-scroll">
        <div className="m-content">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <nav className="m-bottomnav" aria-label="Main">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={withUser(tab.to)} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={tab.icon} />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
