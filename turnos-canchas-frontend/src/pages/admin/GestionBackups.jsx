import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

function GestionBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/backups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBackups(response.data);
    } catch (error) {
      console.error('Error al cargar los backups:', error);
      Swal.fire('Error', 'No se pudieron cargar los backups.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

const crearBackup = async () => {
    setCreating(true);
    Swal.fire({
      title: 'Generando Backup...',
      text: 'Por favor espera, esto puede tardar entre 10 y 30 segundos...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/backups/create', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire('¡Éxito!', 'El backup se ha generado y comprimido correctamente.', 'success');
      fetchBackups(); // Recargamos la tabla
    } catch (error) {
      console.error('Error al crear backup:', error.response?.data);
      // Aquí mostramos el error EXACTO que nos devuelve Laravel
      const mensajeError = error.response?.data?.error || 'Hubo un problema de conexión al generar el backup.';
      Swal.fire('Error del Servidor', mensajeError, 'error');
    } finally {
      setCreating(false);
    }
  };

  const descargarBackup = async (fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/backups/download/${fileName}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });

      // Lógica para descargar el archivo zip
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error al descargar:", error);
      Swal.fire('Error', 'No se pudo descargar el archivo.', 'error');
    }
  };

  if (loading) return <div className="loading">Cargando copias de seguridad...</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Gestión de Backups</h1>
        <button onClick={() => navigate('/admin')} className="btn-secondary">Volver al Panel</button>
      </header>

      <div className="admin-content" style={{ padding: '20px' }}>
        
        {/* ARREGLO VISUAL DEL TEXTO Y EL BOTÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <p style={{ color: '#333', fontSize: '1.1rem', margin: 0 }}>
            Historial de copias de seguridad de la base de datos y archivos.
          </p>
          
          <button 
            onClick={crearBackup} 
            className="btn-primary"
            disabled={creating}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: 'fit-content' }}
          >
            <span style={{ fontSize: '1.2rem' }}>💾</span>
            {creating ? 'Comprimiendo...' : 'Crear Nuevo Backup'}
          </button>
        </div>
        
        <div className="table-responsive">
          <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th>Nombre del Archivo</th>
                <th>Tamaño</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No hay backups disponibles.</td>
                </tr>
              ) : (
                backups.map((backup, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td><strong>{backup.name}</strong></td>
                    <td>{backup.size}</td>
                    <td>{backup.date}</td>
                    <td>
                      <button 
                        onClick={() => descargarBackup(backup.name)}
                        style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        ⬇️ Descargar
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

export default GestionBackups;