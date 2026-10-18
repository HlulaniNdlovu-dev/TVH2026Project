import { Link, Navigate, Outlet } from 'react-router-dom';
import { homeFor } from './userPaths.js';
import { useAuth } from './useAuth.js';
import Spinner from '../../components/Spinner.jsx';
import Banner from '../../components/Banner.jsx';

// Loads the user named in the URL, and sends people with the wrong role to their own home page.
export default function ProtectedRoute({ role }) {
  const { user, checking, missing } = useAuth();
  if (checking) return <Spinner />;
  if (missing || !user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Banner tone="warn">This account was not found. The demo data may have been reset.</Banner>
          <Link className="btn btn-block" style={{ marginTop: 16 }} to="/login">Go to login</Link>
        </div>
      </div>
    );
  }
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}
