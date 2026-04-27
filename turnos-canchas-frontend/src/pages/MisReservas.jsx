import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { turnoService } from '../services/turnoService';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
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
    pendiente_senia: { clase: 'estado-pendiente-senia', texto: '⏳ Pendiente de seña' },
    pendiente:       { clase: 'estado-pendiente',       texto: 'Pendiente' },
    confirmado:      { clase: 'estado-confirmado',      texto: '✅ Confirmado' },
    cancelado:       { clase: 'estado-cancelado',       texto: 'Cancelado' },
    completado:      { clase: 'estado-completado',      texto: 'Completado' },
  }[estado] || { clase: '', texto: estado });

  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (loading) return <div className="loading">Cargando reservas...</div>;

  return (
    <div className="mis-reservas-container">
      <header className="header">
        <h1>Mis Reservas</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/')} className="btn-home">Inicio</button>
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main className="main-content">

        {/* Notificación de retorno de MP */}
        {pagoNotif && (
          <div style={{
            padding: '14px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: '600',
            background: pagoNotif.tipo === 'success' ? '#dcfce7' : pagoNotif.tipo === 'error' ? '#fef2f2' : '#fffbeb',
            color: pagoNotif.tipo === 'success' ? '#16a34a' : pagoNotif.tipo === 'error' ? '#dc2626' : '#92400e',
            border: `1px solid ${pagoNotif.tipo === 'success' ? '#86efac' : pagoNotif.tipo === 'error' ? '#fca5a5' : '#fde68a'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{pagoNotif.texto}</span>
            <button
              onClick={() => { setPagoNotif(null); fetchTurnos(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.6 }}
            >✕</button>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {turnos.length === 0 ? (
          <div className="empty-state">
            <h2>No tenés reservas</h2>
            <p>Aún no realizaste ninguna reserva</p>
            <button onClick={() => navigate('/')} className="btn-reservar-ahora">Reservar Ahora</button>
          </div>
        ) : (
          <div className="turnos-list">
            {turnos.map((turno) => {
              const estadoConfig = getEstadoConfig(turno.estado);
              const cd = countdowns[turno.id];
              const expirado = cd === 'expirado';
              const pendienteSenia = turno.estado === 'pendiente_senia';

              return (
                <div
                  key={turno.id}
                  className="turno-card"
                  style={pendienteSenia && !expirado ? { borderLeft: '4px solid #f59e0b' } : {}}
                >
                  <div className="turno-header">
                    <h3>{turno.cancha?.nombre}</h3>
                    <span className={`estado-badge ${estadoConfig.clase}`}>
                      {estadoConfig.texto}
                    </span>
                  </div>

                  <div className="turno-info">
                    <div className="info-item">
                      <span className="label">Fecha:</span>
                      <span className="value">
                        {new Date(turno.fecha).toLocaleDateString('es-AR', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Horario:</span>
                      <span className="value">
                        {turno.hora_inicio?.slice(0, 5)} - {turno.hora_fin?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Cliente:</span>
                      <span className="value">{turno.cliente?.nombre} {turno.cliente?.apellido}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Precio total:</span>
                      <span className="value precio">${turno.precio}</span>
                    </div>

                    {/* Desglose de seña si aplica */}
                    {turno.monto_senia && (
                      <>
                        <div className="info-item">
                          <span className="label" style={{ color: '#16a34a' }}>Seña pagada:</span>
                          <span className="value" style={{ color: turno.estado === 'confirmado' ? '#16a34a' : '#f59e0b', fontWeight: '600' }}>
                            ${turno.monto_senia}
                            {turno.estado === 'confirmado' && ' ✅'}
                            {pendienteSenia && ' ⏳ pendiente'}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="label">Resto en local:</span>
                          <span className="value">${turno.monto_restante}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* BLOQUE ESPECIAL para pendiente_senia */}
                  {pendienteSenia && (
                    <div style={{
                      marginTop: '12px',
                      background: expirado ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${expirado ? '#fca5a5' : '#fde68a'}`,
                      borderRadius: '10px',
                      padding: '14px 16px',
                    }}>
                      {expirado ? (
                        <p style={{ margin: 0, color: '#dc2626', fontWeight: '600' }}>
                          ⏰ El tiempo expiró. Este turno fue cancelado automáticamente.
                        </p>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ color: '#92400e', fontSize: '0.9rem' }}>⏳ Tiempo para pagar:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1.4rem', color: '#d97706' }}>
                              {cd || '--:--'}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePagarSenia(turno)}
                            disabled={loadingPago === turno.id}
                            style={{
                              width: '100%',
                              background: 'linear-gradient(135deg, #009ee3, #00b8f1)',
                              color: 'white', border: 'none', borderRadius: '8px',
                              padding: '12px', fontWeight: '700', fontSize: '0.95rem',
                              cursor: 'pointer',
                              opacity: loadingPago === turno.id ? 0.7 : 1,
                            }}
                          >
                            {loadingPago === turno.id ? '⏳ Generando enlace...' : '💳 Pagar seña con MercadoPago'}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Botón cancelar */}
                  {(turno.estado === 'pendiente_senia' || turno.estado === 'pendiente' || turno.estado === 'confirmado') && !expirado && (
                    <div className="turno-actions">
                      <button onClick={() => handleCancelar(turno.id)} className="btn-cancelar">
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