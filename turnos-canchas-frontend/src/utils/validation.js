import { isValidPhone, stripNonDigits, getCountry } from './countries';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ok(message = '') {
  return { ok: true, message };
}

function fail(message) {
  return { ok: false, message };
}

export function validateName(name = '') {
  const value = name.trim();
  if (!value) return fail('El nombre es obligatorio.');
  if (value.length < 3) return fail('El nombre debe tener al menos 3 caracteres.');
  if (!/^[\p{L} ]+$/u.test(value)) return fail('Solo se permiten letras y espacios.');
  if (value.length > 120) return fail('El nombre es demasiado largo.');
  return ok();
}

export function validateEmail(email = '') {
  const value = email.trim();
  if (!value) return fail('El email es obligatorio.');
  if (value.length > 255) return fail('El email es demasiado largo.');
  if (!EMAIL_RE.test(value)) return fail('Ingresá un email válido (ej: juan@ejemplo.com).');
  return ok();
}

export function validatePhone(countryCode, phoneNumber = '') {
  if (!phoneNumber.trim()) return fail('El teléfono es obligatorio.');
  const digits = stripNonDigits(phoneNumber);
  if (!isValidPhone(countryCode, phoneNumber)) {
    return fail('El teléfono no es válido para el país seleccionado.');
  }
  if (digits.length < 6) return fail('El teléfono es demasiado corto.');
  return ok();
}

export function validateBirthDate(value = '') {
  if (!value) return fail('La fecha de nacimiento es obligatoria.');
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return fail('Fecha inválida.');
  if (birth > new Date()) return fail('La fecha no puede ser futura.');
  const eighteen = new Date();
  eighteen.setFullYear(eighteen.getFullYear() - 18);
  if (birth > eighteen) return fail('Debés ser mayor de 18 años para registrarte.');
  if (birth < new Date('1900-01-01')) return fail('Fecha demasiado lejana.');
  return ok();
}

export function validatePassword(password = '') {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const valid = score === 4;

  if (!password) return { ...fail('La contraseña es obligatoria.'), score: 0, checks };

  let message = '';
  if (!valid) {
    const missing = [];
    if (!checks.length) missing.push('mínimo 8 caracteres');
    if (!checks.upper) missing.push('1 mayúscula');
    if (!checks.number) missing.push('1 número');
    if (!checks.symbol) missing.push('1 símbolo');
    message = 'Falta: ' + missing.join(', ') + '.';
  }

  return { ok: valid, message, score, checks };
}

export function validatePasswordConfirm(password = '', confirmation = '') {
  if (!confirmation) return fail('Confirmá tu contraseña.');
  if (password !== confirmation) return fail('Las contraseñas no coinciden.');
  return ok();
}

export function validateDni(value = '') {
  const v = (value || '').trim();
  if (!v) return ok();
  if (!/^\d{6,11}$/.test(v)) return fail('El DNI debe tener entre 6 y 11 dígitos.');
  return ok();
}

export function validatePromoCode(value = '') {
  const v = (value || '').trim();
  if (!v) return ok();
  if (v.length < 4 || v.length > 20) return fail('El código debe tener entre 4 y 20 caracteres.');
  if (!/^[A-Za-z0-9-]+$/.test(v)) return fail('Solo letras, números y guiones.');
  return ok();
}

export function validateRequired(value) {
  if (!value) return fail('Este campo es obligatorio.');
  if (Array.isArray(value) && value.length === 0) return fail('Debés seleccionar al menos una opción.');
  return ok();
}

export function passwordStrengthLabel(score) {
  if (score <= 1) return { label: 'Baja', cssClass: 'weak' };
  if (score === 2) return { label: 'Media', cssClass: 'medium' };
  if (score === 3) return { label: 'Alta', cssClass: 'strong' };
  return { label: 'Muy alta', cssClass: 'strong' };
}

export function countryLabel(countryCode) {
  const country = getCountry(countryCode);
  return `${country.flag} ${country.dial}`;
}

export { stripNonDigits };