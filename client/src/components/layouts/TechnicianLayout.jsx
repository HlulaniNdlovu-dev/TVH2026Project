import { NavLink, Outlet } from 'react-router-dom';
import Icon from '../Icon.jsx';
import Logo from '../Logo.jsx';
import { useAuth } from '../../features/auth/useAuth.js';

const TABS = [
  { to: '/technician/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/technician/history', label: 'History', icon: 'clock' },
];

export default function TechnicianLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="m-shell">
      <header className="m-topbar">
        <Logo size={30} />
        <div className="row">
          <span className="small muted">{user.name} · {user.employeeId}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout} aria-label="Log out">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </header>
      <main className="m-content">
        <Outlet />
      </main>
      <nav className="m-bottomnav" aria-label="Main">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={tab.icon} />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
