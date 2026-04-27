import { useState } from 'react';
import { bugReportService } from '../services/bugReportService';
import '../styles/ReportBug.css';

function ReportBugButton() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'bug',
    prioridad: 'media',
    pasos_reproducir: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await bugReportService.create({
        ...formData,
        pagina: window.location.href,
        navegador: navigator.userAgent
      });

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setFormData({
          titulo: '',
          descripcion: '',
          tipo: 'bug',
          prioridad: 'media',
          pasos_reproducir: ''
        });
      }, 2000);
    } catch (err) {
      setError('Error al enviar el reporte. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className="report-bug-btn" 
        onClick={() => setShowModal(true)}
        title="Reportar un problema"
      >
        ⚠️ Reportar Error
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content bug-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reportar un Problema</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                ×
              </button>
            </div>

            {success ? (
              <div className="success-message">
                ✓ ¡Reporte enviado exitosamente! Gracias por tu feedback.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Tipo de Reporte *</label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                  >
                    <option value="bug">⚠️ Error del Sistema</option>
                    <option value="mejora">💡 Sugerencia de Mejora</option>
                    <option value="pregunta">❓ Pregunta</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridad *</label>
                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleChange}
                    required
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    placeholder="Resumen breve del problema"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Describe el problema con el mayor detalle posible"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Pasos para Reproducir (opcional)</label>
                  <textarea
                    name="pasos_reproducir"
                    value={formData.pasos_reproducir}
                    onChange={handleChange}
                    placeholder="1. Ir a...&#10;2. Hacer clic en...&#10;3. Ver error..."
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-cancel"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Reporte'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ReportBugButton;