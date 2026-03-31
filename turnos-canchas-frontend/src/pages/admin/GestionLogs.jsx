import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/logs/export-pdf', {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Logs_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      alert('Hubo un error al intentar descargar el PDF.');
    } finally {
      setExportLoading(false);
    }
  };

  const limpiarTodosLogs = async () => {
    if (!confirm('⚠️ ATENCIÓN: Esta acción eliminará TODOS los logs del sistema permanentemente.\n\n¿Estás seguro de que querés continuar?')) return;
    setDeleteLoading('all');
    try {
      const token = localStorage.getItem('token');
      // Llamamos con id=1 (el backend limpia todo el archivo sin importar el id)
      await axios.delete('http://localhost:8000/api/logs/1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs([]);
      alert('✅ Logs limpiados correctamente.');
    } catch (err) {
      alert('Error al limpiar los logs.');
      console.error(err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getNivelColor = (nivel) => {
    const colores = {
      emergency: '#7f1d1d',
      alert: '#991b1b',
      critical: '#dc2626',
      error: '#ef4444',
      warning: '#f59e0b',
      notice: '#3b82f6',
      info: '#22c55e',
      debug: '#94a3b8',
    };
    return colores[nivel?.toLowerCase()] || '#94a3b8';
  };

  if (loading) return <div className="loading">Cargando logs del sistema...</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Logs del Sistema</h1>
        <button onClick={() => navigate('/admin')} className="btn-secondary">
          Volver al Panel
        </button>
      </header>

      <div className="admin-content" style={{ padding: '20px' }}>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: '8px', padding: '12px 20px',
            color: '#dc2626', marginBottom: '20px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Controles superiores */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p>
            Total de entradas: <strong>{logs.length}</strong>
            <span style={{ fontSize: '0.85em', color: '#888', marginLeft: '10px' }}>
              (mostrando los últimos 200 registros)
            </span>
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={exportarPDF}
              className="btn-primary"
              disabled={exportLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>📄</span>
              {exportLoading ? 'Generando...' : 'Exportar a PDF'}
            </button>
            <button
              onClick={limpiarTodosLogs}
              disabled={deleteLoading === 'all' || logs.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px',
                background: '#ef4444', color: 'white',
                border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontWeight: '600',
                opacity: (deleteLoading === 'all' || logs.length === 0) ? 0.6 : 1,
              }}
            >
              <span>🗑️</span>
              {deleteLoading === 'all' ? 'Limpiando...' : 'Limpiar todos los logs'}
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p>No hay logs registrados en el sistema.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px 12px' }}>Fecha y Hora</th>
                  <th style={{ padding: '10px 12px' }}>Nivel</th>
                  <th style={{ padding: '10px 12px' }}>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#555', fontSize: '0.9em' }}>
                      {new Date(log.logged_at).toLocaleString('es-AR')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: getNivelColor(log.level),
                        color: 'white',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8em',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        {log.level || 'info'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: '500px', wordBreak: 'break-word', fontSize: '0.9em' }}>
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionLogs;
