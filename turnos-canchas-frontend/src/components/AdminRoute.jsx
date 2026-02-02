import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return children;
}

export default AdminRoute;