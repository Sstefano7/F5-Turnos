import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canchaService } from '../services/canchaService';
import { turnoService } from '../services/turnoService';
import { clienteService } from '../services/clienteService';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import api from '../config/api';
import '../styles/Reservar.css';

function Reservar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerRefresh } = useDashboard();

  const [cancha, setCancha] = useState(null);
  const [fecha, setFecha] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingPago, setLoadingPago] = useState(false);
  const [error, setError] = useState('');
  
  const [buscandoDni, setBuscandoDni] = useState(false);
  const [dniEncontrado, setDniEncontrado] = useState(false);

  // Estado del flujo de pago
  const [turnoCreado, setTurnoCreado] = useState(null);
  const [infoPago, setInfoPago] = useState(null); // { monto_senia, monto_restante, checkout_url, sandbox_url, vence_en }
  const [countdown, setCountdown] = useState(null);

  const [clienteData, setClienteData] = useState({
    nombre: '',
    apellido: '',
    email: user?.email || '',
    telefono: '',
    dni: ''
  });

  useEffect(() => {
    canchaService.getById(id)
      .then(data => { setCancha(data); setLoading(false); })
      .catch(() => { setError('Error al cargar la cancha'); setLoading(false); });
  }, [id]);

  // Efecto para autocompletar datos si el DNI ya existe
  useEffect(() => {
    const dni = clienteData.dni;
    if (dni && dni.length >= 7) {
      const delay = setTimeout(async () => {
        setBuscandoDni(true);
        try {
          // Buscamos usando el nuevo endpoint de búsqueda en el backend
          const response = await clienteService.getAll({ search: dni });
          const clientes = Array.isArray(response) ? response : response.data;
          
          if (clientes && clientes.length > 0) {
            // Coincidencia exacta por DNI
            const clienteMatch = clientes.find(c => c.dni === dni);
            if (clienteMatch) {
              setClienteData(prev => ({
                ...prev,
                nombre: clienteMatch.nombre,
                apellido: clienteMatch.apellido,
                email: clienteMatch.email,
                telefono: clienteMatch.telefono
              }));
              setDniEncontrado(true);
            } else {
              setDniEncontrado(false);
            }
          } else {
            setDniEncontrado(false);
          }
        } catch (err) {
          console.error("Error buscando cliente:", err);
        } finally {
          setBuscandoDni(false);
        }
      }, 600);
      return () => clearTimeout(delay);
    } else {
      setDniEncontrado(false);
    }
  }, [clienteData.dni]);

  useEffect(() => {
    if (fecha && cancha) fetchHorarios();
  }, [fecha, cancha]);

  // Countdown para el tiempo de pago de seña
  useEffect(() => {
    if (!infoPago?.vence_en) return;
    const interval = setInterval(() => {
      const diff = new Date(infoPago.vence_en) - new Date();
      if (diff <= 0) {
        setCountdown('00:00');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [infoPago]);

  const fetchHorarios = async () => {
    setLoadingHorarios(true);
    setHorarioSeleccionado(null);
    try {
      const horarios = await canchaService.getHorariosDisponibles(id, fecha);
      setHorariosDisponibles(horarios);
    } catch {
      setError('Error al cargar horarios disponibles');
    } finally {
      setLoadingHorarios(false);
    }
  };

  const handleClienteChange = (e) => {
    setClienteData({ ...clienteData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!clienteData.nombre.trim()) return setError('El nombre es requerido');
    if (!clienteData.apellido.trim()) return setError('El apellido es requerido');
    if (!clienteData.email.trim()) return setError('El email es requerido');
    if (!clienteData.telefono.trim()) return setError('El teléfono es requerido');
    if (!horarioSeleccionado) return setError('Debes seleccionar un horario');

    try {
      // Buscar o crear cliente
      let clienteId;
      const respuestaClientes = await clienteService.getAll();
      const listaClientes = Array.isArray(respuestaClientes) ? respuestaClientes : respuestaClientes.data;
      const clienteExistente = listaClientes?.find(c => c.email === clienteData.email);

      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        const cliente = await clienteService.create(clienteData);
        clienteId = cliente.id;
      }

      // Crear el turno — ahora devuelve info de seña
      const response = await api.post('/turnos', {
        cancha_id:   parseInt(id),
        cliente_id:  clienteId,
        fecha,
        hora_inicio: horarioSeleccionado.hora_inicio,
        hora_fin:    horarioSeleccionado.hora_fin,
        observaciones: '',
      });

      const { turno, monto_senia, monto_restante, porcentaje_senia, senia_vence_en, minutos_para_pagar } = response.data;
      setTurnoCreado(turno);
      triggerRefresh();

      // Iniciar el proceso de pago de seña automáticamente
      setLoadingPago(true);
      const pagoResponse = await api.post(`/turnos/${turno.id}/iniciar-pago`);
      const { sandbox_url, checkout_url, vence_en } = pagoResponse.data;

      setInfoPago({
        monto_senia,
        monto_restante,
        porcentaje_senia,
        minutos_para_pagar,
        vence_en: senia_vence_en,
        // En modo test usamos sandbox_url, en producción checkout_url
        checkout_url: sandbox_url || checkout_url,
      });

    } catch (err) {
      console.error('Error:', err.response?.data);
      setError(err.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setLoadingPago(false);
    }
  };

  const getMinDate = () => new Date().toISOString().split('T')[0];

  if (loading) return <div className="loading">Cargando...</div>;
  if (!cancha) return <div className="error">Cancha no encontrada</div>;

  // ── PANTALLA DE PAGO DE SEÑA ─────────────────────────────────────────────
  if (turnoCreado && infoPago) {
    const countdownExpired = countdown === '00:00';

    return (
      <div className="reservar-container">
        <div className="success-container" style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}>
            {/* Header verde */}
            <div style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', padding: '28px 32px', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>¡Turno reservado!</h2>
              <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                Completá el pago de la seña para confirmar tu turno
              </p>
            </div>

            <div style={{ padding: '28px 32px' }}>
              {/* Resumen del turno */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#1e293b' }}>{cancha.nombre}</p>
                <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '0.9rem' }}>
                  📅 {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  🕐 {horarioSeleccionado?.hora_inicio?.slice(0,5)} - {horarioSeleccionado?.hora_fin?.slice(0,5)}
                </p>
              </div>

              {/* Desglose de pago */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Precio total</span>
                  <span style={{ fontWeight: '600' }}>
                    ${(parseFloat(infoPago.monto_senia) + parseFloat(infoPago.monto_restante)).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Seña ahora ({infoPago.porcentaje_senia}%)</span>
                  <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '1.1rem' }}>
                    ${parseFloat(infoPago.monto_senia).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                  <span style={{ color: '#64748b' }}>Resto en el local</span>
                  <span style={{ color: '#475569' }}>${parseFloat(infoPago.monto_restante).toFixed(2)}</span>
                </div>
              </div>

              {/* Countdown */}
              {countdown && (
                <div style={{
                  textAlign: 'center',
                  background: countdownExpired ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${countdownExpired ? '#fca5a5' : '#fde68a'}`,
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '20px',
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: countdownExpired ? '#dc2626' : '#92400e' }}>
                    {countdownExpired ? '⏰ Tiempo expirado — tu turno fue cancelado' : '⏳ Tiempo para pagar la seña'}
                  </p>
                  {!countdownExpired && (
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: '#d97706', fontFamily: 'monospace' }}>
                      {countdown}
                    </span>
                  )}
                </div>
              )}

              {/* Botones */}
              {!countdownExpired && (
                <a
                  href={infoPago.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #009ee3, #00b8f1)',
                    color: 'white',
                    padding: '14px 24px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '1rem',
                    marginBottom: '12px',
                    boxShadow: '0 4px 12px rgba(0, 158, 227, 0.35)',
                  }}
                >
                  💳 Pagar seña con MercadoPago
                </a>
              )}

              <button
                onClick={() => navigate('/mis-reservas')}
                style={{
                  display: 'block', width: '100%', textAlign: 'center',
                  background: 'transparent', color: '#64748b',
                  padding: '10px', border: '1px solid #e2e8f0',
                  borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Ver mis reservas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FORMULARIO DE RESERVA ────────────────────────────────────────────────
  return (
    <div className="reservar-container">
      <div className="reservar-header">
        <button onClick={() => navigate('/')} className="btn-back">← Volver</button>
        <h1>Reservar Turno</h1>
      </div>

      <div className="reservar-content">
        <div className="cancha-info">
          <h2>{cancha.nombre}</h2>
          <p className="tipo">{cancha.tipo === 'futbol5' ? 'Fútbol 5' : 'Pádel'}</p>
          <p className="descripcion">{cancha.descripcion}</p>
          <p className="precio">Precio: ${cancha.precio_hora} / hora</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Aviso de seña */}
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
          fontSize: '0.9rem', color: '#1e40af',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <span style={{ fontSize: '1.2rem' }}>💳</span>
          <div>
            <strong>Sistema de seña:</strong> Al confirmar, se te pedirá una seña del{' '}
            <strong>30% del total</strong> vía MercadoPago. El resto lo abonás en el local el día del turno.
            Tenés <strong>15 minutos</strong> para completarla.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="reserva-form">
          <div className="form-section">
            <h3>1. Seleccioná la fecha</h3>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              min={getMinDate()}
              required
              className="date-input"
            />
          </div>

          {fecha && (
            <div className="form-section">
              <h3>2. Seleccioná el horario</h3>
              {loadingHorarios ? (
                <p>Cargando horarios...</p>
              ) : horariosDisponibles.length > 0 ? (
                <div className="horarios-grid">
                  {horariosDisponibles.map((horario) => (
                    <button
                      key={horario.id}
                      type="button"
                      className={`horario-btn ${horarioSeleccionado?.id === horario.id ? 'selected' : ''}`}
                      onClick={() => setHorarioSeleccionado(horario)}
                    >
                      {horario.hora_inicio.slice(0, 5)} - {horario.hora_fin.slice(0, 5)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="no-horarios">No hay horarios disponibles para esta fecha</p>
              )}
            </div>
          )}

          {horarioSeleccionado && (
            <div className="form-section">
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>3. Tus datos</span>
                {buscandoDni && <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>Buscando... ⏳</span>}
                {dniEncontrado && <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'normal', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>Datos autocompletados ✅</span>}
              </h3>
              <div className="form-grid">
                {[
                  { label: 'DNI', name: 'dni', type: 'text' },
                  { label: 'Nombre *', name: 'nombre', type: 'text' },
                  { label: 'Apellido *', name: 'apellido', type: 'text' },
                  { label: 'Email *', name: 'email', type: 'email' },
                  { label: 'Teléfono *', name: 'telefono', type: 'tel' },
                ].map(({ label, name, type }) => (
                  <div className="form-group" key={name}>
                    <label>{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={clienteData[name]}
                      onChange={handleClienteChange}
                      required={label.includes('*')}
                      placeholder={name === 'dni' ? 'Ingresá tu DNI para autocompletar...' : ''}
                      style={name === 'dni' && dniEncontrado ? { borderColor: '#16a34a', background: '#f0fdf4' } : {}}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {horarioSeleccionado && (
            <div className="resumen-reserva">
              <h3>Resumen</h3>
              <p><strong>Cancha:</strong> {cancha.nombre}</p>
              <p><strong>Fecha:</strong> {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')}</p>
              <p><strong>Horario:</strong> {horarioSeleccionado.hora_inicio.slice(0, 5)} - {horarioSeleccionado.hora_fin.slice(0, 5)}</p>
              <p><strong>Precio total:</strong> ${cancha.precio_hora}</p>
              <p style={{ color: '#16a34a' }}>
                <strong>Seña a pagar (30%):</strong> ${(cancha.precio_hora * 0.30).toFixed(2)}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Resto en el local: ${(cancha.precio_hora * 0.70).toFixed(2)}
              </p>

              <button
                type="submit"
                className="btn-confirmar"
                disabled={loadingPago}
                style={{ opacity: loadingPago ? 0.7 : 1 }}
              >
                {loadingPago ? '⏳ Generando enlace de pago...' : '💳 Confirmar y pagar seña'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Reservar;