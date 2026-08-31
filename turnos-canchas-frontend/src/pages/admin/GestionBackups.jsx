import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backupsService } from '../../services/backupsService';
import backupScheduleService from '../../services/backupScheduleService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/GestionBackups.css';
import Swal from 'sweetalert2';
import { ChevronLeft, Database, Download, Plus, Trash2, RotateCcw } from 'lucide-react';

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
      const response = await backupsService.getAll();
      setBackups(response.data || response);
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
      setSchedules(data.data || data);
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
      await backupsService.create();
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
      const blobData = await backupsService.download(fileName);
      const url = window.URL.createObjectURL(new Blob([blobData]));
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

  const getStatusBadge = (activo) => (
    <span className={`status-badge ${activo ? 'status-active' : 'status-inactive'}`}>
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );

  if (loading) return <div className="loading">Cargando copias de seguridad...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          <ChevronLeft size={18} aria-hidden="true" /> Volver al Panel
        </button>
        <h1>Gestión de Backups</h1>
      </header>

      <div className="gestion-content">
        <div className="backups-header">
          <p className="backups-description">
            Historial de copias de seguridad de la base de datos y archivos.
          </p>
          <button 
            onClick={crearBackup} 
            className="btn-primary"
            disabled={creating}
          >
            <Database size={18} aria-hidden="true" />
            {creating ? (
              <>
                <RotateCcw size={18} className="spin" aria-hidden="true" />
                Comprimiendo...
              </>
            ) : 'Crear Nuevo Backup'}
          </button>
        </div>
        
        <div className="backups-table-wrapper">
          <table className="backups-table">
            <thead>
              <tr>
                <th>Nombre del Archivo</th>
                <th>Tamaño</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-state">No hay backups disponibles.</td>
                </tr>
              ) : (
                backups.map((backup, index) => (
                  <tr key={index}>
                    <td><strong>{backup.name}</strong></td>
                    <td>{backup.size}</td>
                    <td>{backup.date}</td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => descargarBackup(backup.name)}
                        className="btn-download"
                        title="Descargar"
                      >
                        <Download size={16} aria-hidden="true" />
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── SECCIÓN BACKUPS AUTOMÁTICOS ── */}
        <div className="schedules-section">
          <div className="schedules-header">
            <h2>🔄 Backups Automáticos</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="btn-primary btn-sm"
            >
              <Plus size={18} aria-hidden="true" />
              Agregar Programación
            </button>
          </div>

          {schedules.length === 0 ? (
            <p className="schedules-empty">
              No hay backups automáticos configurados. Agregá uno para que se ejecute solo.
            </p>
          ) : (
            <div className="schedules-table-wrapper">
              <table className="schedules-table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td style={{ textTransform: 'capitalize' }}>{s.dia_semana}</td>
                      <td>{s.hora}</td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`status-toggle ${s.activo ? 'active' : 'inactive'}`}
                        >
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleDeleteSchedule(s.id)}
                          className="btn-delete"
                          title="Eliminar"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="schedules-note">
            ⏱️ El sistema verifica cada minuto si hay un backup programado para el día y hora actual.
          </p>
        </div>

        {/* ── MODAL AGREGAR PROGRAMACIÓN ── */}
        {showScheduleModal && (
          <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      id="schedule-active"
                      checked={scheduleForm.activo}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, activo: e.target.checked })}
                    />
                    Activo al crearlo
                  </label>
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