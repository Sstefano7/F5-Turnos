import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { dashboardService } from '../../services/dashboardService';
import '../../styles/AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCanchas: 0,
    totalTurnos: 0,
    totalClientes: 0,
    turnosPendientes: 0,
    ingresosMes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout, isSuperAdmin } = useAuth();
  const { refreshDashboard } = useDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, [refreshDashboard]);

  const fetchStats = async () => {
    try {
      const statsData = await dashboardService.getStats();
      setStats({
        totalCanchas: statsData?.totalCanchas || 0,
        totalTurnos: statsData?.totalTurnos || 0,
        totalClientes: statsData?.totalClientes || 0,
        turnosPendientes: statsData?.turnosPendientes || 0,
        ingresosMes: statsData?.ingresosMes || 0
      });
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('Error al cargar las estadísticas del dashboard');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Cargando panel de administración...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver al Inicio
        </button>
      </div>
    );
  }

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
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">🏟️</div>
            <div className="stat-info">
              <h3>{stats.totalCanchas}</h3>
              <p>Canchas</p>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>{stats.totalTurnos}</h3>
              <p>Turnos Totales</p>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>{stats.turnosPendientes}</h3>
              <p>Turnos Pendientes</p>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalClientes}</h3>
              <p>Clientes</p>
            </div>
          </div>

          <div className="stat-card red">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>${(stats.ingresosMes || 0).toFixed(2)}</h3>
              <p>Ingresos del Mes</p>
            </div>
          </div>
        </div>

        <div className="admin-menu">
          <h2>Gestión</h2>
          <div className="menu-grid">
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
              <div className="menu-icon">🐛</div>
              <h3>Reportes de Bugs</h3>
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