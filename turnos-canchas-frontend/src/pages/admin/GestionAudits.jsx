import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function GestionAudits() {
  const [audits, setAudits] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Nuevo estado para el botón de exportar
  const [exportLoading, setExportLoading] = useState(false); 
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchAudits = async (pageUrl = 'http://localhost:8000/api/audits') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(pageUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAudits(response.data.data); 
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        next_page_url: response.data.next_page_url,
        prev_page_url: response.data.prev_page_url,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error al cargar auditorías:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  // --- NUEVA FUNCIÓN PARA EXPORTAR A PDF ---
  const exportarPDF = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/audits/export-pdf', {
        responseType: 'blob', // Importante para recibir el archivo
        headers: { Authorization: `Bearer ${token}` }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Auditorias_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error al exportar el PDF:", error);
      alert("Hubo un error al intentar descargar el PDF.");
    } finally {
      setExportLoading(false);
    }
  };

  const traducirEvento = (evento) => {
    const eventos = { created: 'Creación', updated: 'Actualización', deleted: 'Eliminación' };
    return eventos[evento] || evento;
  };

  if (loading) return <div className="loading">Cargando registro de auditorías...</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Registro de Auditorías</h1>
        <button onClick={() => navigate('/admin')} className="btn-secondary">Volver al Panel</button>
      </header>

      <div className="admin-content" style={{ padding: '20px' }}>
        
        {/* --- CONTROLES SUPERIORES (Total y Botón de Exportar) --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p>Total de registros históricos: <strong>{pagination.total}</strong></p>
          
          <button 
            onClick={exportarPDF} 
            className="btn-primary"
            disabled={exportLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📄</span>
            {exportLoading ? 'Generando...' : 'Exportar a PDF'}
          </button>
        </div>
        
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Tabla Afectada</th>
                <th>IP / Navegador</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{new Date(audit.created_at).toLocaleString('es-AR')}</td>
                  <td>{audit.user ? audit.user.name : 'Sistema'}</td>
                  <td>
                    <span className={`badge badge-${audit.event}`}>
                      {traducirEvento(audit.event)}
                    </span>
                  </td>
                  <td>
                    {audit.auditable_type.split('\\').pop()} (ID: {audit.auditable_id})
                  </td>
                  <td style={{ fontSize: '0.85em', color: '#666' }}>{audit.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
          <button 
            className="btn-secondary"
            disabled={!pagination.prev_page_url} 
            onClick={() => fetchAudits(pagination.prev_page_url)}
          >
            &laquo; Anterior
          </button>
          
          <span style={{ padding: '8px' }}>
            Página {pagination.current_page} de {pagination.last_page}
          </span>
          
          <button 
            className="btn-secondary"
            disabled={!pagination.next_page_url} 
            onClick={() => fetchAudits(pagination.next_page_url)}
          >
            Siguiente &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}

export default GestionAudits;