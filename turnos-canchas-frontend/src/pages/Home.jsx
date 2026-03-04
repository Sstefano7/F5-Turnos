import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canchaService } from '../services/canchaService';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

function Home() {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 1. AÑADIMOS isAdmin AQUÍ
  const { user, logout, isAdmin } = useAuth(); 
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const data = await canchaService.getAll();
        
        // Si la respuesta viene paginada, usar data.data, sino usar data directamente
        const canchasArray = data.data || data;
        
        setCanchas(canchasArray);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCanchas();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Cargando canchas...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="home-container">
        <header className="header">
          <h1>Gestión de Turnos - Canchas Deportivas</h1>
          <div className="user-info">
            {user ? (
              <>
                {/* 2. CAMBIAMOS LA CONDICIÓN AQUÍ */}
                {isAdmin() && (
                  <button onClick={() => navigate('/admin')} className="btn-admin">
                    Panel Admin
                  </button>
                )}
                <button onClick={() => navigate('/mis-reservas')} className="btn-reservas">
                  Mis Reservas
                </button>
                <span>Bienvenido, {user.name}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-login">
                Iniciar Sesión
              </button>
            )}
          </div>
        </header>

      <main className="main-content">
        <h2>Canchas Disponibles</h2>
        <div className="canchas-grid">
          {canchas.map((cancha) => (
            <div key={cancha.id} className="cancha-card">
              <div className="cancha-header">
                <h3>{cancha.nombre}</h3>
                <span className={`tipo-badge ${cancha.tipo}`}>
                  {cancha.tipo === 'futbol5' ? 'Fútbol 5' : 'Pádel'}
                </span>
              </div>
              <p className="cancha-descripcion">{cancha.descripcion}</p>
              <div className="cancha-footer">
                <p className="precio">${cancha.precio_hora} / hora</p>
                <button 
                  className="btn-reservar"
                  onClick={() => navigate(`/reservar/${cancha.id}`)}
                >
                  Reservar
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Home;