import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canchaService } from '../../services/canchaService';
import '../../styles/GestionCanchas.css';

function GestionCanchas() {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCancha, setEditingCancha] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'futbol5',
    descripcion: '',
    precio_hora: '',
    activa: true
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCanchas();
  }, []);

  const fetchCanchas = async () => {
    try {
      const data = await canchaService.getAll();
      setCanchas(data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar las canchas');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCancha) {
        await canchaService.update(editingCancha.id, formData);
      } else {
        await canchaService.create(formData);
      }
      
      setShowModal(false);
      resetForm();
      fetchCanchas();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la cancha');
    }
  };

  const handleEdit = (cancha) => {
    setEditingCancha(cancha);
    setFormData({
      nombre: cancha.nombre,
      tipo: cancha.tipo,
      descripcion: cancha.descripcion || '',
      precio_hora: cancha.precio_hora,
      activa: cancha.activa
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cancha?')) {
      return;
    }

    try {
      await canchaService.delete(id);
      fetchCanchas();
    } catch (err) {
      alert('Error al eliminar la cancha');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'futbol5',
      descripcion: '',
      precio_hora: '',
      activa: true
    });
    setEditingCancha(null);
    setError('');
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Volver al Panel
        </button>
        <h1>Gestión de Canchas</h1>
        <button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-add"
        >
          + Nueva Cancha
        </button>
      </header>

      <div className="gestion-content">
        <div className="canchas-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Precio/Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {canchas.map((cancha) => (
                <tr key={cancha.id}>
                  <td>{cancha.id}</td>
                  <td>{cancha.nombre}</td>
                  <td>
                    <span className={`tipo-badge ${cancha.tipo}`}>
                      {cancha.tipo === 'futbol5' ? 'Fútbol 5' : 'Pádel'}
                    </span>
                  </td>
                  <td className="precio">${cancha.precio_hora}</td>
                  <td>
                    <span className={`estado-badge ${cancha.activa ? 'activa' : 'inactiva'}`}>
                      {cancha.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="acciones">
                    <button 
                      onClick={() => handleEdit(cancha)}
                      className="btn-edit"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(cancha.id)}
                      className="btn-delete"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCancha ? 'Editar Cancha' : 'Nueva Cancha'}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="btn-close"
              >
                ×
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo *</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                >
                  <option value="futbol5">Fútbol 5</option>
                  <option value="padel">Pádel</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Precio por Hora *</label>
                <input
                  type="number"
                  name="precio_hora"
                  value={formData.precio_hora}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa}
                    onChange={handleChange}
                  />
                  Cancha activa
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingCancha ? 'Guardar Cambios' : 'Crear Cancha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionCanchas;