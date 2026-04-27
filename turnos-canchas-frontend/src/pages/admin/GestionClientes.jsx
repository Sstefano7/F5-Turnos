import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteService } from '../../services/clienteService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/GestionClientes.css';
import Pagination from '../../components/Pagination';

function GestionClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClientes(1, searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

 const fetchClientes = async (page = 1, search = searchTerm) => {
  try {
    const response = await clienteService.getAll({ page, per_page: 15, search });
    setClientes(response.data);
    setCurrentPage(response.current_page);
    setLastPage(response.last_page);
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
    fetchClientes(currentPage); // ← Usar página actual
  } catch (err) {
    alert('Error al eliminar el cliente');
  }
};
  const handlePageChange = (page) => {
  setLoading(true);
  fetchClientes(page);
};

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Volver al Panel
        </button>
        <h1>Gestión de Clientes</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Buscar por DNI, Nombre o Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '280px', margin: 0 }}
          />
        </div>
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
                      {isSuperAdmin() && (
                        <button
                          onClick={() => handleEliminar(cliente.id)}
                          className="btn-delete"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
                  <Pagination
            currentPage={currentPage}
            lastPage={lastPage}
            onPageChange={handlePageChange}
          />
      </div>
    </div>
  );
}

export default GestionClientes;