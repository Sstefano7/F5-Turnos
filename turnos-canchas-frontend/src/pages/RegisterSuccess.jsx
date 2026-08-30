import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { CheckCircle2, ArrowRight, Mail, Send, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import '../styles/Register.css';

function RegisterSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const resendEmail = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await authService.resendVerification();
      setResendMsg('Te enviamos un nuevo link de verificación a tu email.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Hubo un problema al enviar el email. Intentá nuevamente más tarde.';
      setResendMsg(msg);
    } finally {
      setResending(false);
    }
  };

  const goHome = () => navigate('/');
  const goToReservas = () => navigate('/mis-reservas');
  const goToLogin = () => navigate('/login');

  return (
    <div className="reg-container">
      <div className="reg-card reg-success animate-fadeIn">
        <div className="reg-success__icon animate-scaleIn" aria-hidden="true">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="reg-success__title">¡Cuenta creada con éxito!</h1>
        <p className="reg-success__text">
          Bienvenido a F5 Turnos. Te enviamos un link de confirmación
          {email ? (
            <>
              {' '}
              a <strong className="reg-success__email">{email}</strong>
            </>
          ) : (
            ' a tu email'
          )}
          . Verificá tu cuenta para poder reservar canchas de Fútbol 5 y Pádel.
        </p>

        <div className="reg-success__actions">
          <button type="button" className="btn-primary" onClick={goToReservas}>
            Ver mis reservas <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className="btn-secondary" onClick={goHome}>
            Ir al inicio
          </button>
        </div>

        <div className="reg-success__resend">
          <button
            type="button"
            className="link-btn"
            onClick={resendEmail}
            disabled={resending}
          >
            {resending ? (
              <Loader2 size={16} className="spin" aria-hidden="true" />
            ) : (
              <Send size={16} aria-hidden="true" />
            )}
            {resending ? 'Enviando…' : 'Reenviar email de verificación'}
          </button>
          {resendMsg && (
            <p className="reg-success__resend-status" role="status" aria-live="polite">
              {resendMsg}
            </p>
          )}
          <p className="reg-success__mail-hint">
            <Mail size={14} aria-hidden="true" />
            ¿No recibiste el correo? Revisá la carpeta de spam.
          </p>
          <button type="button" className="link-btn" onClick={goToLogin} title="Ir al login">
            Iniciar sesión con otra cuenta
          </button>
        </div>

        <button
          type="button"
          className="reg-success__swal-link"
          onClick={() =>
            Swal.fire({
              title: '¿Cuánto falta para reservar?',
              text: 'Una vez que verifiques tu email podrás reservar tus canchas de Fútbol 5 y Pádel sin límites.',
              icon: 'info',
              confirmButtonColor: '#22c55e',
              confirmButtonText: 'Entendido',
            })
          }
        >
          ¿Qué sigue?
        </button>
      </div>
    </div>
  );
}

export default RegisterSuccess;