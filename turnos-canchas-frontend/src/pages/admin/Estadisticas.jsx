import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { dashboardService } from '../../services/dashboardService';
import '../../styles/AdminDashboard.css';

function Estadisticas() {
  const [stats, setStats] = useState({
    totalCanchas: 0,
    totalTurnos: 0,
    totalClientes: 0,
    turnosPendientes: 0,
    ingresosMes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
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
      setError('Error al cargar las estadísticas');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/admin')} className="btn-primary">
          Volver al Panel
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <h1>Estadísticas Generales</h1>
        </div>
        <div className="header-right">
          <span className="admin-name">Admin: {user?.name}</span>
          <button onClick={() => navigate('/admin')} className="btn-logout" style={{marginRight: '10px'}}>
            Volver
          </button>
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
      </div>
    </div>
  );
}

export default Estadisticas;
