import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canchaService } from '../services/canchaService';
import { turnoService } from '../services/turnoService';
import { clienteService } from '../services/clienteService';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import '../styles/Reservar.css';

const fmtARS = (v) => new Intl.NumberFormat("es-AR").format(Number(v || 0))

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
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [dniEncontrado, setDniEncontrado] = useState(false);
  const redirigirTimer = useRef(null);

  // Limpiar el timer de redirección al desmontar
  useEffect(() => () => clearTimeout(redirigirTimer.current), []);

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

  // Autocompletar con el cliente propio (el CRUD de clientes es admin-only).
  useEffect(() => {
    let cancelado = false;
    clienteService.getMine()
      .then((miCliente) => {
        if (cancelado || !miCliente) return;
        setClienteData(prev => ({
          ...prev,
          nombre: prev.nombre || miCliente.nombre || '',
          apellido: prev.apellido || miCliente.apellido || '',
          email: prev.email || miCliente.email || '',
          telefono: prev.telefono || miCliente.telefono || '',
          dni: prev.dni || miCliente.dni || '',
        }));
        if (miCliente.dni) setDniEncontrado(true);
      })
      .catch(() => { /* sin cliente previo: el formulario queda manual */ });
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    if (fecha && cancha) fetchHorarios();
  }, [fecha, cancha]);

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
    setSuccess(false);

    if (!clienteData.nombre.trim()) return setError('El nombre es requerido');
    if (!clienteData.apellido.trim()) return setError('El apellido es requerido');
    if (!clienteData.email.trim()) return setError('El email es requerido');
    if (!clienteData.telefono.trim()) return setError('El teléfono es requerido');
    if (!horarioSeleccionado) return setError('Debes seleccionar un horario');

    setLoadingSubmit(true);
    try {
      // El cliente se resuelve en el servidor (el CRUD de clientes es admin-only)
      await turnoService.create({
        cancha_id:   parseInt(id, 10),
        cliente: {
          nombre:   clienteData.nombre.trim(),
          apellido: clienteData.apellido.trim(),
          email:    clienteData.email.trim(),
          telefono: clienteData.telefono.trim(),
          dni:      clienteData.dni.trim() || null,
        },
        fecha,
        hora_inicio: horarioSeleccionado.hora_inicio.slice(0, 5),
        hora_fin:    horarioSeleccionado.hora_fin.slice(0, 5),
        observaciones: '',
      });

      triggerRefresh();
      setSuccess(true);
      
      // Redirigir a mis reservas después de 2 segundos
      redirigirTimer.current = setTimeout(() => navigate('/mis-reservas'), 2000);

    } catch (err) {
      console.error('Error:', err.response?.data);
      setError(err.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const getMinDate = () => {
    const hoy = new Date();
    // Fecha local (no UTC): después de las 21 UTC-3 'hoy' dejaba de ser reservable
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!cancha) return <div className="error">Cancha no encontrada</div>;

  // ── PANTALLA DE ÉXITO ──────────────────────────────────────────────────────
  if (success) {
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
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>¡Reserva solicitada!</h2>
              <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                Tu reserva quedó pendiente de confirmación por el administrador. Pago 100% en el local.
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

              <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#92400e' }}>⏳ Próximos pasos:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '0.9rem' }}>
                  <li>El administrador revisará tu solicitud</li>
                  <li>Recibirás confirmación cuando sea aprobada</li>
                  <li>El pago se realiza directamente en el local el día del turno</li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/mis-reservas')}
                style={{
                  display: 'block', width: '100%', textAlign: 'center',
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white',
                  padding: '14px 24px', borderRadius: '10px', border: 'none',
                  fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
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

  // ── FORMULARIO DE RESERVA ────────────────────────────────────────────────────
  return (
    <div className="reservar-container">
      <div className="reservar-header">
        <button onClick={() => navigate('/')} className="reservar-btn-back">← Volver</button>
        <h1>Reservar Turno</h1>
      </div>

      <div className="reservar-content">
        <div className="reservar-cancha-info">
          <h2>{cancha.nombre}</h2>
          <p className="reservar-tipo">{cancha.tipo === 'futbol5' ? 'Fútbol 5' : 'Pádel'}</p>
          <p className="reservar-descripcion">{cancha.descripcion}</p>
          <p className="reservar-precio">Precio: ${fmtARS(cancha.precio_hora)} /hora</p>
        </div>

        {error && <div className="reservar-error-message">{error}</div>}

        {/* Información de reserva sin seña */}
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
          fontSize: '0.9rem', color: '#166534',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <div>
            <strong>Reserva sin seña:</strong> Tu solicitud queda <strong>pendiente de confirmación</strong> por el administrador.
            <br /><strong>Pago 100% en el local</strong> el día del turno. Sin pagos online.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="reservar-form">
          <div className="reservar-form-section">
            <h3>1. Seleccioná la fecha</h3>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              min={getMinDate()}
              required
              className="reservar-date-input"
            />
          </div>

          {fecha && (
            <div className="reservar-form-section">
              <h3>2. Seleccioná el horario</h3>
              {loadingHorarios ? (
                <p>Cargando horarios...</p>
              ) : horariosDisponibles.length > 0 ? (
                <div className="reservar-horarios-grid">
                  {horariosDisponibles.map((horario) => (
                    <button
                      key={horario.id}
                      type="button"
                      className={`reservar-horario-btn ${horarioSeleccionado?.id === horario.id ? 'selected' : ''}`}
                      onClick={() => setHorarioSeleccionado(horario)}
                    >
                      {horario.hora_inicio.slice(0, 5)} - {horario.hora_fin.slice(0, 5)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="reservar-no-horarios">No hay horarios disponibles para esta fecha</p>
              )}
            </div>
          )}

          {horarioSeleccionado && (
            <div className="reservar-form-section">
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>3. Tus datos</span>
                {dniEncontrado && <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'normal', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>Datos autocompletados ✅</span>}
              </h3>
              <div className="reservar-form-grid">
                {[
                  { label: 'DNI', name: 'dni', type: 'text' },
                  { label: 'Nombre *', name: 'nombre', type: 'text' },
                  { label: 'Apellido *', name: 'apellido', type: 'text' },
                  { label: 'Email *', name: 'email', type: 'email' },
                  { label: 'Teléfono *', name: 'telefono', type: 'tel' },
                ].map(({ label, name, type }) => (
                  <div className="reservar-form-group" key={name}>
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
            <div className="reservar-resumen">
              <h3>Resumen</h3>
              <p><strong>Cancha:</strong> {cancha.nombre}</p>
              <p><strong>Fecha:</strong> {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')}</p>
              <p><strong>Horario:</strong> {horarioSeleccionado.hora_inicio.slice(0, 5)} - {horarioSeleccionado.hora_fin.slice(0, 5)}</p>
              <p><strong>Pago total en el local:</strong> ${fmtARS(cancha.precio_hora)}</p>
              <p style={{ color: '#16a34a', fontSize: '0.9rem', fontWeight: '600' }}>
                Sin seña ni pagos online. Se paga todo el día del turno.
              </p>

              <button
                type="submit"
                className="reservar-btn-confirmar"
                disabled={loadingSubmit}
                style={{ opacity: loadingSubmit ? 0.7 : 1 }}
              >
                {loadingSubmit ? '⏳ Enviando solicitud...' : '✅ Solicitar reserva'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Reservar;