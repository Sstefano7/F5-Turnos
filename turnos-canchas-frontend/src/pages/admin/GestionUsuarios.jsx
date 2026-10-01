import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import Swal from 'sweetalert2';
import '../../styles/GestionUsuarios.css';

function GestionUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = useCallback(async (page = 1, search = searchTerm, role = roleFilter) => {
    setLoading(true);
    try {
      const params = { page, per_page: 15 };
      if (search) params.search = search;
      if (role) params.role = role;

      const data = await userService.getAll(params);
      setUsers(data.data || []);
      setCurrentPage(data.current_page || 1);
      setLastPage(data.last_page || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      Swal.fire('Error', 'No se pudieron cargar los usuarios del sistema.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1, searchTerm, roleFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, fetchUsers]);

  const handleRoleChange = async (userId, newRole, userName, currentRole) => {
    if (newRole === currentRole) return;

    if (currentUser?.id === userId && newRole !== 'superadmin') {
      Swal.fire({
        title: 'Acción no permitida',
        text: 'No puedes remover tu propio rol de superadmin.',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Modificar rol de usuario?',
      html: `¿Confirmas cambiar el rol de <strong>${userName}</strong> a <strong>${newRole.toUpperCase()}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, actualizar rol',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await userService.updateRole(userId, newRole);
        Swal.fire({
          title: 'Rol actualizado',
          text: `El rol de ${userName} ha sido modificado con éxito.`,
          icon: 'success',
          confirmButtonColor: '#16a34a'
        });
        fetchUsers(currentPage);
      } catch (err) {
        Swal.fire({
          title: 'No se pudo actualizar',
          text: err.response?.data?.message || 'Error al cambiar el rol del usuario.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (currentUser?.id === userId) {
      Swal.fire('Error', 'No puedes eliminar tu propia cuenta de superadministrador.', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      html: `¿Estás seguro de que deseas eliminar permanentemente a <strong>${userName}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar cuenta',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await userService.delete(userId);
        Swal.fire({
          title: 'Usuario eliminado',
          text: 'La cuenta ha sido eliminada del sistema.',
          icon: 'success',
          confirmButtonColor: '#16a34a'
        });
        fetchUsers(currentPage);
      } catch (err) {
        Swal.fire({
          title: 'Error al eliminar',
          text: err.response?.data?.message || 'Hubo un error al eliminar al usuario.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'superadmin': return 'badge-role badge-role--superadmin';
      case 'admin': return 'badge-role badge-role--admin';
      default: return 'badge-role badge-role--user';
    }
  };

  return (
    <div className="usuarios-container">
      <header className="usuarios-header">
        <button onClick={() => navigate('/admin')} className="btn-back-panel">
          ← Volver al Panel
        </button>
        <h1>Gestión de Usuarios</h1>
        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Total: <strong>{total}</strong> usuario(s)
        </span>
      </header>

      <div className="usuarios-content">
        <div className="usuarios-filtros">
          <input
            type="text"
            className="usuarios-search-input"
            placeholder="Buscar por nombre o correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="usuarios-select-filtro"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="user">Usuario normal</option>
            <option value="admin">Administrador</option>
            <option value="superadmin">Super Administrador</option>
          </select>
        </div>

        <div className="usuarios-table-card">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol Actual</th>
                <th>Asignar Rol</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No se encontraron usuarios con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} style={{ background: isCurrent ? '#f8fafc' : 'inherit' }}>
                      <td><strong>#{u.id}</strong></td>
                      <td>
                        {u.name} {isCurrent && <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>(Tú)</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={getRoleBadgeClass(u.role)}>
                          {u.role === 'superadmin' ? '🛡️ Superadmin' : u.role === 'admin' ? '👤 Admin' : '⚽ Usuario'}
                        </span>
                      </td>
                      <td>
                        <select
                          className="role-select"
                          value={u.role}
                          disabled={isCurrent}
                          onChange={(e) => handleRoleChange(u.id, e.target.value, u.name, u.role)}
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </td>
                      <td>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '-'}
                      </td>
                      <td>
                        <button
                          className="btn-delete-user"
                          disabled={isCurrent}
                          title={isCurrent ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                          onClick={() => handleDeleteUser(u.id, u.name)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          onPageChange={(page) => fetchUsers(page, searchTerm, roleFilter)}
        />
      </div>
    </div>
  );
}

export default GestionUsuarios;
