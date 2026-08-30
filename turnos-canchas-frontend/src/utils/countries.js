export const DEFAULT_COUNTRY_CODE = 'AR';

export const COUNTRIES = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dial: '+54', digits: 11 },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dial: '+598', digits: 8 },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dial: '+56', digits: 9 },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dial: '+595', digits: 9 },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', dial: '+55', digits: 11 },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', dial: '+591', digits: 8 },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dial: '+57', digits: 10 },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', dial: '+51', digits: 9 },
  { code: 'MX', name: 'México', flag: '🇲🇽', dial: '+52', digits: 10 },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', dial: '+1', digits: 10 },
  { code: 'ES', name: 'España', flag: '🇪🇸', dial: '+34', digits: 9 },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', dial: '+39', digits: 12 },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪', dial: '+49', digits: 11 },
  { code: 'FR', name: 'Francia', flag: '🇫🇷', dial: '+33', digits: 9 },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dial: '+351', digits: 9 },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', dial: '+44', digits: 10 },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dial: '+593', digits: 9 },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dial: '+58', digits: 11 },
];

export function getCountry(code = DEFAULT_COUNTRY_CODE) {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
}

export function stripNonDigits(value) {
  return (value || '').replace(/\D/g, '');
}

export function isValidPhone(countryCode, phoneNumber) {
  const digits = stripNonDigits(phoneNumber);
  if (!digits) return false;
  // Rango razonable de dígitos locales sin prefijo de país
  return digits.length >= 6 && digits.length <= 15;
}

export function totalDigits(countryCode, phoneNumber) {
  const country = getCountry(countryCode);
  const local = stripNonDigits(phoneNumber);
  const dial = stripNonDigits(country.dial);
  return {
    local,
    dial,
    total: local.length + dial.length,
  };
}