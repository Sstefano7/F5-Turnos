import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/Login.css';

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: solicitar email, 2: ingresar código
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      setSuccess(true);
      setStep(2);
      
      // Si estamos en desarrollo y hay un token de prueba, mostrarlo
      if (response.token_for_testing) {
        setError(`Código de prueba (desarrollo): ${response.token_for_testing}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el código de recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, token, password, passwordConfirmation);
      setSuccess(true);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
      setLoading(false);
    }
  };

  if (success && step === 2 && !error) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="success-message">
            <h2>✓ Contraseña Restablecida</h2>
            <p>Tu contraseña ha sido actualizada exitosamente.</p>
            <p>Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Recuperar Contraseña</h2>
        <p className="subtitle">
          {step === 1 
            ? 'Ingresa tu email para recibir un código de recuperación' 
            : 'Ingresa el código que te enviamos por email'}
        </p>

        {error && (
          <div className={error.includes('Código de prueba') ? 'info-message' : 'error-message'}>
            {error}
          </div>
        )}

        {step === 1 ? (
          // Paso 1: Solicitar código
          <form onSubmit={handleRequestToken}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>

            <div className="form-footer">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-link"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : (
          // Paso 2: Restablecer contraseña
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Código de Recuperación</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ingresa el código recibido"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Repite la contraseña"
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </button>

            <div className="form-footer">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setToken('');
                  setPassword('');
                  setPasswordConfirmation('');
                  setError('');
                }}
                className="btn-link"
                disabled={loading}
              >
                ← Solicitar un nuevo código
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;