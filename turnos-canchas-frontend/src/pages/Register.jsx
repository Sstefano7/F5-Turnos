import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  User, ShieldCheck, Trophy, FileCheck2,
  CheckCircle2, ChevronLeft, ChevronRight,
  Eye, EyeOff, Upload, X, Loader2, Check, AlertCircle,
  Lock, Mail, Phone, Cake, CreditCard, Users, Clock, Shirt,
  Medal, CalendarDays, Gift, Camera, Send, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { COUNTRIES, getCountry } from '../utils/countries';
import {
  validateName, validateEmail, validatePhone, validateBirthDate,
  validatePassword, validatePasswordConfirm, validateDni, validatePromoCode,
  passwordStrengthLabel, validateRequired,
} from '../utils/validation';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import '../styles/Register.css';

const DAYS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

const TIMES = [
  { value: 'mañana', label: 'Mañana (8-12)', icon: Clock },
  { value: 'tarde', label: 'Tarde (12-18)', icon: Clock },
  { value: 'noche', label: 'Noche (18-23)', icon: Clock },
];

const SPORTS = [
  { value: 'futbol5', label: 'Fútbol 5', icon: '⚽', desc: 'Canchas de césped sintético' },
  { value: 'padel', label: 'Pádel', icon: '🎾', desc: 'Canchas de pádel' },
  { value: 'ambos', label: 'Ambos', icon: '🏟️', desc: 'Fútbol 5 y pádel' },
];

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado', 'Competitivo'];
const GENDERS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero-no-decir', label: 'Prefiero no decir' },
];

const STEPS = [
  { n: 1, title: 'Información personal', icon: User },
  { n: 2, title: 'Seguridad', icon: ShieldCheck },
  { n: 3, title: 'Preferencias', icon: Trophy },
  { n: 4, title: 'Términos y finalizar', icon: FileCheck2 },
];

const FIELDS_BY_STEP = {
  1: ['name', 'email', 'phone', 'birthDate'],
  2: ['password', 'passwordConfirm', 'dni'],
  3: ['preferredSport', 'teamName', 'gender', 'promoCode'],
  4: ['termsAccepted', 'privacyAccepted', 'cancellationAccepted'],
};

function maxBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
}

function SocialButtons() {
  const onComingSoon = (name) => {
    Swal.fire({
      title: `${name} · Próximamente`,
      text: 'El registro con redes sociales estará disponible muy pronto. Mientras tanto, creá tu cuenta con tu email.',
      icon: 'info',
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Entendido',
    });
  };

  return (
    <div className="social-wrap">
      <div className="social-group">
        <button type="button" className="social-btn" onClick={() => onComingSoon('Google')} aria-label="Registrarse con Google">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Registrarse con Google
        </button>

        <button type="button" className="social-btn" onClick={() => onComingSoon('Facebook')} aria-label="Registrarse con Facebook">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Registrarse con Facebook
        </button>

        <button type="button" className="social-btn" onClick={() => onComingSoon('Apple')} aria-label="Registrarse con Apple">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#111827" d="M16.36 12.42c-.02-2.02 1.65-2.99 1.73-3.04-.94-1.38-2.4-1.57-2.92-1.59-1.24-.13-2.42.73-3.05.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.3 2-1.41 2.43-.36 6.03 1.01 8 .67.97 1.47 2.06 2.51 2.02 1.01-.04 1.39-.65 2.61-.65 1.22 0 1.57.65 2.63.63 1.09-.02 1.78-.99 2.45-1.96.77-1.13 1.09-2.22 1.11-2.28-.02-.01-2.14-.82-2.16-3.26zM13.9 6.51c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.85 2.48.9.07 1.82-.46 2.38-1.14z" />
          </svg>
          Registrarse con Apple
        </button>
      </div>
      <div className="divider">
        <span>O regístrate con email</span>
      </div>
    </div>
  );
}

function FieldStatus({ ok, show }) {
  if (!show) return null;
  return (
    <span className={`field-status ${ok ? 'ok' : 'error'}`} aria-hidden="true">
      {ok ? <Check size={16} /> : <AlertCircle size={16} />}
    </span>
  );
}

function ErrorMsg({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    email: '',
    countryCode: 'AR',
    phone: '',
    birthDate: '',
    password: '',
    passwordConfirm: '',
    dni: '',
    preferredSport: '',
    skillLevel: '',
    preferredDays: [],
    preferredTimes: [],
    teamName: '',
    gender: '',
    promoCode: '',
    termsAccepted: false,
    privacyAccepted: false,
    cancellationAccepted: false,
    newsletter: true,
    smsNotifications: false,
    profilePhoto: null,
    website: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [promoState, setPromoState] = useState({ status: 'idle', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [challengeSolving, setChallengeSolving] = useState(false);
  const [challengeMsg, setChallengeMsg] = useState('');
  const [termsModal, setTermsModal] = useState('');
  const fileRef = useRef(null);

  const setField = (name, value) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const passwordScore = useMemo(() => {
    const r = validatePassword(data.password);
    return r.score;
  }, [data.password]);

  const strength = passwordStrengthLabel(passwordScore);

  function validateField(field) {
    const d = data;
    switch (field) {
      case 'name': return validateName(d.name);
      case 'email': return validateEmail(d.email);
      case 'phone': return validatePhone(d.countryCode, d.phone);
      case 'birthDate': return validateBirthDate(d.birthDate);
      case 'password': return validatePassword(d.password);
      case 'passwordConfirm': return validatePasswordConfirm(d.password, d.passwordConfirm);
      case 'dni': return validateDni(d.dni);
      case 'preferredSport': return validateRequired(d.preferredSport);
      case 'teamName': return d.teamName && d.teamName.length > 120 ? { ok: false, message: 'Máximo 120 caracteres.' } : { ok: true, message: '' };
      case 'promoCode': return validatePromoCode(d.promoCode);
      case 'termsAccepted': return d.termsAccepted ? { ok: true, message: '' } : { ok: false, message: 'Debés aceptar los Términos y Condiciones para continuar.' };
      case 'privacyAccepted': return d.privacyAccepted ? { ok: true, message: '' } : { ok: false, message: 'Debés aceptar la Política de Privacidad para continuar.' };
      case 'cancellationAccepted': return d.cancellationAccepted ? { ok: true, message: '' } : { ok: false, message: 'Debés entender la política de cancelación para continuar.' };
      default: return { ok: true, message: '' };
    }
  }

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const res = validateField(field);
    setErrors((e) => ({ ...e, [field]: res.ok ? undefined : res.message }));
  };

  const handleChange = (field, value) => {
    setField(field, value);
    const res = validateFieldWith(field, value);
    setErrors((e) => ({ ...e, [field]: res.ok ? undefined : res.message }));
  };

  function validateFieldWith(field, value) {
    // Ayudante: validar un campo con un valor puntual (para onChange/toggle)
    const snapshot = { ...data, [field]: value };
    switch (field) {
      case 'password': {
        // Re-validar confirmación también
        const c = validatePasswordConfirm(snapshot.password, snapshot.passwordConfirm);
        setErrors((e) => ({ ...e, passwordConfirm: c.ok ? undefined : c.message }));
        return validatePassword(value);
      }
      case 'passwordConfirm': return validatePasswordConfirm(snapshot.password, value);
      case 'name': return validateName(value);
      case 'email': return validateEmail(value);
      case 'phone': return validatePhone(snapshot.countryCode, value);
      case 'birthDate': return validateBirthDate(value);
      case 'dni': return validateDni(value);
      case 'preferredSport': return validateRequired(value);
      case 'teamName': return value && value.length > 120 ? { ok: false, message: 'Máximo 120 caracteres.' } : { ok: true, message: '' };
      case 'promoCode': return validatePromoCode(value);
      case 'termsAccepted': return value ? { ok: true, message: '' } : { ok: false, message: 'Debés aceptar los Términos y Condiciones.' };
      case 'privacyAccepted': return value ? { ok: true, message: '' } : { ok: false, message: 'Debés aceptar la Política de Privacidad.' };
      case 'cancellationAccepted': return value ? { ok: true, message: '' } : { ok: false, message: 'Debés entender la política de cancelación.' };
      default: return { ok: true, message: '' };
    }
  }

  function validateStep(n) {
    const fields = FIELDS_BY_STEP[n];
    const newErrors = {};
    let ok = true;
    fields.forEach((f) => {
      const res = validateField(f);
      if (!res.ok) {
        ok = false;
        newErrors[f] = res.message;
      }
    });
    setErrors((e) => ({ ...e, ...newErrors }));
    if (n === 2) {
      const p = validateField('password');
      if (!p.ok) { ok = false; newErrors.password = p.message; }
    }
    // Marcar campos tocados al intentar avanzar
    setTouched((t) => ({ ...t, ...Object.fromEntries(fields.map((f) => [f, true])) }));
    return ok;
  }

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4));
      setServerError('');
    }
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    setServerError('');
  };

  const jumpTo = (n) => {
    if (n < step) setStep(n);
  };

  const toggleDays = (day) => {
    const has = data.preferredDays.includes(day);
    const next = has ? data.preferredDays.filter((d) => d !== day) : [...data.preferredDays, day];
    setField('preferredDays', next);
  };

  const toggleTimes = (time) => {
    const has = data.preferredTimes.includes(time);
    const next = has ? data.preferredTimes.filter((t) => t !== time) : [...data.preferredTimes, time];
    setField('preferredTimes', next);
  };

  const applyPromo = async () => {
    const v = validatePromoCode(data.promoCode);
    if (!v.ok) {
      setPromoState({ status: 'invalid', message: v.message });
      return;
    }
    setPromoState({ status: 'loading', message: '' });
    try {
      const res = await authService.validatePromo(data.promoCode.trim());
      setPromoState({ status: res.valid ? 'valid' : 'invalid', message: res.message });
    } catch {
      setPromoState({ status: 'invalid', message: 'No se pudo validar el código. Intentá de nuevo.' });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoError('Solo se permiten archivos JPG o PNG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('La foto debe pesar menos de 2 MB.');
      return;
    }
    setPhotoError('');
    setField('profilePhoto', file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setField('profilePhoto', null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  function buildPayload() {
    return {
      name: data.name.trim(),
      email: data.email.trim(),
      country_code: getCountry(data.countryCode).dial,
      phone: data.phone.trim(),
      birth_date: data.birthDate,
      password: data.password,
      password_confirmation: data.passwordConfirm,
      dni: data.dni?.trim() || undefined,
      preferred_sport: data.preferredSport,
      skill_level: data.skillLevel || undefined,
      preferred_days: data.preferredDays.length ? data.preferredDays : undefined,
      preferred_times: data.preferredTimes.length ? data.preferredTimes : undefined,
      team_name: data.teamName?.trim() || undefined,
      gender: data.gender || undefined,
      promo_code: promoState.status === 'valid' ? data.promoCode.trim().toUpperCase() : undefined,
      newsletter: data.newsletter,
      sms_notifications: data.smsNotifications,
      website: data.website,
      challenge_token: challenge?.token || undefined,
    };
  }

  const doSubmit = async () => {
    setSubmitting(true);
    setServerError('');
    setChallengeMsg('');
    const result = await registerUser(buildPayload());

    if (result.success) {
      if (data.profilePhoto) {
        try {
          await authService.uploadProfilePhoto(data.profilePhoto);
        } catch {
          // La foto es opcional: si falla la subida, la cuenta ya quedó creada.
        }
      }
      navigate('/register/success', { state: { email: result.data?.user?.email || data.email } });
      return;
    }

    setSubmitting(false);

    if (result.status === 429 && result.data?.challenge_required) {
      setChallenge(result.data.challenge);
      setChallengeAnswer('');
      setChallengeMsg('Demasiados intentos fallidos. Resolvé la operación para continuar.');
      setPromoState((p) => (p));
      return;
    }

    // Mapear errores del servidor a los campos
    if (result.errors) {
      const fieldMap = {
        name: 'name', email: 'email', phone: 'phone', birth_date: 'birthDate',
        password: 'password', dni: 'dni', promo_code: 'promoCode',
        preferred_sport: 'preferredSport', gender: 'gender', team_name: 'teamName',
      };
      const nextTouched = { ...touched };
      const nextErrors = { ...errors };
      Object.entries(result.errors).forEach(([k, msgs]) => {
        const field = fieldMap[k];
        if (field) {
          nextTouched[field] = true;
          nextErrors[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
      });
      setTouched(nextTouched);
      setErrors(nextErrors);
      setServerError('Revisá los campos marcados en rojo.');
    } else {
      setServerError(result.error || 'Ocurrió un error al crear tu cuenta. Intentá nuevamente.');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const solveAndSubmit = async () => {
    if (!challenge) return;
    setChallengeSolving(true);
    setChallengeMsg('');
    try {
      const res = await authService.solveChallenge(challenge.token, Number(challengeAnswer));
      if (res.success) {
        setChallenge({ ...challenge, token: res.challenge_token, solved: true });
        await doSubmit();
      } else {
        setChallenge(res.challenge || null);
        setChallengeAnswer('');
        setChallengeMsg('Respuesta incorrecta. Intentá de nuevo.');
      }
    } catch {
      setChallengeMsg('No se pudo verificar la respuesta. Intentá de nuevo.');
    } finally {
      setChallengeSolving(false);
    }
  };

  const goToLogin = () => navigate('/login');

  const fieldClass = (field) => {
    const e = touched[field] && errors[field] ? ' field--error' : '';
    const ok = touched[field] && !errors[field] && (data[field] || data[field] === false) ? ' field--ok' : '';
    return `reg-field${e}${ok}`;
  };

  const fieldErrorId = (field) => `${field}-error`;

  const summaryItems = [
    { label: 'Nombre', value: data.name },
    { label: 'Email', value: data.email },
    { label: 'Teléfono', value: `${getCountry(data.countryCode).dial} ${data.phone}` },
    { label: 'Nacimiento', value: data.birthDate },
    { label: 'Deporte', value: SPORTS.find((s) => s.value === data.preferredSport)?.label || '-' },
    { label: 'Nivel', value: data.skillLevel || '-' },
    { label: 'Documento', value: data.dni || '-' },
  ];

  return (
    <div className="reg-container">
      <div className="reg-card">
        <header className="reg-header">
          <div className="reg-logo" aria-hidden="true">⚽ F5 Turnos</div>
          <p className="reg-subtitle">Creá tu cuenta en menos de 2 minutos</p>
        </header>

        {serverError && (
          <div className="reg-alert reg-alert--error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <div>
              <strong>{serverError}</strong>
              <div className="reg-alert-actions">
                <button type="button" className="link-btn" onClick={() => window.location.reload()}><RefreshCw size={14} /> Reintentar</button>
                <a className="link-btn" href="mailto:soporte@f5turnos.com">Contactar soporte</a>
              </div>
            </div>
          </div>
        )}

        {/* Barra de progreso */}
        <nav className="reg-steps" aria-label="Progreso del registro">
          {STEPS.map((s) => (
            <button
              key={s.n}
              type="button"
              className={`reg-step ${s.n === step ? 'active' : ''} ${s.n < step ? 'done' : ''}`}
              onClick={() => jumpTo(s.n)}
              disabled={s.n >= step}
              aria-current={s.n === step ? 'step' : undefined}
            >
              <span className="reg-step-icon">
                {s.n < step ? <Check size={16} /> : <s.icon size={16} />}
              </span>
              <span className="reg-step-label">{s.title}</span>
            </button>
          ))}
        </nav>
        <div className="reg-progress" aria-hidden="true">
          <div className="reg-progress__bar" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <form
          className="reg-form"
          onSubmit={(e) => { e.preventDefault(); if (step < 4) goNext(); else if (challenge && !challenge.solved) solveAndSubmit(); else doSubmit(); }}
          noValidate
        >
          {/* Honeypot oculto para bots */}
          <div className="reg-hp" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input type="text" id="website" name="website" tabIndex="-1" autoComplete="off" value={data.website} onChange={(e) => setField('website', e.target.value)} />
          </div>

          {step === 1 && (
            <fieldset className="reg-step-body animate-fadeIn">
              <legend className="reg-step-title">
                <User size={22} aria-hidden="true" /> Información Personal
              </legend>
              <p className="reg-step-desc">Contanos quién sos para que tus reservas se gestionen rápido.</p>

              <SocialButtons />

              <div className="form-row">
                <div className={fieldClass('name')}>
                  <label htmlFor="name">Nombre completo <span className="req">*</span></label>
                  <div className="input-wrap">
                    <User size={18} aria-hidden="true" />
                    <input
                      type="text" id="name" name="name" autoComplete="name"
                      placeholder="Juan Pérez" value={data.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      aria-invalid={!!(touched.name && errors.name)}
                      aria-describedby={errors.name ? fieldErrorId('name') : undefined}
                    />
                    <FieldStatus ok={touched.name && !errors.name} show={touched.name} />
                  </div>
                  <ErrorMsg id={fieldErrorId('name')} message={touched.name ? errors.name : ''} />
                </div>

                <div className={fieldClass('email')}>
                  <label htmlFor="email">Email <span className="req">*</span></label>
                  <div className="input-wrap">
                    <Mail size={18} aria-hidden="true" />
                    <input
                      type="email" id="email" name="email" autoComplete="email"
                      placeholder="juan@ejemplo.com" value={data.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      aria-invalid={!!(touched.email && errors.email)}
                      aria-describedby={errors.email ? fieldErrorId('email') : undefined}
                    />
                    <FieldStatus ok={touched.email && !errors.email} show={touched.email} />
                  </div>
                  <ErrorMsg id={fieldErrorId('email')} message={touched.email ? errors.email : ''} />
                  <p className="field-hint">Te enviaremos un email de confirmación.</p>
                </div>
              </div>

              <div className={fieldClass('phone')}>
                <label htmlFor="phone">Teléfono móvil <span className="req">*</span></label>
                <div className="input-wrap input-wrap--phone">
                  <Phone size={18} aria-hidden="true" />
                  <select
                    id="countryCode" name="countryCode" value={data.countryCode}
                    onChange={(e) => setField('countryCode', e.target.value)}
                    aria-label="Código de país"
                    className="phone-country"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>
                    ))}
                  </select>
                  <input
                    type="tel" id="phone" name="phone" inputMode="tel" autoComplete="tel-national"
                    placeholder="11 1234-5678" value={data.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    aria-invalid={!!(touched.phone && errors.phone)}
                    aria-describedby={errors.phone ? fieldErrorId('phone') : undefined}
                  />
                  <FieldStatus ok={touched.phone && !errors.phone} show={touched.phone} />
                </div>
                <ErrorMsg id={fieldErrorId('phone')} message={touched.phone ? errors.phone : ''} />
                <p className="field-hint">Lo usaremos para confirmaciones y cambios de reserva.</p>
              </div>

              <div className={fieldClass('birthDate')}>
                <label htmlFor="birthDate">Fecha de nacimiento <span className="req">*</span></label>
                <div className="input-wrap">
                  <Cake size={18} aria-hidden="true" />
                  <input
                    type="date" id="birthDate" name="birthDate" autoComplete="bday" max={maxBirthDate()} min="1900-01-01"
                    value={data.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    onBlur={() => handleBlur('birthDate')}
                    aria-invalid={!!(touched.birthDate && errors.birthDate)}
                    aria-describedby={errors.birthDate ? fieldErrorId('birthDate') : undefined}
                  />
                  <FieldStatus ok={touched.birthDate && !errors.birthDate} show={touched.birthDate} />
                </div>
                <ErrorMsg id={fieldErrorId('birthDate')} message={touched.birthDate ? errors.birthDate : ''} />
                <p className="field-hint">Debés ser mayor de 18 años.</p>
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="reg-step-body animate-fadeIn">
              <legend className="reg-step-title">
                <ShieldCheck size={22} aria-hidden="true" /> Seguridad de la cuenta
              </legend>
              <p className="reg-step-desc">Una contraseña fuerte protege tus datos y reservas.</p>

              <div className="form-row">
                <div className={fieldClass('password')}>
                  <label htmlFor="password">Contraseña <span className="req">*</span></label>
                  <div className="input-wrap">
                    <Lock size={18} aria-hidden="true" />
                    <input
                      type={showPassword ? 'text' : 'password'} id="password" name="password" autoComplete="new-password"
                      placeholder="••••••••" value={data.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      aria-invalid={!!(touched.password && errors.password)}
                      aria-describedby="password-hint"
                    />
                    <button type="button" className="toggle-pw" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMsg id={fieldErrorId('password')} message={touched.password ? errors.password : ''} />
                  {data.password && (
                    <div className="pw-strength" aria-live="polite">
                      <div className={`pw-meter pw-meter--${strength.cssClass}`}>
                        <span style={{ width: `${(passwordScore / 4) * 100}%` }} />
                      </div>
                      <div className="pw-strength-row">
                        <span className={`pw-strength-label pw-strength-label--${strength.cssClass}`}>
                          Fortaleza: {strength.label}
                        </span>
                        <span className="pw-tooltip" role="note" tabIndex="0" aria-label="Requisitos de contraseña">
                          <AlertCircle size={14} />
                          <span className="pw-tooltip-content">
                            Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={fieldClass('passwordConfirm')}>
                  <label htmlFor="passwordConfirm">Confirmar contraseña <span className="req">*</span></label>
                  <div className="input-wrap">
                    <Lock size={18} aria-hidden="true" />
                    <input
                      type={showConfirm ? 'text' : 'password'} id="passwordConfirm" name="passwordConfirm" autoComplete="new-password"
                      placeholder="••••••••" value={data.passwordConfirm}
                      onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                      onBlur={() => handleBlur('passwordConfirm')}
                      aria-invalid={!!(touched.passwordConfirm && errors.passwordConfirm)}
                      aria-describedby={errors.passwordConfirm ? fieldErrorId('passwordConfirm') : undefined}
                    />
                    <button type="button" className="toggle-pw" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ErrorMsg id={fieldErrorId('passwordConfirm')} message={touched.passwordConfirm ? errors.passwordConfirm : ''} />
                </div>
              </div>

              <div className={fieldClass('dni')}>
                <label htmlFor="dni">DNI / Cédula de identidad <span className="opt">(opcional)</span></label>
                <div className="input-wrap">
                  <CreditCard size={18} aria-hidden="true" />
                  <input
                    type="text" id="dni" name="dni" inputMode="numeric" autoComplete="off"
                    placeholder="12345678" value={data.dni}
                    onChange={(e) => handleChange('dni', e.target.value)}
                    onBlur={() => handleBlur('dni')}
                    aria-invalid={!!(touched.dni && errors.dni)}
                    aria-describedby={errors.dni ? fieldErrorId('dni') : undefined}
                  />
                  <FieldStatus ok={touched.dni && !errors.dni} show={touched.dni && !!data.dni} />
                </div>
                <ErrorMsg id={fieldErrorId('dni')} message={touched.dni ? errors.dni : ''} />
                <p className="field-hint">Te identificamos en el local al momento del pago. Recomendado.</p>
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset className="reg-step-body animate-fadeIn">
              <legend className="reg-step-title">
                <Trophy size={22} aria-hidden="true" /> Preferencias deportivas
              </legend>
              <p className="reg-step-desc">Nos ayuda a recomendarte canchas y horarios ideales.</p>

              <div className={fieldClass('preferredSport')}>
                <span className="field-label" id="preferredSport-label">Deporte preferido <span className="req">*</span></span>
                <div className="sport-cards" role="radiogroup" aria-labelledby="preferredSport-label">
                  {SPORTS.map((s) => (
                    <button
                      type="button" key={s.value} role="radio" aria-checked={data.preferredSport === s.value}
                      className={`sport-card ${data.preferredSport === s.value ? 'selected' : ''}`}
                      onClick={() => { setField('preferredSport', s.value); handleBlur('preferredSport'); }}
                    >
                      <span className="sport-card__icon" aria-hidden="true">{s.icon}</span>
                      <span className="sport-card__label">{s.label}</span>
                      <span className="sport-card__desc">{s.desc}</span>
                      {data.preferredSport === s.value && <CheckCircle2 size={20} className="sport-card__check" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                <ErrorMsg id={fieldErrorId('preferredSport')} message={touched.preferredSport ? errors.preferredSport : ''} />
              </div>

              <div className="form-row">
                <div className="reg-field">
                  <span className="field-label">Nivel de juego <span className="opt">(opcional)</span></span>
                  <div className="chips" role="radiogroup" aria-label="Nivel de juego">
                    {LEVELS.map((lvl) => (
                      <button
                        type="button" key={lvl} role="radio" aria-checked={data.skillLevel === lvl}
                        className={`chip ${data.skillLevel === lvl ? 'chip--active' : ''}`}
                        onClick={() => setField('skillLevel', data.skillLevel === lvl ? '' : lvl)}
                      >
                        <Medal size={16} aria-hidden="true" /> {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="reg-field">
                  <span className="field-label">Días preferidos <span className="opt">(opcional)</span></span>
                  <div className="chips chips--grid" role="group" aria-label="Días preferidos">
                    {DAYS.map((d) => (
                      <button
                        type="button" key={d.value} role="checkbox" aria-checked={data.preferredDays.includes(d.value)}
                        className={`chip ${data.preferredDays.includes(d.value) ? 'chip--active' : ''}`}
                        onClick={() => toggleDays(d.value)}
                      >
                        <CalendarDays size={16} aria-hidden="true" /> {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="reg-field">
                <span className="field-label">Horarios preferidos <span className="opt">(opcional)</span></span>
                <div className="chips" role="group" aria-label="Horarios preferidos">
                  {TIMES.map((t) => (
                    <button
                      type="button" key={t.value} role="checkbox" aria-checked={data.preferredTimes.includes(t.value)}
                      className={`chip ${data.preferredTimes.includes(t.value) ? 'chip--active' : ''}`}
                      onClick={() => toggleTimes(t.value)}
                    >
                      <t.icon size={16} aria-hidden="true" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className={fieldClass('teamName')}>
                  <label htmlFor="teamName">Nombre del equipo <span className="opt">(opcional)</span></label>
                  <div className="input-wrap">
                    <Users size={18} aria-hidden="true" />
                    <input
                      type="text" id="teamName" name="teamName" autoComplete="organization"
                      placeholder="Los Amigos FC" value={data.teamName}
                      onChange={(e) => handleChange('teamName', e.target.value)}
                      onBlur={() => handleBlur('teamName')}
                      aria-invalid={!!(touched.teamName && errors.teamName)}
                      aria-describedby={errors.teamName ? fieldErrorId('teamName') : undefined}
                    />
                    <FieldStatus ok={touched.teamName && !errors.teamName} show={touched.teamName && !!data.teamName} />
                  </div>
                  <ErrorMsg id={fieldErrorId('teamName')} message={touched.teamName ? errors.teamName : ''} />
                  <p className="field-hint">Si sos capitán de equipo.</p>
                </div>

                <div className="reg-field">
                  <span className="field-label">Género <span className="opt">(opcional)</span></span>
                  <div className="chips" role="radiogroup" aria-label="Género">
                    {GENDERS.map((g) => (
                      <button
                        type="button" key={g.value} role="radio" aria-checked={data.gender === g.value}
                        className={`chip ${data.gender === g.value ? 'chip--active' : ''}`}
                        onClick={() => setField('gender', data.gender === g.value ? '' : g.value)}
                      >
                        <Shirt size={16} aria-hidden="true" /> {g.label}
                      </button>
                    ))}
                  </div>
                  <p className="field-hint">Se usa para torneos y categorías.</p>
                </div>
              </div>

              <div className={`${fieldClass('promoCode')} reg-field--promo`}>
                <label htmlFor="promoCode">Código promocional / referido <span className="opt">(opcional)</span></label>
                <div className="input-wrap">
                  <Gift size={18} aria-hidden="true" />
                  <input
                    type="text" id="promoCode" name="promoCode" autoComplete="off"
                    placeholder="BIENVENIDA-XXXXXX" value={data.promoCode}
                    onChange={(e) => { setField('promoCode', e.target.value); setPromoState((p) => (p.status === 'valid' ? { status: 'idle', message: '' } : p)); }}
                    onBlur={() => handleBlur('promoCode')}
                    aria-invalid={!!(touched.promoCode && errors.promoCode)}
                    aria-describedby="promo-msg"
                  />
                  <button type="button" className="btn-ghost" onClick={applyPromo} disabled={promoState.status === 'loading'}>
                    {promoState.status === 'loading' ? <Loader2 size={16} className="spin" /> : 'Aplicar'}
                  </button>
                </div>
                <ErrorMsg id={fieldErrorId('promoCode')} message={touched.promoCode ? errors.promoCode : ''} />
                <div id="promo-msg" className={`promo-msg ${promoState.status === 'valid' ? 'is-valid' : promoState.status === 'invalid' ? 'is-invalid' : ''}`} aria-live="polite">
                  {promoState.message}
                </div>
              </div>
            </fieldset>
          )}

          {step === 4 && (
            <fieldset className="reg-step-body animate-fadeIn">
              <legend className="reg-step-title">
                <FileCheck2 size={22} aria-hidden="true" /> Términos y finalización
              </legend>
              <p className="reg-step-desc">Último tramo: confirmá tus datos y aceptá las condiciones.</p>

              <div className="photo-section">
                <span className="field-label">Foto de perfil <span className="opt">(opcional)</span></span>
                <div className="photo-row">
                  <div className={`avatar ${photoPreview ? 'avatar--has' : ''}`}>
                    {photoPreview ? <img src={photoPreview} alt="Vista previa de tu foto de perfil" /> : <Camera size={28} aria-hidden="true" />}
                  </div>
                  <div className="photo-actions">
                    <input ref={fileRef} type="file" id="profilePhoto" name="profilePhoto" accept="image/jpeg,image/png" className="visually-hidden" onChange={handlePhotoChange} />
                    <label htmlFor="profilePhoto" className="btn btn--ghost btn--sm reg-photo-btn"><Upload size={16} aria-hidden="true" /> {photoPreview ? 'Cambiar foto' : 'Subir foto'}</label>
                    {photoPreview && (
                      <button type="button" className="btn btn--ghost btn--sm reg-photo-btn reg-photo-btn--danger" onClick={removePhoto}><X size={16} aria-hidden="true" /> Quitar</button>
                    )}
                  </div>
                </div>
                {photoError && <ErrorMsg id="photo-error" message={photoError} />}
                {!photoError && !photoPreview && <p className="field-hint">JPG o PNG, máximo 2 MB.</p>}
              </div>

              <div className="consent-list">
                <label className="checkbox" htmlFor="termsAccepted">
                  <input
                    type="checkbox" id="termsAccepted" name="termsAccepted" checked={data.termsAccepted}
                    onChange={(e) => handleChange('termsAccepted', e.target.checked)}
                    aria-invalid={!!errors.termsAccepted}
                  />
                  <span className="checkbox__box"><Check size={14} aria-hidden="true" /></span>
                  <span className="checkbox__text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Acepto los{' '}
                    <button type="button" className="link-btn" onClick={() => setTermsModal('terms')}>Términos y Condiciones</button>
                    <span className="req">*</span>
                  </span>
                </label>
                {errors.termsAccepted && touched.termsAccepted && <ErrorMsg id="termsAccepted-error" message={errors.termsAccepted} />}

                <label className="checkbox" htmlFor="privacyAccepted">
                  <input
                    type="checkbox" id="privacyAccepted" name="privacyAccepted" checked={data.privacyAccepted}
                    onChange={(e) => handleChange('privacyAccepted', e.target.checked)}
                    aria-invalid={!!errors.privacyAccepted}
                  />
                  <span className="checkbox__box"><Check size={14} aria-hidden="true" /></span>
                  <span className="checkbox__text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    He leído y acepto la{' '}
                    <button type="button" className="link-btn" onClick={() => setTermsModal('privacy')}>Política de Privacidad</button>
                    <span className="req">*</span>
                  </span>
                </label>
                {errors.privacyAccepted && touched.privacyAccepted && <ErrorMsg id="privacyAccepted-error" message={errors.privacyAccepted} />}

                <label className="checkbox" htmlFor="cancellationAccepted">
                  <input
                    type="checkbox" id="cancellationAccepted" name="cancellationAccepted" checked={data.cancellationAccepted}
                    onChange={(e) => handleChange('cancellationAccepted', e.target.checked)}
                    aria-invalid={!!errors.cancellationAccepted}
                  />
                  <span className="checkbox__box"><Check size={14} aria-hidden="true" /></span>
                  <span className="checkbox__text">
                    Entiendo la{' '}
                    <button type="button" className="link-btn" onClick={() => setTermsModal('cancellation')}>política de cancelación</button>:
                    <span className="cancellation-note"> "Las reservas deben pagarse en el local. Cancelaciones con menos de 24 hs de anticipación pueden tener penalización."</span>
                    <span className="req">*</span>
                  </span>
                </label>
                {errors.cancellationAccepted && touched.cancellationAccepted && <ErrorMsg id="cancellationAccepted-error" message={errors.cancellationAccepted} />}

                <label className="checkbox" htmlFor="newsletter">
                  <input type="checkbox" id="newsletter" name="newsletter" checked={data.newsletter} onChange={(e) => setField('newsletter', e.target.checked)} />
                  <span className="checkbox__box"><Check size={14} aria-hidden="true" /></span>
                  <span className="checkbox__text">Quiero recibir ofertas y novedades por email</span>
                </label>

                <label className="checkbox" htmlFor="smsNotifications">
                  <input type="checkbox" id="smsNotifications" name="smsNotifications" checked={data.smsNotifications} onChange={(e) => setField('smsNotifications', e.target.checked)} />
                  <span className="checkbox__box"><Check size={14} aria-hidden="true" /></span>
                  <span className="checkbox__text">Acepto recibir notificaciones por SMS/WhatsApp para recordatorios y cambios de última hora</span>
                </label>
              </div>

              {!challenge && (
                <details className="reg-summary">
                  <summary>Revisar resumen antes de enviar</summary>
                  <dl className="reg-summary__list">
                    {summaryItems.map((it) => (
                      <div key={it.label} className="reg-summary__row">
                        <dt>{it.label}</dt>
                        <dd>{it.value}</dd>
                      </div>
                    ))}
                    <div className="reg-summary__row">
                      <dt>Días</dt>
                      <dd>{data.preferredDays.length ? DAYS.filter((d) => data.preferredDays.includes(d.value)).map((d) => d.label).join(', ') : '-'}</dd>
                    </div>
                    <div className="reg-summary__row">
                      <dt>Horarios</dt>
                      <dd>{data.preferredTimes.length ? TIMES.filter((t) => data.preferredTimes.includes(t.value)).map((t) => t.label).join(', ') : '-'}</dd>
                    </div>
                  </dl>
                </details>
              )}

              {challenge && (
                <div className="reg-challenge" role="alert" aria-live="polite">
                  <div className="reg-challenge__head">
                    <AlertCircle size={18} aria-hidden="true" />
                    <strong>Verificación de seguridad</strong>
                  </div>
                  {challengeMsg && <p className="reg-challenge__msg">{challengeMsg}</p>}
                  {!challenge.solved && (
                    <>
                      <label htmlFor="challengeAnswer" className="challenge-question">
                        ¿Cuánto es "{challenge.question}"?
                      </label>
                      <div className="reg-challenge__row">
                        <input
                          type="number" id="challengeAnswer" name="challengeAnswer" inputMode="numeric"
                          value={challengeAnswer}
                          onChange={(e) => setChallengeAnswer(e.target.value)}
                          placeholder="Resultado"
                        />
                        <button type="button" className="btn-challenge" onClick={solveAndSubmit} disabled={challengeSolving || !challengeAnswer}>
                          {challengeSolving ? <Loader2 size={16} className="spin" /> : 'Verificar'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </fieldset>
          )}

          <div className="reg-nav">
            <Button variant="secondary" size="md" onClick={goBack} disabled={step === 1 || submitting} className="reg-nav-btn">
              <ChevronLeft size={18} aria-hidden="true" /> Atrás
            </Button>

            {step < 4 ? (
              <Button type="submit" variant="primary" size="md" className="reg-nav-btn">
                Siguiente <ChevronRight size={18} aria-hidden="true" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" size="md" disabled={submitting || (challenge && !challenge.solved)} className="reg-nav-btn">
                {submitting ? (<><Loader2 size={18} className="spin" aria-hidden="true" /> Creando tu cuenta…</>) : (<><Send size={18} aria-hidden="true" /> Crear cuenta</>)}
              </Button>
            )}
          </div>

          <p className="reg-login-link">
            ¿Ya tenés cuenta? <button type="button" className="link-btn" onClick={goToLogin}>Iniciá sesión</button>
          </p>
        </form>
      </div>

      {submitting && (
        <div className="reg-overlay" role="status" aria-live="polite">
          <div className="reg-overlay__box animate-scaleIn">
            <Loader2 size={40} className="spin" aria-hidden="true" />
            <p>Creando tu cuenta...</p>
          </div>
        </div>
      )}

      <Modal open={!!termsModal} onClose={() => setTermsModal('')} title={termsModal === 'terms' ? 'Términos y Condiciones' : termsModal === 'privacy' ? 'Política de Privacidad' : 'Política de Cancelación'}>
        {termsModal === 'terms' && (
          <div className="legal-text">
            <p>Al registrarte en F5 Turnos aceptás las siguientes condiciones:</p>
            <ul>
              <li>Las reservas se confirman al momento y deben abonarse en el local.</li>
              <li>Los horarios se respetan por puntualidad; la tolerancia máxima es de 10 minutos.</li>
              <li>F5 Turnos puede modificar las condiciones comunicándolo por email.</li>
              <li>El mal uso de la plataforma puede derivar en la suspensión de la cuenta.</li>
            </ul>
          </div>
        )}
        {termsModal === 'privacy' && (
          <div className="legal-text">
            <p>Tratamos tus datos personales con total responsabilidad:</p>
            <ul>
              <li>Usamos tu información únicamente para gestionar reservas, pagos y comunicaciones vinculadas a tu cuenta.</li>
              <li>Tu teléfono y email solo se utilizan para confirmaciones, recordatorios y cambios de última hora cuando lo autorizás.</li>
              <li>Nunca compartimos tus datos con terceros sin tu consentimiento.</li>
              <li>Podés solicitar la baja o eliminación de tu cuenta en cualquier momento.</li>
            </ul>
          </div>
        )}
        {termsModal === 'cancellation' && (
          <div className="legal-text">
            <p>Las reservas deben pagarse en el local.</p>
            <p>Cancelaciones con menos de 24 hs de anticipación pueden tener penalización.</p>
            <p>Ante lluvia u otro evento de fuerza mayor, coordinamos la reprogramación sin cargo.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}