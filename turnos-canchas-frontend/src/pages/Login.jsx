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
        <div className="login-illustration" aria-hidden="true">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="loginGradient" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22c55e"/>
                <stop offset="50%" stopColor="#3b82f6"/>
                <stop offset="100%" stopColor="#22c55e"/>
              </linearGradient>
            </defs>
            <rect width="400" height="400" rx="24" fill="url(#loginGradient)" opacity="0.1"/>
            <circle cx="120" cy="120" r="80" fill="url(#loginGradient)" opacity="0.15"/>
            <circle cx="280" cy="280" r="100" fill="url(#loginGradient)" opacity="0.1"/>
            <path d="M100 200 Q200 120 300 200" stroke="url(#loginGradient)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.3"/>
            <path d="M120 240 Q200 320 280 240" stroke="url(#loginGradient)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.2"/>
          </svg>
        </div>

        <Card className="login-card" hover={false}>
          <div className="login-header">
            <div className="login-logo" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
                <rect width="48" height="48" rx="12" fill="url(#logoGradient)"/>
                <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" 
                      font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="20" fill="white">
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
              <label htmlFor="password" className="form-label">
                <Lock size={16} aria-hidden="true" className="form-label-icon" />
                Contraseña
              </label>
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

          <div className="login-footer">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/forgot-password')}
              className="login-forgot"
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </div>

          <div className="login-divider">
            <span>o</span>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/register')}
            fullWidth
            className="login-register"
          >
            Crear cuenta nueva
          </Button>
        </Card>

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