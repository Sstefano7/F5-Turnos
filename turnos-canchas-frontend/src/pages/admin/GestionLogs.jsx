import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logsService } from '../../services/logsService';
import '../../styles/GestionLogs.css';
import Swal from 'sweetalert2';
import { ChevronLeft, FileText, Trash2 } from 'lucide-react';

const NIVELES = {
  emergency: { label: 'EMERGENCY', class: 'nivel-emergency' },
  alert: { label: 'ALERT', class: 'nivel-alert' },
  critical: { label: 'CRITICAL', class: 'nivel-critical' },
  error: { label: 'ERROR', class: 'nivel-error' },
  warning: { label: 'WARNING', class: 'nivel-warning' },
  notice: { label: 'NOTICE', class: 'nivel-notice' },
  info: { label: 'INFO', class: 'nivel-info' },
  debug: { label: 'DEBUG', class: 'nivel-debug' },
};

function GestionLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await logsService.getAll({ per_page: 200 });
      setLogs(response.data || response);
    } catch (err) {
      setError('Error al cargar los logs del sistema.');
      console.error('Error al cargar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const exportarPDF = async () => {
    setExportLoading(true);
    try {
      const blobData = await logsService.exportPdf();
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Logs_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      Swal.fire('¡Éxito!', 'PDF generado correctamente.', 'success');
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      Swal.fire('Error', 'Hubo un error al intentar descargar el PDF.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const limpiarTodosLogs = async () => {
    const result = await Swal.fire({
      title: '⚠️ ATENCIÓN',
      text: 'Esta acción eliminará TODOS los logs del sistema permanentemente.\n\n¿Estás seguro de que querés continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setDeleteLoading('all');
    try {
      await logsService.delete('all');
      setLogs([]);
      Swal.fire('¡Éxito!', 'Logs limpiados correctamente.', 'success');
    } catch (err) {
      Swal.fire('Error', 'Error al limpiar los logs.', 'error');
      console.error(err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getNivelInfo = (nivel) => {
    return NIVELES[nivel?.toLowerCase()] || { label: nivel?.toUpperCase() || 'INFO', class: 'nivel-info' };
  };

  if (loading) return <div className="loading">Cargando logs del sistema...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          <ChevronLeft size={18} aria-hidden="true" /> Volver al Panel
        </button>
        <h1>Logs del Sistema</h1>
      </header>

      <div className="gestion-content">
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="logs-header">
          <p className="logs-total">
            Total de entradas: <strong>{logs.length}</strong>
            <span className="logs-note">(mostrando los últimos 200 registros)</span>
          </p>
          <div className="logs-actions">
            <button
              onClick={exportarPDF}
              className="btn-primary"
              disabled={exportLoading}
            >
              <FileText size={18} aria-hidden="true" />
              {exportLoading ? 'Generando...' : 'Exportar a PDF'}
            </button>
            <button
              onClick={limpiarTodosLogs}
              disabled={deleteLoading === 'all' || logs.length === 0}
              className="btn-danger"
            >
              <Trash2 size={18} aria-hidden="true" />
              {deleteLoading === 'all' ? 'Limpiando...' : 'Limpiar todos los logs'}
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="logs-empty">
            <div className="logs-empty-icon">📋</div>
            <p>No hay logs registrados en el sistema.</p>
          </div>
        ) : (
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Nivel</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const nivelInfo = getNivelInfo(log.level);
                  return (
                    <tr key={log.id}>
                      <td className="log-date">
                        {new Date(log.logged_at).toLocaleString('es-AR')}
                      </td>
                      <td>
                        <span className={`nivel-badge ${nivelInfo.class}`}>
                          {nivelInfo.label}
                        </span>
                      </td>
                      <td className="log-message">{log.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionLogs;