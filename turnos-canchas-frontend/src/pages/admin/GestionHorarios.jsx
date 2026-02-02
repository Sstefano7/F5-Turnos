import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canchaService } from '../../services/canchaService';
import { turnoService } from '../../services/turnoService';
import '../../styles/GestionHorarios.css';

function GestionHorarios() {
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
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
      console.error('Error al cargar las canchas:', err);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Volver al Panel
        </button>
        <h1>Gestión de Horarios</h1>
      </header>

      <div className="gestion-content">
        <div className="info-box">
          <h3>ℹ️ Información</h3>
          <p>Los horarios se configuraron automáticamente al crear la base de datos.</p>
          <p>Cada cancha tiene horarios de 8:00 AM a 11:00 PM, todos los días de la semana.</p>
          <p>Para gestionar horarios específicos, contacta al desarrollador.</p>
        </div>

        <div className="canchas-horarios">
          <h2>Horarios por Cancha</h2>
          {canchas.map((cancha) => (
            <div key={cancha.id} className="cancha-horario-card">
              <h3>{cancha.nombre}</h3>
              <p className="horario-info">
                <strong>Horarios disponibles:</strong> Lunes a Domingo, 08:00 - 23:00
              </p>
              <p className="horario-info">
                <strong>Duración por turno:</strong> 1 hora
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GestionHorarios;