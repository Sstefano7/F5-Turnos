import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { turnoService } from '../services/turnoService';
import { useAuth } from '../context/AuthContext';
import '../styles/MisReservas.css';

function MisReservas() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTurnos();
  }, []);

const fetchTurnos = async () => {
  try {
    // Usar la ruta /mis-turnos que filtra por usuario autenticado
    const data = await turnoService.getMisTurnos();
    setTurnos(data);
    setLoading(false);
  } catch (err) {
    setError('Error al cargar las reservas');
    setLoading(false);
  }
};

  const handleCancelar = async (turnoId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      return;
    }

    try {
      await turnoService.cancelar(turnoId);
      // Recargar turnos
      fetchTurnos();
      alert('Reserva cancelada exitosamente');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar la reserva');
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'confirmado': return 'estado-confirmado';
      case 'cancelado': return 'estado-cancelado';
      case 'completado': return 'estado-completado';
      default: return '';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'confirmado': return 'Confirmado';
      case 'cancelado': return 'Cancelado';
      case 'completado': return 'Completado';
      default: return estado;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Cargando reservas...</div>;

  return (
    <div className="mis-reservas-container">
      <header className="header">
        <h1>Mis Reservas</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/')} className="btn-home">
            Inicio
          </button>
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="main-content">
        {error && <div className="error-message">{error}</div>}

        {turnos.length === 0 ? (
          <div className="empty-state">
            <h2>No tienes reservas</h2>
            <p>Aún no has realizado ninguna reserva</p>
            <button onClick={() => navigate('/')} className="btn-reservar-ahora">
              Reservar Ahora
            </button>
          </div>
        ) : (
          <div className="turnos-list">
            {turnos.map((turno) => (
              <div key={turno.id} className="turno-card">
                <div className="turno-header">
                  <h3>{turno.cancha.nombre}</h3>
                  <span className={`estado-badge ${getEstadoClass(turno.estado)}`}>
                    {getEstadoTexto(turno.estado)}
                  </span>
                </div>

                <div className="turno-info">
                  <div className="info-item">
                    <span className="label">Fecha:</span>
                    <span className="value">
                      {new Date(turno.fecha).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="label">Horario:</span>
                    <span className="value">
                      {turno.hora_inicio.slice(0, 5)} - {turno.hora_fin.slice(0, 5)}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="label">Cliente:</span>
                    <span className="value">
                      {turno.cliente.nombre} {turno.cliente.apellido}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="label">Precio:</span>
                    <span className="value precio">${turno.precio}</span>
                  </div>

                  {turno.observaciones && (
                    <div className="info-item">
                      <span className="label">Observaciones:</span>
                      <span className="value">{turno.observaciones}</span>
                    </div>
                  )}
                </div>

                {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
                  <div className="turno-actions">
                    <button
                      onClick={() => handleCancelar(turno.id)}
                      className="btn-cancelar"
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MisReservas;