import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRole({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user?.role) ? children : <Navigate to="/dashboard" replace />;
}
