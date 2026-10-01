import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { canchaService } from '../../services/canchaService';
import { horarioService } from '../../services/horarioService';
import Swal from 'sweetalert2';
import '../../styles/GestionHorarios.css';

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

function GestionHorarios() {
  const [canchas, setCanchas] = useState([]);
  const [selectedCanchaId, setSelectedCanchaId] = useState(null);
  const [selectedDia, setSelectedDia] = useState('lunes');
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    hora_inicio: '18:00',
    hora_fin: '19:00',
  });

  const navigate = useNavigate();

  // 1. Cargar lista de canchas
  useEffect(() => {
    canchaService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        setCanchas(data);
        if (data.length > 0) {
          setSelectedCanchaId(data[0].id);
        }
      })
      .catch(err => {
        console.error('Error al cargar canchas:', err);
        Swal.fire('Error', 'No se pudieron cargar las canchas.', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Cargar horarios para la cancha y día seleccionados
  const fetchHorarios = useCallback(async () => {
    if (!selectedCanchaId) return;
    setLoadingHorarios(true);
    try {
      const res = await horarioService.getAll({
        cancha_id: selectedCanchaId,
        dia_semana: selectedDia,
        per_page: 100
      });
      const items = Array.isArray(res) ? res : (res?.data || []);
      // Ordenar por hora_inicio
      items.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      setHorarios(items);
    } catch (err) {
      console.error('Error al cargar horarios:', err);
    } finally {
      setLoadingHorarios(false);
    }
  }, [selectedCanchaId, selectedDia]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  // Alternar disponibilidad de una franja
  const handleToggleDisponible = async (horario) => {
    const nuevoEstado = !horario.disponible;
    try {
      await horarioService.update(horario.id, { disponible: nuevoEstado });
      setHorarios(prev => prev.map(h => h.id === horario.id ? { ...h, disponible: nuevoEstado } : h));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: nuevoEstado ? 'Horario habilitado' : 'Horario bloqueado',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo actualizar el horario', 'error');
    }
  };

  // Alternar todos los horarios del día en lote
  const handleBulkToggle = async (habilitar) => {
    const accion = habilitar ? 'habilitar' : 'bloquear';
    const result = await Swal.fire({
      title: `¿${habilitar ? 'Habilitar' : 'Bloquear'} todos?`,
      text: `Se aplicará a todas las franjas de este día (${selectedDia.toUpperCase()}).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: habilitar ? '#16a34a' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Sí, ${accion} todos`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await Promise.all(
          horarios.map(h => horarioService.update(h.id, { disponible: habilitar }))
        );
        fetchHorarios();
        Swal.fire('Completado', `Franjas horarias actualizadas con éxito.`, 'success');
      } catch (err) {
        Swal.fire('Error', 'Hubo un problema al actualizar en lote.', 'error');
      }
    }
  };

  // Eliminar franja horaria
  const handleDeleteHorario = async (id, rango) => {
    const result = await Swal.fire({
      title: '¿Eliminar horario?',
      text: `¿Deseas eliminar la franja ${rango}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await horarioService.delete(id);
        setHorarios(prev => prev.filter(h => h.id !== id));
        Swal.fire('Eliminado', 'Franja horaria eliminada.', 'success');
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar el horario', 'error');
      }
    }
  };

  // Agregar nueva franja horaria
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.hora_inicio || !newSlot.hora_fin) {
      Swal.fire('Atención', 'Indica hora de inicio y fin.', 'warning');
      return;
    }

    try {
      await horarioService.create({
        cancha_id: selectedCanchaId,
        dia_semana: selectedDia,
        hora_inicio: newSlot.hora_inicio,
        hora_fin: newSlot.hora_fin,
        disponible: true
      });
      setShowAddModal(false);
      fetchHorarios();
      Swal.fire('¡Creado!', 'Franja horaria agregada exitosamente.', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Error al crear la franja horaria.', 'error');
    }
  };

  if (loading) return <div className="loading">Cargando gestión de horarios...</div>;

  const currentCancha = canchas.find(c => c.id === selectedCanchaId);

  return (
    <div className="gh-container">
      <header className="gh-header">
        <button onClick={() => navigate('/admin')} className="btn-back-panel">
          ← Volver al Panel
        </button>
        <h1>Configuración de Horarios</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-gh-add">
          + Agregar Franja Horaria
        </button>
      </header>

      <div className="gh-content">
        <div className="gh-info-banner">
          <h3>ℹ️ Control Operativo de Disponibilidad</h3>
          <p>
            Configura qué horarios están activos para reserva en cada cancha. 
            Las franjas marcadas como <strong>Bloqueado</strong> no se ofrecerán a los usuarios en la web.
          </p>
        </div>

        <div className="gh-controls-card">
          {/* Selector de Cancha */}
          <div className="gh-cancha-selector">
            <span className="gh-label">Seleccionar Cancha:</span>
            {canchas.map(cancha => (
              <button
                key={cancha.id}
                className={`gh-cancha-pill ${selectedCanchaId === cancha.id ? 'active' : ''}`}
                onClick={() => setSelectedCanchaId(cancha.id)}
              >
                {cancha.tipo === 'futbol5' ? '⚽' : '🎾'} {cancha.nombre}
              </button>
            ))}
          </div>

          {/* Selector de Día */}
          <div className="gh-days-tabs">
            {DIAS_SEMANA.map(dia => (
              <button
                key={dia.key}
                className={`gh-day-tab ${selectedDia === dia.key ? 'active' : ''}`}
                onClick={() => setSelectedDia(dia.key)}
              >
                {dia.label}
              </button>
            ))}
          </div>

          {/* Acciones en lote */}
          <div className="gh-actions-bar">
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Mostrando horarios de <strong>{currentCancha?.nombre}</strong> los días <strong>{selectedDia.toUpperCase()}</strong>:
            </span>
            <div className="gh-bulk-buttons">
              <button onClick={() => handleBulkToggle(true)} className="btn-gh-action btn-gh-enable-all">
                ✓ Habilitar todos
              </button>
              <button onClick={() => handleBulkToggle(false)} className="btn-gh-action btn-gh-disable-all">
                ✕ Bloquear todos
              </button>
            </div>
          </div>
        </div>

        {/* Grilla de Franjas */}
        {loadingHorarios ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Cargando horarios de la cancha...
          </div>
        ) : horarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
              No hay franjas configuradas para {currentCancha?.nombre} el día {selectedDia}.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-gh-add" style={{ margin: '16px auto 0 auto' }}>
              Crear primera franja horaria
            </button>
          </div>
        ) : (
          <div className="gh-slots-grid">
            {horarios.map(h => {
              const inicio = h.hora_inicio?.slice(0, 5);
              const fin = h.hora_fin?.slice(0, 5);
              const rango = `${inicio} - ${fin} hs`;

              return (
                <div key={h.id} className={`gh-slot-card ${h.disponible ? 'disponible' : 'bloqueado'}`}>
                  <div className="gh-slot-time">
                    <span>🕒</span> {rango}
                  </div>
                  <div>
                    <span className={`gh-slot-status ${h.disponible ? 'disponible' : 'bloqueado'}`}>
                      {h.disponible ? '● Disponible para reserva' : '○ Bloqueado / Cerrado'}
                    </span>
                  </div>
                  <div className="gh-slot-actions">
                    <button
                      className={`btn-toggle-slot ${h.disponible ? 'disable' : 'enable'}`}
                      onClick={() => handleToggleDisponible(h)}
                    >
                      {h.disponible ? 'Bloquear horario' : 'Habilitar horario'}
                    </button>
                    <button
                      className="btn-delete-slot"
                      title="Eliminar franja"
                      onClick={() => handleDeleteHorario(h.id, rango)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Crear Franja Horaria */}
      {showAddModal && (
        <div className="gh-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="gh-modal" onClick={e => e.stopPropagation()}>
            <h2>Agregar Franja Horaria</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Cancha: <strong>{currentCancha?.nombre}</strong> · Día: <strong>{selectedDia.toUpperCase()}</strong>
            </p>
            <form onSubmit={handleAddSlot}>
              <div className="gh-form-group">
                <label>Hora de inicio</label>
                <input
                  type="time"
                  className="gh-form-input"
                  value={newSlot.hora_inicio}
                  onChange={e => setNewSlot({ ...newSlot, hora_inicio: e.target.value })}
                  required
                />
              </div>

              <div className="gh-form-group">
                <label>Hora de finalización</label>
                <input
                  type="time"
                  className="gh-form-input"
                  value={newSlot.hora_fin}
                  onChange={e => setNewSlot({ ...newSlot, hora_fin: e.target.value })}
                  required
                />
              </div>

              <div className="gh-modal-actions">
                <button
                  type="button"
                  className="btn-back-panel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-gh-add">
                  Guardar Franja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionHorarios;