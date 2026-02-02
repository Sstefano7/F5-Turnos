import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteService } from '../../services/clienteService';
import '../../styles/GestionClientes.css';

function GestionClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const data = await clienteService.getAll();
      setClientes(data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los clientes');
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente? Esto también eliminará sus turnos.')) {
      return;
    }

    try {
      await clienteService.delete(id);
      fetchClientes();
    } catch (err) {
      alert('Error al eliminar el cliente');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Volver al Panel
        </button>
        <h1>Gestión de Clientes</h1>
      </header>

      <div className="gestion-content">
        {error && <div className="error-message">{error}</div>}

        <div className="clientes-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>DNI</th>
                <th>Turnos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.id}</td>
                    <td>{cliente.nombre} {cliente.apellido}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.dni || '-'}</td>
                    <td>
                      <span className="turnos-count">
                        {cliente.turnos?.length || 0} turnos
                      </span>
                    </td>
                    <td className="acciones">
                      <button
                        onClick={() => handleEliminar(cliente.id)}
                        className="btn-delete"
                      >
                        Eliminar
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

export default GestionClientes;