import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card center">
        <Logo size={40} />
        <h1>Page not found</h1>
        <p className="muted">That page does not exist.</p>
        <Link className="btn" to="/">Go to the start</Link>
      </div>
    </div>
  );
}
