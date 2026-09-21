import { Navigate, Outlet } from 'react-router-dom';
import { homeForRole } from './AuthContext.jsx';
import { useAuth } from './useAuth.js';
import Spinner from '../../components/Spinner.jsx';

// Sends visitors to login, and people with the wrong role to their own home page.
export default function ProtectedRoute({ role }) {
  const { user, checking } = useAuth();
  if (checking) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homeForRole(user.role)} replace />;
  return <Outlet />;
}
