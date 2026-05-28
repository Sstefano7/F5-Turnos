import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import backupScheduleService from '../../services/backupScheduleService';

const DIAS = [
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
];

function GestionBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ dia_semana: 'lunes', hora: '08:00', activo: true });

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

  const fetchSchedules = async () => {
    try {
      const data = await backupScheduleService.getAll();
      setSchedules(data);
    } catch (error) {
      console.error('Error al cargar programaciones:', error);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchSchedules();
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
      fetchBackups();
    } catch (error) {
      console.error('Error al crear backup:', error.response?.data);
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

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await backupScheduleService.create(scheduleForm);
      Swal.fire('¡Creado!', 'Backup programado correctamente.', 'success');
      setShowScheduleModal(false);
      setScheduleForm({ dia_semana: 'lunes', hora: '08:00', activo: true });
      fetchSchedules();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al programar el backup.', 'error');
    }
  };

  const handleDeleteSchedule = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar programación?',
      text: 'El backup programado se eliminará',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await backupScheduleService.delete(id);
      Swal.fire('Eliminado', 'Programación eliminada.', 'success');
      fetchSchedules();
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar la programación.', 'error');
    }
  };

  const handleToggleActive = async (schedule) => {
    try {
      await backupScheduleService.update(schedule.id, { activo: !schedule.activo });
      fetchSchedules();
    } catch (error) {
      Swal.fire('Error', 'No se pudo actualizar el estado.', 'error');
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

        {/* ── SECCIÓN BACKUPS AUTOMÁTICOS ── */}
        <div style={{ marginTop: '40px', borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>🔄 Backups Automáticos</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="btn-primary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
            >
              + Agregar Programación
            </button>
          </div>

          {schedules.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
              No hay backups automáticos configurados. Agregá uno para que se ejecute solo.
            </p>
          ) : (
            <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th>Día</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ textTransform: 'capitalize' }}>{s.dia_semana}</td>
                    <td>{s.hora}</td>
                    <td>
                      <span
                        onClick={() => handleToggleActive(s)}
                        style={{
                          cursor: 'pointer',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          background: s.activo ? '#dcfce7' : '#f1f5f9',
                          color: s.activo ? '#16a34a' : '#64748b',
                        }}
                      >
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '12px' }}>
            ⏱️ El sistema verifica cada minuto si hay un backup programado para el día y hora actual.
          </p>
        </div>

        {/* ── MODAL AGREGAR PROGRAMACIÓN ── */}
        {showScheduleModal && (
          <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2>Programar Backup Automático</h2>
                <button onClick={() => setShowScheduleModal(false)} className="btn-close">×</button>
              </div>

              <form onSubmit={handleCreateSchedule}>
                <div className="form-group">
                  <label>Día de la semana</label>
                  <select
                    value={scheduleForm.dia_semana}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, dia_semana: e.target.value })}
                    required
                  >
                    {DIAS.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia.charAt(0).toUpperCase() + dia.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <input
                    type="time"
                    value={scheduleForm.hora}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, hora: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="schedule-active"
                    checked={scheduleForm.activo}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, activo: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="schedule-active" style={{ margin: 0 }}>Activo al crearlo</label>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowScheduleModal(false)} className="btn-cancel">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save">
                    Guardar Programación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionBackups;