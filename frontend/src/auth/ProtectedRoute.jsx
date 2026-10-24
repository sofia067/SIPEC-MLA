import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-600">Verificando sesión...</div>;
  }

  return user ? children : <Navigate to="/" replace />;
}
