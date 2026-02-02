import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { turnoService } from '../../services/turnoService';
import '../../styles/GestionTurnos.css';

function GestionTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fecha: '',
    estado: '',
    cancha_id: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
      try {
        // Crear objeto de filtros solo con valores que no estén vacíos
        const filtrosActivos = {};
        if (filtros.fecha) filtrosActivos.fecha = filtros.fecha;
        if (filtros.estado) filtrosActivos.estado = filtros.estado;
        if (filtros.cancha_id) filtrosActivos.cancha_id = filtros.cancha_id;

        const data = await turnoService.getAll(filtrosActivos);
        console.log('Turnos cargados:', data); // Para debug
        setTurnos(data);
        setLoading(false);
      } catch (err) {
        console.error('Error completo:', err);
        setError('Error al cargar los turnos: ' + (err.message || 'Error desconocido'));
        setLoading(false);
      }
  }

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const aplicarFiltros = () => {
    setLoading(true);
    fetchTurnos();
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha: '',
      estado: '',
      cancha_id: ''
    });
    setLoading(true);
    setTimeout(() => {
      fetchTurnos();
    }, 100);
  };

  const handleCambiarEstado = async (turnoId, nuevoEstado) => {
    if (!window.confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) {
      return;
    }

    try {
      await turnoService.update(turnoId, { estado: nuevoEstado });
      fetchTurnos();
    } catch (err) {
      alert('Error al cambiar el estado del turno');
    }
  };

  const handleEliminar = async (turnoId) => {
    if (!window.confirm('¿Estás seguro de eliminar este turno?')) {
      return;
    }

    try {
      await turnoService.delete(turnoId);
      fetchTurnos();
    } catch (err) {
      alert('Error al eliminar el turno');
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

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Volver al Panel
        </button>
        <h1>Gestión de Turnos</h1>
      </header>

      <div className="gestion-content">
        <div className="filtros-section">
          <h3>Filtros</h3>
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Fecha</label>
              <input
                type="date"
                name="fecha"
                value={filtros.fecha}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="filtro-item">
              <label>Estado</label>
              <select
                name="estado"
                value={filtros.estado}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            <div className="filtro-actions">
              <button onClick={aplicarFiltros} className="btn-aplicar">
                Aplicar Filtros
              </button>
              <button onClick={limpiarFiltros} className="btn-limpiar">
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="turnos-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cancha</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnos.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    No hay turnos para mostrar
                  </td>
                </tr>
              ) : (
                turnos.map((turno) => (
                  <tr key={turno.id}>
                    <td>{turno.id}</td>
                    <td>{turno.cancha.nombre}</td>
                    <td>
                      {turno.cliente.nombre} {turno.cliente.apellido}
                      <br />
                      <small style={{ color: '#666' }}>{turno.cliente.email}</small>
                    </td>
                    <td>
                      {turno.fecha.split('T')[0].split('-').reverse().join('/')}
                    </td>
                    <td>
                      {turno.hora_inicio.slice(0, 5)} - {turno.hora_fin.slice(0, 5)}
                    </td>
                    <td className="precio">${turno.precio}</td>
                    <td>
                      <span className={`estado-badge ${getEstadoClass(turno.estado)}`}>
                        {getEstadoTexto(turno.estado)}
                      </span>
                    </td>
                    <td className="acciones">
                      <div className="dropdown">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleCambiarEstado(turno.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="select-estado"
                        >
                          <option value="">Cambiar estado</option>
                          {turno.estado !== 'pendiente' && (
                            <option value="pendiente">Pendiente</option>
                          )}
                          {turno.estado !== 'confirmado' && (
                            <option value="confirmado">Confirmado</option>
                          )}
                          {turno.estado !== 'cancelado' && (
                            <option value="cancelado">Cancelado</option>
                          )}
                          {turno.estado !== 'completado' && (
                            <option value="completado">Completado</option>
                          )}
                        </select>
                      </div>
                      <button
                        onClick={() => handleEliminar(turno.id)}
                        className="btn-delete"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GestionTurnos;