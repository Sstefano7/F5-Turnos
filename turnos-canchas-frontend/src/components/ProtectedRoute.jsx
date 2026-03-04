import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 1. Protector genérico (Para cualquier usuario logueado. ¡El que ya tenías!)
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>;
  }

  // Agregamos () porque en tu contexto es una función
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 2. Protector para el Panel de Admin (Deja entrar a Admin y Super Admin)
export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />; // Lo saca si no tiene los permisos
  }

  return children;
}

// 3. Protector EXCLUSIVO para Super Admin
export function SuperAdminRoute({ children }) {
  const { isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>;
  }

  if (!isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />; // Lo devuelve al panel de admin normal
  }

  return children;
}

export default ProtectedRoute;