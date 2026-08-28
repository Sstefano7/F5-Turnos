import { useState } from 'react';
import { bugReportService } from '../services/bugReportService';
import '../styles/IdeasComentarios.css';

function ReportBugButton() {
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState('idea');
  const [mensaje, setMensaje] = useState('');
  const [contacto, setContacto] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const tipoMap = {
    bug: 'bug',
    sugerencia: 'mejora',
    idea: 'pregunta',
  };

  const opciones = [
    { value: 'bug', label: 'Bug', icon: '🐛', desc: 'Algo no funciona como debería' },
    { value: 'sugerencia', label: 'Sugerencia', icon: '💡', desc: 'Una mejora para lo que ya existe' },
    { value: 'idea', label: 'Idea', icon: '✨', desc: 'Algo nuevo que te gustaría ver' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await bugReportService.create({
        titulo: mensaje.length > 100 ? mensaje.slice(0, 97) + '...' : mensaje,
        descripcion: mensaje,
        tipo: tipoMap[tipo],
        prioridad: tipo === 'bug' ? 'media' : 'baja',
        contacto,
        pagina: window.location.href,
        navegador: navigator.userAgent
      });

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setMensaje('');
        setContacto('');
        setTipo('idea');
      }, 2000);
    } catch (err) {
      setError('Error al enviar el mensaje. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className="report-bug-btn" 
        onClick={() => setShowModal(true)}
        title="Ideas y comentarios"
      >
        <span className="report-bug-btn__icon">💡</span>
        Ideas y Comentarios
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content ideas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ideas-modal__header">
              <h2>Ideas y Comentarios</h2>
              <button onClick={() => setShowModal(false)} className="btn-close" aria-label="Cerrar">
                ×
              </button>
            </div>

            {success ? (
              <div className="ideas-modal__success">
                <span className="ideas-modal__success-icon">✓</span>
                <p>¡Mensaje enviado! Gracias por tu aporte.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}

                <p className="ideas-modal__intro">
                  Contanos qué te gustaría ver en la página, reportá un bug o dejanos cualquier sugerencia.
                </p>

                <div className="form-group">
                  <label>¿Qué tipo de mensaje es?</label>
                  <div className="ideas-modal__tipo-grid">
                    {opciones.map((op) => (
                      <button
                        key={op.value}
                        type="button"
                        className={`ideas-modal__tipo ${tipo === op.value ? 'is-active' : ''}`}
                        onClick={() => setTipo(op.value)}
                      >
                        <span className="ideas-modal__tipo-icon">{op.icon}</span>
                        <strong>{op.label}</strong>
                        <small>{op.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="mensaje">¿Qué mejorarías de la página?</label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribí tu mensaje acá..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contacto">¿Cómo te contactamos?</label>
                  <input
                    id="contacto"
                    type="text"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="Email, link de X/Twitter, Discord, etc."
                  />
                  <small className="ideas-modal__hint">
                    Si dejás X o Discord, asegurate de poder recibir DMs en X y solicitudes de amistad o DMs en Discord para que podamos responderte.
                  </small>
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
                    {loading ? 'Enviando...' : 'Enviar'}
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
