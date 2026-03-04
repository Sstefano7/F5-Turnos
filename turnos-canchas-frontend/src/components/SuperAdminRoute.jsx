import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SuperAdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'superadmin') {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Acceso Denegado</h2>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          Esta sección requiere permisos de <strong>Super Administrador</strong>.
        </p>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '30px' }}>
          Por favor contacta al administrador del sistema si necesitas acceso.
        </p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          ← Volver
        </button>
      </div>
    );
  }

  return children;
}

export default SuperAdminRoute;