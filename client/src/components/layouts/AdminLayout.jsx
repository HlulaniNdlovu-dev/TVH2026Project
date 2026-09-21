import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../Icon.jsx';
import Logo from '../Logo.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { useToast } from '../Toast.jsx';
import * as adminService from '../../services/adminService.js';

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/grid', label: 'Live Grid Map', icon: 'map' },
  { to: '/admin/incidents', label: 'Incidents', icon: 'alert' },
  { to: '/admin/dispatch', label: 'Dispatch Board', icon: 'tasks' },
  { to: '/admin/technicians', label: 'Technicians', icon: 'truck' },
  { to: '/admin/loadshedding', label: 'Loadshedding', icon: 'bolt' },
  { to: '/admin/sensors', label: 'Sensors', icon: 'sensor' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/admin/audit', label: 'Audit Log', icon: 'shield' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const location = useLocation();

  const reset = async () => {
    if (!window.confirm('Reset all demo data (accounts you registered, incidents, notifications) back to the seed state?')) return;
    try {
      await adminService.resetDemo();
      toast('Demo data reset');
      window.location.reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="a-shell">
      {open && <div className="a-scrim" onClick={() => setOpen(false)} />}
      <aside className={`a-sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><Logo size={36} /></div>
        <nav className="a-nav" aria-label="Admin">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive || (link.to === '/admin/incidents' && location.pathname.startsWith('/admin/incidents')) ? 'active' : '')}>
              <Icon name={link.icon} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="foot">
          <div className="small"><strong>{user.name}</strong><div className="muted">Municipal administrator</div></div>
          <button type="button" className="btn btn-outline btn-sm" onClick={reset}><Icon name="refresh" size={16} /> Reset demo data</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}><Icon name="logout" size={16} /> Log out</button>
        </div>
      </aside>
      <main className="a-main">
        <button type="button" className="btn btn-outline btn-sm a-menu-btn" style={{ marginBottom: 12 }} onClick={() => setOpen(true)}>
          <Icon name="menu" size={18} /> Menu
        </button>
        <Outlet />
      </main>
    </div>
  );
}
