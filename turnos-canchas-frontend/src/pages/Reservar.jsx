import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canchaService } from '../services/canchaService';
import { turnoService } from '../services/turnoService';
import { clienteService } from '../services/clienteService';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Datos del cliente
  const [clienteData, setClienteData] = useState({
    nombre: '',
    apellido: '',
    email: user?.email || '',
    telefono: '',
    dni: ''
  });

  // Cargar datos de la cancha
  useEffect(() => {
    const fetchCancha = async () => {
      try {
        const data = await canchaService.getById(id);
        setCancha(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar la cancha');
        setLoading(false);
      }
    };

    fetchCancha();
  }, [id]);

  // Cargar horarios cuando se selecciona una fecha
  useEffect(() => {
    if (fecha && cancha) {
      fetchHorarios();
    }
  }, [fecha, cancha]);

  const fetchHorarios = async () => {
    setLoadingHorarios(true);
    setHorarioSeleccionado(null);
    try {
      const horarios = await canchaService.getHorariosDisponibles(id, fecha);
      setHorariosDisponibles(horarios);
    } catch (err) {
      setError('Error al cargar horarios disponibles');
    } finally {
      setLoadingHorarios(false);
    }
  };

  const handleClienteChange = (e) => {
    setClienteData({
      ...clienteData,
      [e.target.name]: e.target.value
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!horarioSeleccionado) {
    setError('Debe seleccionar un horario');
    return;
  }

  try {
    // Intentar crear el cliente, si ya existe usar ese ID
    let clienteId;
    
    try {
      const cliente = await clienteService.create(clienteData);
      clienteId = cliente.id;
    } catch (err) {
      // Si el email ya existe, obtener todos los clientes y buscar por email
      if (err.response?.data?.errors?.email) {
        const clientes = await clienteService.getAll();
        const clienteExistente = clientes.find(c => c.email === clienteData.email);
        if (clienteExistente) {
          clienteId = clienteExistente.id;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // Crear el turno
    const turnoData = {
      cancha_id: parseInt(id),
      cliente_id: clienteId,
      fecha: fecha,
      hora_inicio: horarioSeleccionado.hora_inicio,
      hora_fin: horarioSeleccionado.hora_fin,
      observaciones: ''
    };

    await turnoService.create(turnoData);
    setSuccess(true);
    triggerRefresh(); // Actualizar el dashboard

    // Redirigir después de 2 segundos
    setTimeout(() => {
      navigate('/mis-reservas');
    }, 2000);

  } catch (err) {
    console.error('Error completo:', err.response?.data);
    setError(err.response?.data?.message || 'Error al crear la reserva');
  }
};

  // Obtener fecha mínima (hoy)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!cancha) return <div className="error">Cancha no encontrada</div>;

  if (success) {
    return (
      <div className="success-container">
        <div className="success-box">
          <h2>✓ ¡Reserva exitosa!</h2>
          <p>Tu reserva ha sido confirmada.</p>
          <p>Redirigiendo a tus reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reservar-container">
      <div className="reservar-header">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Volver
        </button>
        <h1>Reservar Turno</h1>
      </div>

      <div className="reservar-content">
        <div className="cancha-info">
          <h2>{cancha.nombre}</h2>
          <p className="tipo">
            {cancha.tipo === 'futbol5' ? 'Fútbol 5' : 'Pádel'}
          </p>
          <p className="descripcion">{cancha.descripcion}</p>
          <p className="precio">Precio: ${cancha.precio_hora} / hora</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="reserva-form">
          <div className="form-section">
            <h3>1. Selecciona la fecha</h3>
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
              <h3>2. Selecciona el horario</h3>
              {loadingHorarios ? (
                <p>Cargando horarios...</p>
              ) : horariosDisponibles.length > 0 ? (
                <div className="horarios-grid">
                  {horariosDisponibles.map((horario) => (
                    <button
                      key={horario.id}
                      type="button"
                      className={`horario-btn ${
                        horarioSeleccionado?.id === horario.id ? 'selected' : ''
                      }`}
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
              <h3>3. Datos del cliente</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={clienteData.nombre}
                    onChange={handleClienteChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Apellido *</label>
                  <input
                    type="text"
                    name="apellido"
                    value={clienteData.apellido}
                    onChange={handleClienteChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={clienteData.email}
                    onChange={handleClienteChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={clienteData.telefono}
                    onChange={handleClienteChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>DNI</label>
                  <input
                    type="text"
                    name="dni"
                    value={clienteData.dni}
                    onChange={handleClienteChange}
                  />
                </div>
              </div>
            </div>
          )}

          {horarioSeleccionado && (
            <div className="resumen-reserva">
              <h3>Resumen de la reserva</h3>
              <p><strong>Cancha:</strong> {cancha.nombre}</p>
              <p><strong>Fecha:</strong> {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')}</p>
              <p><strong>Horario:</strong> {horarioSeleccionado.hora_inicio.slice(0, 5)} - {horarioSeleccionado.hora_fin.slice(0, 5)}</p>
              <p className="total"><strong>Total:</strong> ${cancha.precio_hora}</p>
              
              <button type="submit" className="btn-confirmar">
                Confirmar Reserva
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Reservar;