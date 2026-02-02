import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canchaService } from '../../services/canchaService';
import { turnoService } from '../../services/turnoService';
import { clienteService } from '../../services/clienteService';
import { pagoService } from '../../services/pagoService';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
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
  const { user, logout } = useAuth();
  const { refreshDashboard } = useDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, [refreshDashboard]);

  const fetchStats = async () => {
    try {
      const [canchas, turnos, clientes, pagos] = await Promise.all([
        canchaService.getAll(),
        turnoService.getAll(),
        clienteService.getAll(),
        pagoService.getAll()
      ]);

      const turnosPendientes = turnos.filter(t => t.estado === 'pendiente').length;
      
      // Calcular ingresos del mes actual basándose en pagos confirmados
      const mesActual = new Date().getMonth();
      
      const ingresosMes = pagos
        .filter(p => {
          const fechaPago = new Date(p.created_at || p.fecha);
          const mesDelPago = fechaPago.getMonth();
          return mesDelPago === mesActual && (p.estado === 'confirmado' || p.estado === 'completado');
        })
        .reduce((sum, p) => sum + parseFloat(p.monto), 0);

      setStats({
        totalCanchas: canchas.length,
        totalTurnos: turnos.length,
        totalClientes: clientes.length,
        turnosPendientes,
        ingresosMes
      });

      setLoading(false);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
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
              <h3>${stats.ingresosMes.toFixed(2)}</h3>
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