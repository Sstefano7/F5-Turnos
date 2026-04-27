import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AdminDashboard.css';

function AdminDashboard() {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <h1>Panel de Administración</h1>
        </div>
        <div className="header-right">
          <span className="admin-name">Admin: {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-menu">
          <h2>Gestión</h2>
          <div className="menu-grid">
            <button 
              className="menu-card"
              onClick={() => navigate('/admin/estadisticas')}
            >
              <div className="menu-icon">📊</div>
              <h3>Ver Estadísticas</h3>
              <p>Resumen de canchas, turnos e ingresos</p>
            </button>

            <button 
              className="menu-card"
              onClick={() => navigate('/admin/canchas')}
            >
              <div className="menu-icon">🏟️</div>
              <h3>Gestionar Canchas</h3>
              <p>Crear, editar y eliminar canchas</p>
            </button>

            <button 
              className="menu-card"
              onClick={() => navigate('/admin/turnos')}
            >
              <div className="menu-icon">📅</div>
              <h3>Gestionar Turnos</h3>
              <p>Ver y administrar todas las reservas</p>
            </button>

            <button 
              className="menu-card"
              onClick={() => navigate('/admin/clientes')}
            >
              <div className="menu-icon">👥</div>
              <h3>Gestionar Clientes</h3>
              <p>Ver y administrar clientes</p>
            </button>

            <button 
              className="menu-card"
              onClick={() => navigate('/admin/horarios')}
            >
              <div className="menu-icon">🕐</div>
              <h3>Gestionar Horarios</h3>
              <p>Configurar horarios disponibles</p>
            </button>
          
            <button
              className="menu-card"
              onClick={() => navigate('/admin/pagos')} 
            >
              <div className="menu-icon">💰</div>
              <h3>Gestionar Pagos</h3>
              <p>Ver y administrar pagos</p>
            </button>

           {isSuperAdmin() && (
            <button 
              className="menu-card super-admin-card"
              onClick={() => navigate('/admin/bug-reports')}
            >
              <div className="menu-icon">⚠️</div>
              <h3>Reportes de Errores</h3>
              <p>Ver y gestionar reportes</p>
              <span className="superadmin-badge">Super Admin</span>
            </button>
          )}
            
          </div> 
        </div>

        <div className="quick-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/')}
          >
            Ver Sitio Público
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;