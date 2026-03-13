import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
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
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.passwordConfirmation) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.passwordConfirmation
        );
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Nombre</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Tu nombre completo"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength="8"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="passwordConfirmation">Confirmar Contraseña</label>
              <input
                type="password"
                id="passwordConfirmation"
                name="passwordConfirmation"
                value={formData.passwordConfirmation}
                onChange={handleChange}
                required={!isLogin}
                placeholder="••••••••"
                minLength="8"
              />
            </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                    </button>
                    <div className="form-footer" style={{ marginTop: '15px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="btn-link"
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#667eea', 
                        cursor: 'pointer',
                        fontSize: '14px',
                        textDecoration: 'underline'
                    }}
                    >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        <div className="toggle-form">
          <p>
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({
                  name: '',
                  email: '',
                  password: '',
                  passwordConfirmation: ''
                });
              }}
              className="link-button"
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;