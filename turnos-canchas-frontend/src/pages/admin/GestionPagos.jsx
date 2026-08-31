import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pagosService } from '../../services/pagosService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/GestionPagos.css';
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination';
import { 
  Eye, Edit2, Trash2, Download, Filter, X, Plus, 
  CreditCard, DollarSign, CheckCircle, ChevronLeft, FileText, RotateCcw
} from 'lucide-react';

const ESTADOS_PAGO = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'fallido', label: 'Fallido' },
  { value: 'reembolsado', label: 'Reembolsado' }
];

const METODOS_PAGO = [
  { value: '', label: 'Todos' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mercadopago', label: 'MercadoPago' }
];

function GestionPagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [formData, setFormData] = useState({
    turno_id: '',
    monto: '',
    metodo_pago: 'efectivo',
    estado: 'pendiente',
    referencia: '',
    fecha_pago: ''
  });
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    estado: '',
    metodo_pago: '',
    fecha_desde: '',
    fecha_hasta: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async (page = 1) => {
    try {
      const filtrosActivos = { page, per_page: 15 };
      
      if (filtros.estado) filtrosActivos.estado = filtros.estado;
      if (filtros.metodo_pago) filtrosActivos.metodo_pago = filtros.metodo_pago;
      if (filtros.fecha_desde) filtrosActivos.fecha_desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) filtrosActivos.fecha_hasta = filtros.fecha_hasta;
      if (filtros.search) filtrosActivos.search = filtros.search;

      const response = await pagosService.getAll(filtrosActivos);
      
      if (response.data) {
        setPagos(response.data);
        setCurrentPage(response.current_page);
        setLastPage(response.last_page);
        setTotal(response.total);
      } else {
        setPagos(response);
        setCurrentPage(1);
        setLastPage(1);
        setTotal(response.length || 0);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar pagos:', err);
      setError('Error al cargar los pagos');
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const aplicarFiltros = () => {
    setLoading(true);
    setCurrentPage(1);
    fetchPagos(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      metodo_pago: '',
      fecha_desde: '',
      fecha_hasta: '',
      search: ''
    });
    setLoading(true);
    setTimeout(() => {
      fetchPagos();
    }, 100);
  };

  const handlePageChange = (page) => {
    setLoading(true);
    fetchPagos(page);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingPago) {
        await pagosService.update(editingPago.id, formData);
        Swal.fire('¡Actualizado!', 'El pago se ha actualizado correctamente.', 'success');
      } else {
        await pagosService.create(formData);
        Swal.fire('¡Creado!', 'El pago se ha registrado correctamente.', 'success');
      }
      
      setShowModal(false);
      resetForm();
      fetchPagos(currentPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el pago');
    }
  };

  const handleEdit = (pago) => {
    setEditingPago(pago);
    setFormData({
      turno_id: pago.turno_id || '',
      monto: pago.monto || '',
      metodo_pago: pago.metodo_pago || 'efectivo',
      estado: pago.estado || 'pendiente',
      referencia: pago.referencia || '',
      fecha_pago: pago.fecha_pago ? pago.fecha_pago.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El pago será eliminado del sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await pagosService.delete(id);
        fetchPagos(currentPage);
        Swal.fire('¡Eliminado!', 'El pago ha sido eliminado correctamente.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Hubo un problema al eliminar el pago.', 'error');
      }
    }
  };

  const handleVerDetalle = async (pago) => {
    try {
      const response = await pagosService.getById(pago.id);
      const p = response.data || response;
      Swal.fire({
        title: `Detalle del Pago #${p.id}`,
        html: `
          <div style="text-align: left; display: grid; gap: 12px; margin-top: 16px;">
            <div><strong>Turno:</strong> #${p.turno_id} - ${p.turno?.cancha?.nombre || 'N/A'}</div>
            <div><strong>Cliente:</strong> ${p.turno?.cliente?.nombre || ''} ${p.turno?.cliente?.apellido || ''}</div>
            <div><strong>Monto:</strong> $${Number(p.monto).toLocaleString('es-AR')}</div>
            <div><strong>Método:</strong> <span class="badge badge-${p.metodo_pago}">${getMetodoTexto(p.metodo_pago)}</span></div>
            <div><strong>Estado:</strong> <span class="badge badge-${p.estado}">${getEstadoTexto(p.estado)}</span></div>
            <div><strong>Referencia:</strong> ${p.referencia || '-'}</div>
            <div><strong>Fecha de pago:</strong> ${p.fecha_pago ? new Date(p.fecha_pago).toLocaleString('es-AR') : 'No pagado'}</div>
            <div><strong>Creado:</strong> ${new Date(p.created_at).toLocaleString('es-AR')}</div>
          </div>
        `,
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'Cerrar',
        width: '500px'
      });
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar los detalles.', 'error');
    }
  };

  const handleExportPdf = async () => {
    try {
      const blobData = await pagosService.exportPdf(filtros);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_pagos_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Swal.fire('Error', 'Hubo un problema al generar el PDF.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      turno_id: '',
      monto: '',
      metodo_pago: 'efectivo',
      estado: 'pendiente',
      referencia: '',
      fecha_pago: ''
    });
    setEditingPago(null);
    setError('');
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'pagado': return 'estado-pagado';
      case 'fallido': return 'estado-fallido';
      case 'reembolsado': return 'estado-reembolsado';
      default: return '';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'pagado': return 'Pagado';
      case 'fallido': return 'Fallido';
      case 'reembolsado': return 'Reembolsado';
      default: return estado;
    }
  };

  const getMetodoClass = (metodo) => {
    switch (metodo) {
      case 'efectivo': return 'metodo-efectivo';
      case 'tarjeta': return 'metodo-tarjeta';
      case 'transferencia': return 'metodo-transferencia';
      case 'mercadopago': return 'metodo-mercadopago';
      default: return '';
    }
  };

  const getMetodoTexto = (metodo) => {
    switch (metodo) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'transferencia': return 'Transferencia';
      case 'mercadopago': return 'MercadoPago';
      default: return metodo;
    }
  };

  const getMetodoIcon = (metodo) => {
    switch (metodo) {
      case 'efectivo': return <DollarSign size={16} />;
      case 'tarjeta': return <CreditCard size={16} />;
      case 'transferencia': return <CheckCircle size={16} />;
      case 'mercadopago': return <CheckCircle size={16} />;
      default: return <CreditCard size={16} />;
    }
  };

  if (loading) return <div className="loading">Cargando pagos...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          <ChevronLeft size={18} aria-hidden="true" /> Volver al Panel
        </button>
        <h1>Gestión de Pagos</h1>
        <button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-add"
        >
          <Plus size={18} aria-hidden="true" /> Nuevo Pago
        </button>
      </header>

      <div className="gestion-content">
        <div className="filtros-section">
          <h3>Filtros</h3>
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Buscar</label>
              <input
                type="text"
                name="search"
                placeholder="Turno, cliente, referencia..."
                value={filtros.search}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="filtro-item">
              <label>Estado</label>
              <select name="estado" value={filtros.estado} onChange={handleFiltroChange}>
                {ESTADOS_PAGO.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="filtro-item">
              <label>Método de pago</label>
              <select name="metodo_pago" value={filtros.metodo_pago} onChange={handleFiltroChange}>
                {METODOS_PAGO.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="filtro-item">
              <label>Fecha desde</label>
              <input type="date" name="fecha_desde" value={filtros.fecha_desde} onChange={handleFiltroChange} />
            </div>

            <div className="filtro-item">
              <label>Fecha hasta</label>
              <input type="date" name="fecha_hasta" value={filtros.fecha_hasta} onChange={handleFiltroChange} />
            </div>

            <div className="filtro-actions">
              <button onClick={aplicarFiltros} className="btn-aplicar">
                <Filter size={16} /> Aplicar
              </button>
              <button onClick={limpiarFiltros} className="btn-limpiar">
                <X size={16} /> Limpiar
              </button>
              {isSuperAdmin() && (
                <button onClick={handleExportPdf} className="btn-export">
                  <Download size={16} /> Exportar PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="pagos-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Turno</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Referencia</th>
                <th>Fecha Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">No hay pagos para mostrar</td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.id}</td>
                    <td>
                      <strong>#{pago.turno_id}</strong>
                      {pago.turno?.cancha && (
                        <>
                          <br />
                          <small className="text-muted">{pago.turno.cancha.nombre}</small>
                        </>
                      )}
                    </td>
                    <td>
                      {pago.turno?.cliente ? (
                        <>
                          {pago.turno.cliente.nombre} {pago.turno.cliente.apellido}
                          <br />
                          <small className="text-muted">{pago.turno.cliente.email}</small>
                        </>
                      ) : 'N/A'}
                    </td>
                    <td className="precio">${Number(pago.monto).toLocaleString('es-AR')}</td>
                    <td>
                      <span className={`metodo-badge ${getMetodoClass(pago.metodo_pago)}`}>
                        {getMetodoIcon(pago.metodo_pago)}
                        {getMetodoTexto(pago.metodo_pago)}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-badge ${getEstadoClass(pago.estado)}`}>
                        {getEstadoTexto(pago.estado)}
                      </span>
                    </td>
                    <td>{pago.referencia || '-'}</td>
                    <td>
                      {pago.fecha_pago ? (
                        new Date(pago.fecha_pago).toLocaleDateString('es-AR')
                      ) : (
                        <span className="text-muted">Pendiente</span>
                      )}
                    </td>
                    <td className="acciones">
                      <button 
                        onClick={() => handleVerDetalle(pago)}
                        className="btn-ver"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(pago)}
                        className="btn-edit"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      {isSuperAdmin() && (
                        <button 
                          onClick={() => handleDelete(pago.id)}
                          className="btn-delete"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-wrapper">
          <span className="pagination-info">Total: {total} pagos</span>
          <Pagination
            currentPage={currentPage}
            lastPage={lastPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPago ? 'Editar Pago' : 'Nuevo Pago'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">×</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Turno ID *</label>
                  <input
                    type="number"
                    name="turno_id"
                    value={formData.turno_id}
                    onChange={handleChange}
                    required
                    placeholder="ID del turno"
                    disabled={editingPago}
                  />
                </div>

                <div className="form-group">
                  <label>Monto *</label>
                  <input
                    type="number"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Método de Pago *</label>
                  <select name="metodo_pago" value={formData.metodo_pago} onChange={handleChange} required>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="mercadopago">MercadoPago</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado *</label>
                  <select name="estado" value={formData.estado} onChange={handleChange} required>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="fallido">Fallido</option>
                    <option value="reembolsado">Reembolsado</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Referencia / Transacción</label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  placeholder="Número de transacción, referencia bancaria, etc."
                />
              </div>

              <div className="form-group">
                <label>Fecha de Pago</label>
                <input
                  type="date"
                  name="fecha_pago"
                  value={formData.fecha_pago}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingPago ? 'Guardar Cambios' : 'Crear Pago'}
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