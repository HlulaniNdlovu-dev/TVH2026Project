import { NavLink, Outlet } from 'react-router-dom';
import Icon from '../Icon.jsx';
import Logo from '../Logo.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { useUnreadCount } from '../../features/notifications/useUnreadCount.js';

const TABS = [
  { to: '/citizen/dashboard', label: 'Home', icon: 'home' },
  { to: '/citizen/report', label: 'Report', icon: 'alert' },
  { to: '/citizen/incidents', label: 'Incidents', icon: 'list' },
  { to: '/citizen/notifications', label: 'Alerts', icon: 'bell', badge: true },
  { to: '/citizen/profile', label: 'Profile', icon: 'user' },
];

export default function CitizenLayout() {
  const { user, logout } = useAuth();
  const unread = useUnreadCount();
  return (
    <div className="m-shell">
      <header className="m-topbar">
        <Logo size={30} />
        <div className="row">
          <span className="small muted">{user.name.split(' ')[0]}</span>
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
            {tab.badge && unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
