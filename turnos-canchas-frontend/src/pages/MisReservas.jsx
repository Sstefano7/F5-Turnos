import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { turnoService } from '../services/turnoService';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Swal from 'sweetalert2';
import '../styles/MisReservas.css';

function MisReservas() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTurnos = useCallback(async () => {
    try {
      const data = await turnoService.getMisTurnos();
      setTurnos(Array.isArray(data) ? data : []);
    } catch {
      setError('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurnos();
  }, [fetchTurnos]);

  const handleCancelar = async (turnoId) => {
    const result = await Swal.fire({
      title: '¿Cancelar reserva?',
      text: '¿Estás seguro de que deseas cancelar este turno? Esta acción liberará el horario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, cancelar turno',
      cancelButtonText: 'Volver',
    });

    if (result.isConfirmed) {
      try {
        await turnoService.cancelar(turnoId);
        Swal.fire({
          title: 'Reserva cancelada',
          text: 'Tu turno ha sido cancelado correctamente.',
          icon: 'success',
          confirmButtonColor: '#16a34a',
        });
        fetchTurnos();
      } catch (err) {
        Swal.fire({
          title: 'Error al cancelar',
          text: err.response?.data?.message || 'No se pudo cancelar el turno.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    }
  };

  const getEstadoConfig = (estado) => ({
    pendiente:       { clase: 'mr-estado-pendiente',       texto: '⏳ Pendiente de confirmación' },
    confirmado:      { clase: 'mr-estado-confirmado',      texto: '✅ Confirmado' },
    cancelado:       { clase: 'mr-estado-cancelado',       texto: 'Cancelado' },
    completado:      { clase: 'mr-estado-completado',      texto: 'Completado' },
    pendiente_senia: { clase: 'mr-estado-pendiente',       texto: '⏳ Pendiente de confirmación' },
  }[estado] || { clase: '', texto: estado });

  if (loading) return <div className="loading">Cargando reservas...</div>;

  return (
    <div className="mis-reservas-container">
      <Header />

      <main className="mr-main-content">
        {error && <div className="mr-error-message">{error}</div>}

        <div className="home__section-head" style={{ textAlign: 'left', marginBottom: 'var(--space-6)' }}>
          <h2 className="home__section-title" style={{ textAlign: 'left' }}>Mis Reservas</h2>
        </div>

        {turnos.length === 0 ? (
          <div className="mr-empty-state">
            <h2>No tenés reservas</h2>
            <p>Aún no realizaste ninguna reserva de cancha.</p>
            <button onClick={() => navigate('/')} className="mr-btn-reservar-ahora">Reservar Ahora</button>
          </div>
        ) : (
          <div className="mr-turnos-list">
            {turnos.map((turno) => {
              const estadoConfig = getEstadoConfig(turno.estado);
              const puedeCancelar = turno.estado === 'pendiente' || turno.estado === 'confirmado' || turno.estado === 'pendiente_senia';

              return (
                <div key={turno.id} className="mr-turno-card">
                  <div className="mr-turno-header">
                    <h3>{turno.cancha?.nombre || 'Cancha'}</h3>
                    <span className={`mr-estado-badge ${estadoConfig.clase}`}>
                      {estadoConfig.texto}
                    </span>
                  </div>

                  <div className="mr-turno-info">
                    <div className="mr-info-item">
                      <span className="mr-label">Fecha:</span>
                      <span className="mr-value">
                        {new Date(turno.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="mr-info-item">
                      <span className="mr-label">Horario:</span>
                      <span className="mr-value">
                        {turno.hora_inicio?.slice(0, 5)} - {turno.hora_fin?.slice(0, 5)} hs
                      </span>
                    </div>
                    <div className="mr-info-item">
                      <span className="mr-label">Cliente:</span>
                      <span className="mr-value">{turno.cliente?.nombre} {turno.cliente?.apellido}</span>
                    </div>
                    <div className="mr-info-item">
                      <span className="mr-label">Precio total:</span>
                      <span className="mr-value mr-precio">${Number(turno.precio).toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  {/* Aviso informativo de pago 100% presencial */}
                  <div style={{
                    marginTop: '14px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    lineHeight: '1.4',
                    background: turno.estado === 'confirmado' ? '#f0fdf4' : (turno.estado === 'cancelado' ? '#fef2f2' : '#fefce8'),
                    border: `1px solid ${turno.estado === 'confirmado' ? '#bbf7d0' : (turno.estado === 'cancelado' ? '#fecaca' : '#fef08a')}`,
                    color: turno.estado === 'confirmado' ? '#166534' : (turno.estado === 'cancelado' ? '#991b1b' : '#854d0e')
                  }}>
                    {turno.estado === 'confirmado' && (
                      <span>💵 <strong>Turno confirmado.</strong> El pago total de <strong>${Number(turno.precio).toLocaleString('es-AR')}</strong> se realiza en el complejo el día del turno.</span>
                    )}
                    {(turno.estado === 'pendiente' || turno.estado === 'pendiente_senia') && (
                      <span>⏳ <strong>Solicitud en revisión.</strong> El administrador confirmará tu turno a la brevedad. El pago se efectúa 100% presencial en el local.</span>
                    )}
                    {turno.estado === 'completado' && (
                      <span>🏁 <strong>Turno completado.</strong> ¡Esperamos que hayas disfrutado el partido!</span>
                    )}
                    {turno.estado === 'cancelado' && (
                      <span>✕ Este turno fue cancelado y el horario ha sido liberado.</span>
                    )}
                  </div>

                  {/* Botón cancelar */}
                  {puedeCancelar && (
                    <div className="mr-turno-actions" style={{ marginTop: '14px' }}>
                      <button onClick={() => handleCancelar(turno.id)} className="mr-btn-cancelar">
                        Cancelar Reserva
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MisReservas;