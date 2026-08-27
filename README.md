# F5 Turnos - Sistema de Gestión de Turnos (Fútbol 5 / Pádel)

Sistema web para la reserva de canchas de fútbol 5 y pádel. Flujo sin pagos online: el usuario solicita turno (estado `pendiente`), el administrador confirma (`confirmado`) y el pago se realiza 100% en el local el día del turno.

> Repositorio de deploy: [Sstefano7/F5-Turnos](https://github.com/Sstefano7/F5-Turnos) · Backend + Frontend en Vercel · DB en Supabase (PostgreSQL).

## 📋 Características

- **Autenticación**: Registro/login con roles `user` / `admin` / `superadmin` (Sanctum)
- **Gestión de Canchas**: CRUD (tipo `futbol5` / `padel`, precio/hora, activa/inactiva, imagen en Supabase Storage)
- **Sistema de Reservas**: Selección fecha + horario (08:00-23:00) con validación de solapamiento; estado `pendiente` → admin confirma a `confirmado` → `completado`/`cancelado`
- **Sin seña ni MercadoPago**: sin webhooks ni seña; reserva queda pendiente de confirmación
- **Panel Administración**: Dashboard con stats, gestión de turnos/clientes/horarios, paginación
- **Superadmin**: Bug reports, auditoría, logs, backups, gestión de usuarios y export PDF
- **Auditoría y Backups**: `owen-it/laravel-auditing` + `spatie/laravel-backup`
- **Storage**: Imágenes/PDFs en Supabase Storage (S3-compatible)
- **Responsive** y paginación

## 🛠️ Tecnologías

### Backend
- PHP 8.2+, Laravel 12.48
- PostgreSQL 16 (Supabase, pooler `aws-0-sa-east-1.pooler.supabase.com:5432`, `DB_SSLMODE=require`)
- Laravel Sanctum 4 (API tokens), Laravel Auditing 14, DomPDF 3.1, Spatie Backup 9.3
- `pdo_pgsql` / `pgsql` habilitados en `C:\xampp\php\php.ini` (`extension=pdo_pgsql`, `extension=pgsql`)
- Serverless: `proyecto/api/index.php` + `proyecto/vercel.json` (PHP 8.3, 10s timeout Hobby), `SESSION_DRIVER=cookie`, `CACHE_DRIVER=array`, `QUEUE_CONNECTION=sync`, `FILESYSTEM_DISK=supabase`, `LOG_CHANNEL=stderr`

### Frontend
- React 19, Vite 7, React Router 7, Axios, SweetAlert2, CSS3
- Build optimizado + `vercel.json` (SPA rewrites), `VITE_API_URL` para backend

### Infra
- **Vercel** (2 proyectos: `turnos-canchas-frontend` + `turnos-canchas-api`)
- **Supabase** (PostgreSQL 500MB + Storage 1GB free tier, buckets `turnos-storage` privado, extensiones `uuid-ossp`/`pg_trgm`)
- GitHub Actions: CI (Pest/Postgres + lint/build) + deploy (preview/prod) + scheduler `turnos:liberar-expirados` cada 5 min

## 📦 Requisitos Previos

- PHP >= 8.2, Composer, Node.js >= 18, Git
- Cuenta Supabase (free) + Vercel (Hobby), XAMPP opcional solo para PHP local con `pdo_pgsql`
- No requiere MySQL local para producción (Supabase); MySQL solo si usás `.env.backup.local`

## 🚀 Instalación Local

### 1. Clonar
```bash
git clone https://github.com/Sstefano7/F5-Turnos.git
cd F5-Turnos
```

### 2. Backend (Laravel)
```bash
cd proyecto
composer install
cp .env.example .env
php artisan key:generate
```

Editar `.env` para **Supabase** (ejemplo real del proyecto):
```env
APP_NAME="Gestión de Turnos"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
APP_FRONTEND_URL=http://localhost:5173

DB_CONNECTION=pgsql
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.zaroujeqysxgwughvsnd
DB_PASSWORD=rUusjngOjWamaNVq
DB_SSLMODE=require

CACHE_DRIVER=array
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=supabase

SUPABASE_URL=https://zaroujeqysxgwughvsnd.supabase.co
SUPABASE_KEY=eyJhbGciOi... (anon public)
SUPABASE_SERVICE_KEY=eyJhbGciOi... (service_role, solo backend)
SUPABASE_BUCKET=turnos-storage
SUPABASE_REGION=sa-east-1
```

Crear bucket y credenciales en Supabase Dashboard:
- Storage → New Bucket `turnos-storage` (private, 5MB, `image/*,application/pdf`)
- Storage → Policies (service_role INSERT/SELECT), SQL Editor: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS "pg_trgm";`
- Settings → API: copiar `Project URL`, `anon public`, `service_role secret`
- Settings → Database → Connection Pooling: Transaction, port 5432, host `aws-0-sa-east-1.pooler.supabase.com`

Migrar y seedear (requiere `pdo_pgsql` habilitado):
```bash
php artisan migrate:fresh --seed --force
# → 4 canchas, 420 horarios (4×7×15), 3 clientes, 2 users
php artisan serve
# → http://localhost:8000
```

**Credenciales seed:**
- `superadmin@canchas.com` / `password123` (superadmin)
- `admin@canchas.com` / `password123` (admin)

### 3. Frontend (React)
```bash
cd ../turnos-canchas-frontend
npm install
# .env local opcional:
# VITE_API_URL=http://localhost:8000/api
npm run dev
# → http://localhost:5173
```

### Verificar
```bash
php artisan tinker --execute="echo 'Canchas: '.App\Models\Cancha::count().PHP_EOL; echo 'Horarios: '.App\Models\Horario::count().PHP_EOL; echo 'Clientes: '.App\Models\Cliente::count().PHP_EOL; echo 'Users: '.App\Models\User::count().PHP_EOL;"
# Canchas: 4, Horarios: 420, Clientes: 3, Users: 2
php artisan route:list
npm run build  # producción frontend
```

## ☁️ Despliegue en Vercel + Supabase

### Vercel: 2 proyectos vinculados a `Sstefano7/F5-Turnos`
| Proyecto | Root Directory | Build Command | Output |
|---|---|---|---|
| `turnos-canchas-api` | `proyecto` | `composer install --no-dev --optimize-autoloader && php artisan config:cache && php artisan route:cache && php artisan view:cache` | `public` (`api/index.php` entry) |
| `turnos-canchas-frontend` | `turnos-canchas-frontend` | `npm run build` | `dist` |

`proyecto/vercel.json`: PHP 8.3, `maxDuration: 10` (Hobby), `memory: 1024`, env `SESSION_DRIVER=cookie`/`CACHE_DRIVER=array`/`QUEUE_CONNECTION=sync`/`FILESYSTEM_DISK=supabase`/`LOG_CHANNEL=stderr`
`proyecto/.vercelignore`: excluye vendor, storage, tests, docker
`turnos-canchas-frontend/vercel.json`: SPA rewrites, cache headers, `VITE_API_URL`
`proyecto/api/index.php`: entry point serverless

**Variables en Vercel Dashboard (Settings → Environment Variables):**
- Backend: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.tudominio.com`, `APP_FRONTEND_URL=https://tudominio.com`, `DB_*` (pooler), `SUPABASE_*`, `SESSION_DRIVER=cookie` etc.
- Frontend: `VITE_API_URL=https://api.tudominio.com`

DNS: `A @ → 76.76.21.21`, `CNAME www/api → cname.vercel-dns.com` (Proxied si Cloudflare)

### Supabase (producción)
Usa las mismas credenciales del `.env` anterior. Migraciones ya aplicadas vía `migrate:fresh --seed` local apuntando a Supabase. Para cambios futuros: push a `main` → GitHub Actions (`.github/workflows/ci.yml`, `deploy.yml`, `scheduler.yml`) hace CI + deploy.

## 🎯 Uso del Sistema

### Acceso Público
1. Abrir frontend (`http://localhost:5173` o `https://tudominio.com`)
2. Ver canchas sin login
3. Para reservar: login requerido

### Registro
Iniciar Sesión → Regístrate → completar → reservas habilitadas

### Hacer una Reserva (sin seña)
1. Login como user
2. Elegir cancha → fecha → horario disponible
3. Completar datos (DNI autocompleta si existe)
4. Confirmar → turno `pendiente` → mensaje "Pago total en el local: $X. Sin seña ni pagos online. Se paga todo el día del turno."
5. Mis Reservas: ver estado `pendiente` → admin confirma a `confirmado`

### Panel Admin (`/admin`, rol `admin`/`superadmin`)
- Dashboard stats, gestión canchas/turnos/clientes/horarios
- En turnos: dropdown `Cambiar estado` → `confirmado`/`cancelado`/`completado`

### Superadmin (`/admin/bug-reports`, `/admin/audits`, `/admin/logs`, `/admin/backups`, `/admin/users`)
- Export PDF, gestión usuarios/roles, backups schedule

## 📁 Estructura
```
proyecto/
├── api/index.php              # Entry Vercel
├── vercel.json / .vercelignore
├── app/Http/Controllers/Api/  # Cancha, Turno (simplificado sin seña/MP), Cliente, Horario, Auth, Dashboard...
├── app/Models/                # Cancha, Turno (pendiente/confirmado/cancelado/completado), Cliente, User...
├── database/migrations/       # Compatibles PG (enum→check, hasTable guards)
├── routes/api.php             # Sin /mp/* ni /pagos/*; admin confirma via PUT /turnos/{id}
└── config/filesystems.php     # Disco supabase (S3)

turnos-canchas-frontend/
├── vercel.json / vite.config.js
├── src/config/api.js          # VITE_API_URL
├── src/pages/Reservar.jsx     # Sin flujo pago: pendiente → mensaje pago 100% en local
├── src/pages/admin/           # GestionTurnos con confirmar, sin GestionPagos
└── src/services/              # sin pagoService.js

.github/workflows/
├── ci.yml / deploy.yml / scheduler.yml
```

## 🔧 Comandos Útiles
```bash
# Backend
php artisan cache:clear; php artisan config:clear; php artisan route:clear
php artisan route:list
php artisan migrate:fresh --seed  # CUIDADO: borra todo (Supabase o local)
php artisan tinker
composer dump-autoload

# Frontend
npm run build; npm run preview; npm run lint
```

## 🐛 Solución de Problemas
- `could not find driver pgsql`: habilitar `extension=pdo_pgsql` y `extension=pgsql` en `C:\xampp\php\php.ini`, reiniciar Apache/php
- `relation already exists password_reset_tokens`: ya patchado con `hasTable` guard; si persiste: `migrate:fresh`
- `canchas.deleted_at does not exist`: recreado `2026_03_03_000241_add_soft_deletes_to_tablas.php` sin `pagos`
- `check syntax error` en role: patchado con `CHECK` raw para PG
- `pagos table not found` en índices: ya guarda con `hasTable`
- `Vercel 10s timeout`: dentro de límite (PDFs 3-5s, sin MP); si reportes pesados → optimizar DOMPDF o background via Supabase Storage
- CORS: `config/cors.php` `allowed_origins` debe incluir `APP_FRONTEND_URL` / `VITE_API_URL`
- Puerto ocupado: `php artisan serve --port=8001`, `npm run dev -- --port 5174`

## 📧 Email (opcional)
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tu-email@gmail.com
```

## 👥 Usuarios de Prueba
- Superadmin: `superadmin@canchas.com` / `password123`
- Admin: `admin@canchas.com` / `password123`
- Clientes seed: `juan.perez@email.com`, `maria.gonzalez@email.com`, `carlos.rodriguez@email.com`

## 📝 Licencia
MIT.

## 👨‍💻 Autor
Stefano Schneider · GitHub: [@Sstefano7](https://github.com/Sstefano7) · Repo deploy: [F5-Turnos](https://github.com/Sstefano7/F5-Turnos)

## 🤝 Contribuciones
Fork → `git checkout -b feature/Nombre` → commit → `git push f5 feature/Nombre` → PR a `main`.

## 📞 Soporte
Reportar bug desde la app (botón 🐛) o issue en GitHub.
