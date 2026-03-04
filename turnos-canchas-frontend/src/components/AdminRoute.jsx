import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { user, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) { // ← Esta función ya valida admin O superadmin
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto'
      }}>
        <h2>🔒 Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p>Esta área es solo para administradores.</p>
        <button 
          onClick={() => window.history.back()}
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
          Volver
        </button>
      </div>
    );
  }

  return children;
}

export default AdminRoute;