import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import '../styles/Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch {
      setError('Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card-container">
          <div className="login-illustration" aria-hidden="true">
            <div className="login-illustration-content">
              <div className="login-illustration-badge">
                <span className="badge-dot"></span> F5 & Pádel
              </div>
              <h2 className="login-illustration-title">
                Tu partido empieza acá.
              </h2>
              <p className="login-illustration-desc">
                Reservá tu cancha favorita en segundos, armá tu equipo y disfrutá del mejor deporte con tus amigos.
              </p>

              <div className="login-illustration-features">
                <div className="login-feature-item">
                  <div className="feature-icon">⚡</div>
                  <div className="feature-text">
                    <strong>Reserva instantánea</strong>
                    <span>Disponibilidad 100% en tiempo real</span>
                  </div>
                </div>
                <div className="login-feature-item">
                  <div className="feature-icon">🏟️</div>
                  <div className="feature-text">
                    <strong>Canchas de primer nivel</strong>
                    <span>Césped sintético premium y pádel vidriado</span>
                  </div>
                </div>
                <div className="login-feature-item">
                  <div className="feature-icon">📱</div>
                  <div className="feature-text">
                    <strong>Gestión sin complicaciones</strong>
                    <span>Historial de partidos y turnos claros</span>
                  </div>
                </div>
              </div>

              <div className="login-illustration-card">
                <div className="mini-card-header">
                  <span className="mini-card-tag">Turno confirmado</span>
                  <span className="mini-card-status">Hoy</span>
                </div>
                <div className="mini-card-body">
                  <div className="mini-card-sport">⚽ Fútbol 5 · Cancha A</div>
                  <div className="mini-card-time">20:00 - 21:00 hs</div>
                </div>
              </div>
            </div>
          </div>

          <div className="login-card">
            <div className="login-header">
              <div className="login-logo" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                  <rect width="48" height="48" rx="12" fill="url(#logoGradient)"/>
                  <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" 
                        fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="20" fill="white">
                    F5
                  </text>
                  <defs>
                    <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#22c55e"/>
                      <stop offset="100%" stopColor="#3b82f6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 className="login-title">Bienvenido de nuevo</h1>
              <p className="login-subtitle">Inicia sesión para acceder a tu cuenta</p>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  <Mail size={16} aria-hidden="true" className="form-label-icon" />
                  Email
                </label>
                <div className="form-input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="form-input"
                    aria-describedby="email-hint"
                  />
                </div>
                <span id="email-hint" className="form-hint">Tu correo registrado</span>
              </div>

              <div className="form-field">
                <div className="form-label-row">
                  <label htmlFor="password" className="form-label">
                    <Lock size={16} aria-hidden="true" className="form-label-icon" />
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="login-forgot-inline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="form-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    minLength="8"
                    className="form-input"
                    aria-describedby="password-hint"
                  />
                  <button
                    type="button"
                    className="form-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span id="password-hint" className="form-hint">Mínimo 8 caracteres</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="login-submit"
                disabled={loading}
                fullWidth
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>

            <div className="login-divider">
              <span>o</span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/register')}
              fullWidth
              className="login-register"
            >
              Crear cuenta nueva
            </Button>
          </div>
        </div>

        <p className="login-legal">
          Al continuar, aceptas nuestros{' '}
          <a href="#">Términos de servicio</a>{' '}
          y{' '}
          <a href="#">Política de privacidad</a>
        </p>
      </div>
    </div>
  );
}

export default Login;