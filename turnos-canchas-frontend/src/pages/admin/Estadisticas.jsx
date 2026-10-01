import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { dashboardService } from '../../services/dashboardService';
import '../../styles/Estadisticas.css';

function Estadisticas() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, logout } = useAuth();
  const { refreshDashboard } = useDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, [refreshDashboard]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Cargando métricas y estadísticas...</div>;
  }

  if (error || !stats) {
    return (
      <div className="estadisticas-container">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#ef4444', fontWeight: 600 }}>{error || 'Error al obtener datos'}</p>
          <button onClick={() => navigate('/admin')} className="btn-back-panel" style={{ margin: '16px auto 0 auto' }}>
            ← Volver al Panel
          </button>
        </div>
      </div>
    );
  }

  // Cálculos para gráficos
  const totalTurnos = stats.totalTurnos || 1;
  const estados = stats.turnosPorEstado || { confirmados: 0, pendientes: 0, completados: 0, cancelados: 0 };
  const deportes = stats.turnosPorTipo || { futbol5: 0, padel: 0 };
  const totalDeportes = (deportes.futbol5 + deportes.padel) || 1;
  const pctFutbol = Math.round((deportes.futbol5 / totalDeportes) * 100);
  const pctPadel = Math.round((deportes.padel / totalDeportes) * 100);

  // Máximo para escalar las barras de los últimos 7 días
  const actividad7Dias = stats.actividad7Dias || [];
  const maxCantidad = Math.max(...actividad7Dias.map(d => d.cantidad), 1);

  // Comparativa de ingresos mensual
  const diffIngresos = stats.ingresosMes - stats.ingresosMesAnterior;
  const pctVariacion = stats.ingresosMesAnterior > 0 
    ? Math.round((diffIngresos / stats.ingresosMesAnterior) * 100) 
    : 0;

  return (
    <div className="estadisticas-container">
      <header className="estadisticas-header">
        <div>
          <button onClick={() => navigate('/admin')} className="btn-back-panel" style={{ marginBottom: '8px' }}>
            ← Volver al Panel
          </button>
          <h1>Panel de Estadísticas y Rendimiento</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Admin: <strong>{user?.name}</strong></span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="estadisticas-content">
        {/* KPI Cards Superiores */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon blue">🏟️</div>
            <div className="kpi-data">
              <h3>{stats.totalCanchas}</h3>
              <p>Canchas Activas</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon green">📅</div>
            <div className="kpi-data">
              <h3>{stats.totalTurnos}</h3>
              <p>Turnos Registrados</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon amber">⏳</div>
            <div className="kpi-data">
              <h3>{stats.turnosPendientes}</h3>
              <p>Turnos Por Confirmar</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon purple">👥</div>
            <div className="kpi-data">
              <h3>{stats.totalClientes}</h3>
              <p>Clientes Registrados</p>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon emerald">💰</div>
            <div className="kpi-data">
              <h3>${Number(stats.ingresosMes || 0).toLocaleString('es-AR')}</h3>
              <p>Ingresos Mes Actual</p>
              {stats.ingresosMesAnterior > 0 ? (
                <div className={`kpi-subtext ${pctVariacion >= 0 ? 'positive' : 'neutral'}`}>
                  {pctVariacion >= 0 ? `▲ +${pctVariacion}%` : `▼ ${pctVariacion}%`} vs mes anterior
                </div>
              ) : (
                <div className="kpi-subtext neutral">Primer mes medido</div>
              )}
            </div>
          </div>
        </div>

        {/* Gráficos de Análisis */}
        <div className="charts-grid">
          {/* Gráfico 1: Actividad últimos 7 días */}
          <div className="chart-card">
            <div className="chart-header">
              <h2>📊 Actividad Semanal</h2>
              <span>Últimos 7 días</span>
            </div>
            <div className="bar-chart-container">
              {actividad7Dias.map((dia, idx) => {
                const alturaPorcentaje = Math.max(Math.round((dia.cantidad / maxCantidad) * 100), 8);
                return (
                  <div key={idx} className="bar-column">
                    <div className="bar-wrapper">
                      <div 
                        className="bar-fill" 
                        style={{ height: `${alturaPorcentaje}%` }}
                        title={`${dia.cantidad} turno(s)`}
                      >
                        <span className="bar-count-tooltip">{dia.cantidad}</span>
                      </div>
                    </div>
                    <span className="bar-label">{dia.etiqueta}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico 2: Distribución por Estado */}
          <div className="chart-card">
            <div className="chart-header">
              <h2>📋 Estado de Reservas</h2>
              <span>Total: {stats.totalTurnos}</span>
            </div>
            <div className="status-progress-list">
              <div>
                <div className="status-item-info">
                  <span style={{ color: '#16a34a' }}>● Confirmados</span>
                  <span>{estados.confirmados} ({Math.round((estados.confirmados / totalTurnos) * 100)}%)</span>
                </div>
                <div className="status-track">
                  <div 
                    className="status-fill confirmado" 
                    style={{ width: `${Math.round((estados.confirmados / totalTurnos) * 100)}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="status-item-info">
                  <span style={{ color: '#ca8a04' }}>● Pendientes</span>
                  <span>{estados.pendientes} ({Math.round((estados.pendientes / totalTurnos) * 100)}%)</span>
                </div>
                <div className="status-track">
                  <div 
                    className="status-fill pendiente" 
                    style={{ width: `${Math.round((estados.pendientes / totalTurnos) * 100)}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="status-item-info">
                  <span style={{ color: '#2563eb' }}>● Completados</span>
                  <span>{estados.completados} ({Math.round((estados.completados / totalTurnos) * 100)}%)</span>
                </div>
                <div className="status-track">
                  <div 
                    className="status-fill completado" 
                    style={{ width: `${Math.round((estados.completados / totalTurnos) * 100)}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="status-item-info">
                  <span style={{ color: '#dc2626' }}>● Cancelados</span>
                  <span>{estados.cancelados} ({Math.round((estados.cancelados / totalTurnos) * 100)}%)</span>
                </div>
                <div className="status-track">
                  <div 
                    className="status-fill cancelado" 
                    style={{ width: `${Math.round((estados.cancelados / totalTurnos) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico 3: Comparativa Fútbol 5 vs Pádel */}
          <div className="chart-card">
            <div className="chart-header">
              <h2>⚽ vs 🎾 Distribución por Deporte</h2>
              <span>Demanda de disciplinas</span>
            </div>
            <div className="sports-comparison-card">
              <div className="sports-track">
                <div 
                  className="sports-segment-futbol" 
                  style={{ width: `${pctFutbol}%` }} 
                  title={`Fútbol 5: ${pctFutbol}%`}
                />
                <div 
                  className="sports-segment-padel" 
                  style={{ width: `${pctPadel}%` }} 
                  title={`Pádel: ${pctPadel}%`}
                />
              </div>

              <div className="sports-legend">
                <div className="sports-legend-item">
                  <span className="legend-dot futbol" />
                  <span>Fútbol 5: <strong>{deportes.futbol5}</strong> ({pctFutbol}%)</span>
                </div>
                <div className="sports-legend-item">
                  <span className="legend-dot padel" />
                  <span>Pádel: <strong>{deportes.padel}</strong> ({pctPadel}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico 4: Ranking Canchas más reservadas */}
          <div className="chart-card">
            <div className="chart-header">
              <h2>🏆 Canchas Más Demandadas</h2>
              <span>Ranking histórico</span>
            </div>
            <div className="ranking-list">
              {(stats.topCanchas || []).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>
                  Sin registros suficientes para ranking.
                </p>
              ) : (
                stats.topCanchas.map((c, i) => {
                  const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                  return (
                    <div key={i} className="ranking-item">
                      <div className="ranking-item-left">
                        <span className={`ranking-pos ${posClass}`}>#{i + 1}</span>
                        <div>
                          <div className="ranking-cancha-name">{c.nombre}</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {c.tipo === 'futbol5' ? 'Fútbol 5' : 'Pádel'}
                          </span>
                        </div>
                      </div>
                      <span className="ranking-turnos-badge">
                        {c.turnos} turnos
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Estadisticas;
