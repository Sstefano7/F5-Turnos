import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/GestionAudits.css';
import Swal from 'sweetalert2';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';

function GestionAudits() {
  const [audits, setAudits] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchAudits = async (page = 1) => {
    setLoading(true);
    try {
      const response = await auditService.getAll({ page, per_page: 15 });
      
      if (response.data) {
        setAudits(response.data);
        setPagination({
          current_page: response.current_page,
          last_page: response.last_page,
          next_page_url: response.next_page_url,
          prev_page_url: response.prev_page_url,
          total: response.total
        });
      } else {
        setAudits(response);
        setPagination({
          current_page: 1,
          last_page: 1,
          total: response.length || 0
        });
      }
    } catch (error) {
      console.error('Error al cargar auditorías:', error);
      Swal.fire('Error', 'No se pudieron cargar las auditorías.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const exportarPDF = async () => {
    setExportLoading(true);
    try {
      const blobData = await auditService.exportPdf();
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Auditorias_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      Swal.fire('¡Éxito!', 'PDF generado correctamente.', 'success');
    } catch (error) {
      console.error("Error al exportar el PDF:", error);
      Swal.fire('Error', 'Hubo un error al intentar descargar el PDF.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const traducirEvento = (evento) => {
    const eventos = { created: 'Creación', updated: 'Actualización', deleted: 'Eliminación' };
    return eventos[evento] || evento;
  };

  const getEventClass = (evento) => {
    switch (evento) {
      case 'created': return 'badge-created';
      case 'updated': return 'badge-updated';
      case 'deleted': return 'badge-deleted';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Cargando registro de auditorías...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          <ChevronLeft size={18} aria-hidden="true" /> Volver al Panel
        </button>
        <h1>Registro de Auditorías</h1>
      </header>

      <div className="gestion-content">
        <div className="audits-header">
          <p className="audits-total">Total de registros históricos: <strong>{pagination.total}</strong></p>
          
          <button 
            onClick={exportarPDF} 
            className="btn-primary"
            disabled={exportLoading}
          >
            <FileText size={18} aria-hidden="true" />
            {exportLoading ? 'Generando...' : 'Exportar a PDF'}
          </button>
        </div>

        <div className="audits-table-wrapper">
          <table className="audits-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Tabla Afectada</th>
                <th>IP / Navegador</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">No hay auditorías registradas</td>
                </tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.id}>
                    <td>{new Date(audit.created_at).toLocaleString('es-AR')}</td>
                    <td>{audit.user ? audit.user.name : 'Sistema'}</td>
                    <td>
                      <span className={`badge ${getEventClass(audit.event)}`}>
                        {traducirEvento(audit.event)}
                      </span>
                    </td>
                    <td>
                      {audit.auditable_type.split('\\').pop()} (ID: {audit.auditable_id})
                    </td>
                    <td className="ip-cell">{audit.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="pagination-controls">
          <button 
            className="btn-secondary"
            disabled={!pagination.prev_page_url} 
            onClick={() => fetchAudits(pagination.current_page - 1)}
          >
            <ChevronLeft size={18} aria-hidden="true" /> Anterior
          </button>
          
          <span className="pagination-info">
            Página {pagination.current_page} de {pagination.last_page}
          </span>
          
          <button 
            className="btn-secondary"
            disabled={!pagination.next_page_url} 
            onClick={() => fetchAudits(pagination.current_page + 1)}
          >
            Siguiente <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default GestionAudits;