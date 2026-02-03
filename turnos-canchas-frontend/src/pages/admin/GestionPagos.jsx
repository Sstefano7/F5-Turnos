import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pagoService } from '../../services/pagoService';
import { turnoService } from '../../services/turnoService';
import { useDashboard } from '../../context/DashboardContext';
import '../../styles/GestionPagos.css';

function GestionPagos() {
  const [pagos, setPagos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [formData, setFormData] = useState({
    turno_id: '',
    monto: '',
    metodo_pago: 'efectivo',
    estado: 'pendiente'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { triggerRefresh } = useDashboard();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pagosData, turnosData, statsData] = await Promise.all([
        pagoService.getAll(),
        turnoService.getAll(),
        pagoService.getEstadisticas()
      ]);
      
      setPagos(pagosData);
      setTurnos(turnosData);
      setEstadisticas(statsData);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingPago) {
        await pagoService.update(editingPago.id, formData);
      } else {
        await pagoService.create(formData);
        
        // Si el pago está confirmado o completado, actualizar el turno a confirmado
        if ((formData.estado === 'confirmado' || formData.estado === 'completado') && formData.turno_id) {
          await turnoService.update(formData.turno_id, { estado: 'confirmado' });
        }
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
      triggerRefresh(); // Actualizar el dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el pago');
    }
  };

  const handleEdit = (pago) => {
    setEditingPago(pago);
    setFormData({
      turno_id: pago.turno_id,
      monto: pago.monto,
      metodo_pago: pago.metodo_pago,
      estado: pago.estado
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este pago?')) {
      return;
    }

    try {
      await pagoService.delete(id);
      fetchData();
      triggerRefresh(); // Actualizar el dashboard
    } catch (err) {
      alert('Error al eliminar el pago');
    }
  };

  const resetForm = () => {
    setFormData({
      turno_id: '',
      monto: '',
      metodo_pago: 'efectivo',
      estado: 'pendiente'
    });
    setEditingPago(null);
    setError('');
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });

    // Si se selecciona un turno, autocompletar el monto
    if (e.target.name === 'turno_id' && value) {
      const turno = turnos.find(t => t.id === parseInt(value));
      if (turno) {
        setFormData(prev => ({
          ...prev,
          monto: turno.precio
        }));
      }
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'completado': return 'estado-completado';
      case 'reembolsado': return 'estado-reembolsado';
      default: return '';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'completado': return 'Completado';
      case 'reembolsado': return 'Reembolsado';
      default: return estado;
    }
  };

  const getMetodoPagoIcon = (metodo) => {
    switch (metodo) {
      case 'efectivo': return '💵';
      case 'tarjeta': return '💳';
      case 'transferencia': return '🏦';
      default: return '💰';
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Volver al Panel
        </button>
        <h1>Gestión de Pagos</h1>
        <button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-add"
        >
          + Registrar Pago
        </button>
      </header>

      <div className="gestion-content">
        {/* Estadísticas */}
        {estadisticas && (
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>${estadisticas.total_ingresos.toFixed(2)}</h3>
                <p>Ingresos Totales</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>${estadisticas.pagos_pendientes.toFixed(2)}</h3>
                <p>Pagos Pendientes</p>
              </div>
            </div>

            <div className="stat-card blue">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{estadisticas.total_pagos}</h3>
                <p>Total de Pagos</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">✓</div>
              <div className="stat-info">
                <h3>{estadisticas.pagos_completados}</h3>
                <p>Pagos Completados</p>
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {/* Tabla de pagos */}
        <div className="pagos-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Turno</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Fecha Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                    No hay pagos registrados
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.id}</td>
                    <td>
                      {pago.turno.cancha.nombre}
                      <br />
                      <small style={{ color: '#666' }}>
                        {pago.turno.fecha.split('T')[0].split('-').reverse().join('/')} - {pago.turno.hora_inicio.slice(0, 5)}
                      </small>
                    </td>
                    <td>
                      {pago.turno.cliente.nombre} {pago.turno.cliente.apellido}
                    </td>
                    <td>
                      <a href={`tel:${pago.turno.cliente.telefono}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                        {pago.turno.cliente.telefono || '-'}
                      </a>
                    </td>
                    <td className="precio">${pago.monto}</td>
                    <td>
                      <span className="metodo-badge">
                        {getMetodoPagoIcon(pago.metodo_pago)} {pago.metodo_pago}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-badge ${getEstadoClass(pago.estado)}`}>
                        {getEstadoTexto(pago.estado)}
                      </span>
                    </td>
                    <td>
                      {pago.fecha_pago 
                        ? new Date(pago.fecha_pago).toLocaleDateString('es-AR')
                        : '-'}
                    </td>
                    <td className="acciones">
                      <button 
                        onClick={() => handleEdit(pago)}
                        className="btn-edit"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(pago.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPago ? 'Editar Pago' : 'Registrar Pago'}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="btn-close"
              >
                ×
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Turno *</label>
                <select
                  name="turno_id"
                  value={formData.turno_id}
                  onChange={handleChange}
                  required
                  disabled={editingPago}
                >
                  <option value="">Seleccionar turno</option>
                  {turnos
                    .filter(t => t.estado === 'confirmado' || t.estado === 'completado')
                    .map((turno) => (
                      <option key={turno.id} value={turno.id}>
                        {turno.cancha.nombre} - {turno.fecha.split('T')[0]} - {turno.cliente.nombre} {turno.cliente.apellido} - ${turno.precio}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Monto *</label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Método de Pago *</label>
                <select
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  required
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="transferencia">🏦 Transferencia</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="completado">Completado</option>
                  <option value="reembolsado">Reembolsado</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingPago ? 'Guardar Cambios' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionPagos;