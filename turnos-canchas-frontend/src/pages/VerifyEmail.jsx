import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, LogIn } from 'lucide-react';
import { authService } from '../services/authService';
import '../styles/Register.css';

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', message: '' });

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      try {
        const data = await authService.verifyEmail(token);
        if (mounted) setState({ status: 'success', message: data.message || 'Email verificado correctamente.' });
      } catch (err) {
        if (mounted) {
          const msg = err?.response?.data?.message || 'El enlace de verificación es inválido o ya fue utilizado.';
          setState({ status: 'error', message: msg });
        }
      }
    };

    verify();
    return () => { mounted = false; };
  }, [token]);

  const goLogin = () => navigate('/login');
  const goHome = () => navigate('/');

  return (
    <div className="reg-container">
      <div className="reg-card reg-success animate-fadeIn">
        {state.status === 'loading' && (
          <>
            <div className="reg-success__icon reg-success__icon--loading animate-scaleIn" aria-hidden="true">
              <Loader2 size={44} className="spin" />
            </div>
            <h1 className="reg-success__title">Verificando tu email…</h1>
            <p className="reg-success__text">Estamos confirmando tu cuenta. Un momento por favor.</p>
          </>
        )}

        {state.status === 'success' && (
          <>
            <div className="reg-success__icon animate-scaleIn" aria-hidden="true">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="reg-success__title">¡Email verificado!</h1>
            <p className="reg-success__text">{state.message}</p>
            <div className="reg-success__actions">
              <button type="button" className="btn-primary" onClick={goHome}>
                Ir al inicio <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="btn-secondary" onClick={goLogin}>
                <LogIn size={18} aria-hidden="true" /> Iniciar sesión
              </button>
            </div>
          </>
        )}

        {state.status === 'error' && (
          <>
            <div className="reg-success__icon reg-success__icon--error animate-scaleIn" aria-hidden="true">
              <AlertCircle size={48} />
            </div>
            <h1 className="reg-success__title">No pudimos verificar tu email</h1>
            <p className="reg-success__text">{state.message}</p>
            <div className="reg-success__actions">
              <button type="button" className="btn-primary" onClick={goLogin}>
                Iniciar sesión <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" className="btn-secondary" onClick={goHome}>
                Ir al inicio
              </button>
            </div>
            <p className="reg-success__mail-hint">
              Si el link ya fue utilizado, tenés que iniciar sesión y reenviar la verificación desde tu cuenta.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;