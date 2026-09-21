import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { MetaProvider } from './features/meta/MetaContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MetaProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </MetaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
