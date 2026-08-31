import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { turnoService } from '../services/turnoService';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import Header from '../components/layout/Header';
import '../styles/MisReservas.css';

function MisReservas() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagoNotif, setPagoNotif] = useState(null); // notificación al volver de MP
  const [loadingPago, setLoadingPago] = useState(null); // id del turno cargando
  const [countdowns, setCountdowns] = useState({});

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Detectar retorno de MercadoPago
  useEffect(() => {
    const pago = searchParams.get('pago');
    const turnoId = searchParams.get('turno');
    if (pago) {
      const mensajes = {
        exitoso: { tipo: 'success', texto: '✅ ¡Pago de seña aprobado! Tu turno está confirmado.' },
        fallido:  { tipo: 'error',   texto: '❌ El pago de la seña fue rechazado. Podés intentarlo de nuevo.' },
        pendiente:{ tipo: 'warning', texto: '⏳ Tu pago está siendo procesado. Actualizaremos tu reserva pronto.' },
      };
      setPagoNotif(mensajes[pago] || null);
      
      if (pago === 'exitoso') {
        window.alert('✅ ¡Pago registrado con éxito! Tu turno fue confirmado.');
      }
      // Limpiar los query params de la URL sin recargar
      window.history.replaceState({}, '', '/mis-reservas');
    }
  }, [searchParams]);

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

  useEffect(() => { fetchTurnos(); }, [fetchTurnos]);

  // Actualizar los countdowns de turnos pendientes de seña cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      const nuevosCd = {};
      turnos.forEach(t => {
        if (t.estado === 'pendiente_senia' && t.senia_vence_en) {
          const diff = new Date(t.senia_vence_en) - new Date();
          if (diff <= 0) {
            nuevosCd[t.id] = 'expirado';
          } else {
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            nuevosCd[t.id] = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          }
        }
      });
      setCountdowns(nuevosCd);
    }, 1000);
    return () => clearInterval(interval);
  }, [turnos]);

  const handleCancelar = async (turnoId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    try {
      await turnoService.cancelar(turnoId);
      fetchTurnos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar');
    }
  };

  const handlePagarSenia = async (turno) => {
    setLoadingPago(turno.id);
    try {
      const response = await api.post(`/turnos/${turno.id}/iniciar-pago`);
      const { sandbox_url, checkout_url } = response.data;
      // En desarrollo usamos sandbox_url, en producción checkout_url
      window.location.href = sandbox_url || checkout_url;
    } catch (err) {
      alert(err.response?.data?.message || 'Error al generar el enlace de pago');
    } finally {
      setLoadingPago(null);
    }
  };

  const getEstadoConfig = (estado) => ({
    pendiente_senia: { clase: 'mr-estado-pendiente-senia', texto: '⏳ Pendiente de seña' },
    pendiente:       { clase: 'mr-estado-pendiente',       texto: 'Pendiente' },
    confirmado:      { clase: 'mr-estado-confirmado',      texto: '✅ Confirmado' },
    cancelado:       { clase: 'mr-estado-cancelado',       texto: 'Cancelado' },
    completado:      { clase: 'mr-estado-completado',      texto: 'Completado' },
  }[estado] || { clase: '', texto: estado });

  if (loading) return <div className="loading">Cargando reservas...</div>;

  return (
    <div className="mis-reservas-container">
      <Header />

      <main className="mr-main-content">

        {/* Notificación de retorno de MP */}
        {pagoNotif && (
          <div className={`mr-notification mr-notification--${pagoNotif.tipo}`}>
            <span>{pagoNotif.texto}</span>
            <button
              onClick={() => { setPagoNotif(null); fetchTurnos(); }}
              className="mr-notification__close"
              aria-label="Cerrar notificación"
            >✕</button>
          </div>
        )}

        {error && <div className="mr-error-message">{error}</div>}

        <div className="home__section-head" style={{ textAlign: 'left', marginBottom: 'var(--space-6)' }}>
          <h2 className="home__section-title" style={{ textAlign: 'left' }}>Mis Reservas</h2>
        </div>

        {turnos.length === 0 ? (
          <div className="mr-empty-state">
            <h2>No tenés reservas</h2>
            <p>Aún no realizaste ninguna reserva</p>
            <button onClick={() => navigate('/')} className="mr-btn-reservar-ahora">Reservar Ahora</button>
          </div>
        ) : (
          <div className="mr-turnos-list">
            {turnos.map((turno) => {
              const estadoConfig = getEstadoConfig(turno.estado);
              const cd = countdowns[turno.id];
              const expirado = cd === 'expirado';
              const pendienteSenia = turno.estado === 'pendiente_senia';

              return (
                <div
                  key={turno.id}
                  className={`mr-turno-card ${pendienteSenia && !expirado ? 'mr-turno-card--senia' : ''}`}
                >
                  <div className="mr-turno-header">
                    <h3>{turno.cancha?.nombre}</h3>
                    <span className={`mr-estado-badge ${estadoConfig.clase}`}>
                      {estadoConfig.texto}
                    </span>
                  </div>

                  <div className="mr-turno-info">
                    <div className="mr-info-item">
                      <span className="mr-label">Fecha:</span>
                      <span className="mr-value">
                        {new Date(turno.fecha).toLocaleDateString('es-AR', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="mr-info-item">
                      <span className="mr-label">Horario:</span>
                      <span className="mr-value">
                        {turno.hora_inicio?.slice(0, 5)} - {turno.hora_fin?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="mr-info-item">
                      <span className="mr-label">Cliente:</span>
                      <span className="mr-value">{turno.cliente?.nombre} {turno.cliente?.apellido}</span>
                    </div>
                    <div className="mr-info-item">
                      <span className="mr-label">Precio total:</span>
                      <span className="mr-value mr-precio">${turno.precio}</span>
                    </div>

                    {/* Desglose de seña si aplica */}
                    {turno.monto_senia && (
                      <>
                        <div className="mr-info-item">
                          <span className="mr-label">Seña pagada:</span>
                          <span className={`mr-value ${turno.estado === 'confirmado' ? 'mr-senia-success' : 'mr-senia-pending'}`}>
                            ${turno.monto_senia}
                            {turno.estado === 'confirmado' && ' ✅'}
                            {pendienteSenia && ' ⏳ pendiente'}
                          </span>
                        </div>
                        <div className="mr-info-item">
                          <span className="mr-label">Resto en local:</span>
                          <span className="mr-value">${turno.monto_restante}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* BLOQUE ESPECIAL para pendiente_senia */}
                  {pendienteSenia && (
                    <div className={`mr-senia-box ${expirado ? 'mr-senia-box--expired' : 'mr-senia-box--active'}`}>
                      {expirado ? (
                        <p className="mr-senia-box__expired-text">
                          ⏰ El tiempo expiró. Este turno fue cancelado automáticamente.
                        </p>
                      ) : (
                        <>
                          <div className="mr-senia-box__timer">
                            <span className="mr-senia-box__timer-label">⏳ Tiempo para pagar:</span>
                            <span className="mr-senia-box__timer-value">
                              {cd || '--:--'}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePagarSenia(turno)}
                            disabled={loadingPago === turno.id}
                            className="mr-btn-pagar"
                          >
                            {loadingPago === turno.id ? '⏳ Generando enlace...' : '💳 Pagar seña con MercadoPago'}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Botón cancelar */}
                  {(turno.estado === 'pendiente_senia' || turno.estado === 'pendiente' || turno.estado === 'confirmado') && !expirado && (
                    <div className="mr-turno-actions">
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