-- =============================================================================
-- HABILITAR ROW-LEVEL SECURITY (RLS) - F5 Turnos
-- =============================================================================
-- CONTEXTO:
--   - Laravel es el ÚNICO cliente que accede a esta base de datos.
--   - Laravel se conecta con el rol "postgres" que BYPASEA RLS por diseño.
--   - Habilitar RLS sin policies permisivas bloquea ÚNICAMENTE el acceso
--     desde la Supabase REST/JS API pública (anon/authenticated roles).
--   - Este script NO afecta el funcionamiento de la aplicación.
--
-- INSTRUCCIONES:
--   1. Abrir Supabase Dashboard → SQL Editor
--   2. Pegar este script completo y ejecutar (Run)
--   3. Verificar en Advisors → Security que los warnings desaparecen
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLAS DE USUARIOS Y AUTENTICACIÓN (Riesgo: CRÍTICO)
-- Contienen passwords, emails, tokens, DNI, datos personales
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Sin policies → nadie desde la API pública puede leer ni escribir users
-- El rol postgres (Laravel) bypasea RLS y mantiene acceso total

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
-- Tokens de reset de contraseña — no deben ser accesibles públicamente

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
-- Payloads de sesión encriptados — solo uso interno de Laravel

ALTER TABLE public.personal_access_tokens ENABLE ROW LEVEL SECURITY;
-- Sanctum API tokens — exposición crítica si son accesibles públicamente

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLAS DE NEGOCIO CON DATOS PERSONALES (Riesgo: CRÍTICO / ALTO)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
-- Contiene: nombre, apellido, email, teléfono, DNI
-- Datos personales sensibles

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
-- Contiene: relación cliente-cancha, fechas, precios, estados de pago

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLAS DE NEGOCIO (Riesgo: MEDIO)
-- Sin datos personales pero proteger de escritura pública
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.canchas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLAS INTERNAS / LOGS (Riesgo: ALTO)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLAS INTERNAS DE LARAVEL (Riesgo: MEDIO)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_locks ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- VERIFICACIÓN — ejecutar para confirmar estado de RLS en todas las tablas
-- =============================================================================
SELECT
    tablename,
    rowsecurity AS rls_enabled,
    CASE WHEN rowsecurity THEN 'Protegida' ELSE 'EXPUESTA' END AS estado
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled ASC, tablename ASC;
