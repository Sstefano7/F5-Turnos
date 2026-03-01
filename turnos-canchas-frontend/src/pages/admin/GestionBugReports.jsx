import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bugReportService } from '../../services/bugReportService';
import Pagination from '../../components/Pagination';
import '../../styles/GestionBugReports.css';

function GestionBugReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    
    tipo: '',
    estado: '',
    prioridad: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (page = 1) => {
  try {
    const filtrosActivos = { page, per_page: 15 };
    
    if (filtros.tipo) filtrosActivos.tipo = filtros.tipo;
    if (filtros.estado) filtrosActivos.estado = filtros.estado;
    if (filtros.prioridad) filtrosActivos.prioridad = filtros.prioridad;

    const response = await bugReportService.getAll(filtrosActivos);
    
    console.log('Response completa:', response); // Para debug
    
    // Manejar respuesta paginada o array directo
    if (response.data) {
      setReports(response.data);
      setCurrentPage(response.current_page || 1);
      setLastPage(response.last_page || 1);
    } else {
      // Si no viene paginado, es un array directo
      setReports(response);
      setCurrentPage(1);
      setLastPage(1);
    }
    
    setLoading(false);
  } catch (err) {
    console.error('Error completo:', err);
    setError('Error al cargar los reportes');
    setReports([]); // Inicializar como array vacío
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
    fetchReports(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: '',
      estado: '',
      prioridad: ''
    });
    setLoading(true);
    setTimeout(() => {
      fetchReports(1);
    }, 100);
  };

  const handlePageChange = (page) => {
    setLoading(true);
    fetchReports(page);
  };

  const handleCambiarEstado = async (reportId, nuevoEstado) => {
    try {
      await bugReportService.update(reportId, { estado: nuevoEstado });
      fetchReports(currentPage);
    } catch (err) {
      alert('Error al cambiar el estado');
    }
  };

  const handleCambiarPrioridad = async (reportId, nuevaPrioridad) => {
    try {
      await bugReportService.update(reportId, { prioridad: nuevaPrioridad });
      fetchReports(currentPage);
    } catch (err) {
      alert('Error al cambiar la prioridad');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este reporte?')) {
      return;
    }

    try {
      await bugReportService.delete(id);
      fetchReports(currentPage);
    } catch (err) {
      alert('Error al eliminar el reporte');
    }
  };

  const handleVerDetalles = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'bug': return '🐛';
      case 'mejora': return '💡';
      case 'pregunta': return '❓';
      default: return '📋';
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'nuevo': return 'estado-nuevo';
      case 'en_revision': return 'estado-revision';
      case 'en_progreso': return 'estado-progreso';
      case 'resuelto': return 'estado-resuelto';
      case 'cerrado': return 'estado-cerrado';
      default: return '';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'nuevo': return 'Nuevo';
      case 'en_revision': return 'En Revisión';
      case 'en_progreso': return 'En Progreso';
      case 'resuelto': return 'Resuelto';
      case 'cerrado': return 'Cerrado';
      default: return estado;
    }
  };

  const getPrioridadClass = (prioridad) => {
    switch (prioridad) {
      case 'baja': return 'prioridad-baja';
      case 'media': return 'prioridad-media';
      case 'alta': return 'prioridad-alta';
      case 'critica': return 'prioridad-critica';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Volver al Panel
        </button>
        <h1>Gestión de Reportes de Bugs</h1>
      </header>

      <div className="gestion-content">
        {/* Filtros */}
        <div className="filtros-section">
          <h3>Filtros</h3>
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Tipo</label>
              <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
                <option value="">Todos</option>
                <option value="bug">Bug</option>
                <option value="mejora">Mejora</option>
                <option value="pregunta">Pregunta</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>Estado</label>
              <select name="estado" value={filtros.estado} onChange={handleFiltroChange}>
                <option value="">Todos</option>
                <option value="nuevo">Nuevo</option>
                <option value="en_revision">En Revisión</option>
                <option value="en_progreso">En Progreso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>Prioridad</label>
              <select name="prioridad" value={filtros.prioridad} onChange={handleFiltroChange}>
                <option value="">Todas</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
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

        {/* Tabla de reportes */}
        <div className="reports-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Usuario</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    No hay reportes para mostrar
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.id}</td>
                    <td>
                      <span className="tipo-icon">{getTipoIcon(report.tipo)}</span>
                    </td>
                    <td>
                      <strong>{report.titulo}</strong>
                      <br />
                      <small style={{ color: '#666' }}>
                        {report.descripcion.substring(0, 50)}...
                      </small>
                    </td>
                    <td>{report.user ? report.user.name : 'Anónimo'}</td>
                    <td>
                      <select
                        className={`prioridad-select ${getPrioridadClass(report.prioridad)}`}
                        value={report.prioridad}
                        onChange={(e) => handleCambiarPrioridad(report.id, e.target.value)}
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className={`estado-select ${getEstadoClass(report.estado)}`}
                        value={report.estado}
                        onChange={(e) => handleCambiarEstado(report.id, e.target.value)}
                      >
                        <option value="nuevo">Nuevo</option>
                        <option value="en_revision">En Revisión</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                    </td>
                    <td>
                      {new Date(report.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="acciones">
                      <button
                        onClick={() => handleVerDetalles(report)}
                        className="btn-ver"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleEliminar(report.id)}
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

        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modal de detalles */}
      {showDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Reporte #{selectedReport.id}</h2>
              <button onClick={() => setShowDetailModal(false)} className="btn-close">
                ×
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <h3>{getTipoIcon(selectedReport.tipo)} {selectedReport.titulo}</h3>
                <div className="detail-badges">
                  <span className={`badge ${getPrioridadClass(selectedReport.prioridad)}`}>
                    Prioridad: {selectedReport.prioridad}
                  </span>
                  <span className={`badge ${getEstadoClass(selectedReport.estado)}`}>
                    {getEstadoTexto(selectedReport.estado)}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Descripción</h4>
                <p>{selectedReport.descripcion}</p>
              </div>

              {selectedReport.pasos_reproducir && (
                <div className="detail-section">
                  <h4>Pasos para Reproducir</h4>
                  <pre>{selectedReport.pasos_reproducir}</pre>
                </div>
              )}

              <div className="detail-section">
                <h4>Información Adicional</h4>
                <ul>
                  <li><strong>Usuario:</strong> {selectedReport.user ? selectedReport.user.name : 'Anónimo'}</li>
                  <li><strong>Página:</strong> {selectedReport.pagina || 'No especificada'}</li>
                  <li><strong>Navegador:</strong> {selectedReport.navegador || 'No especificado'}</li>
                  <li><strong>Fecha:</strong> {new Date(selectedReport.created_at).toLocaleString('es-AR')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionBugReports;