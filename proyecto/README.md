# F5 Turnos API

API Laravel para autenticacion, reservas, canchas, horarios, clientes, pagos operativos y administracion por roles.

## Desarrollo

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan test
```

Usa PostgreSQL para integracion y Supabase solamente mediante variables de entorno. No ejecutes `migrate:fresh` contra un entorno compartido o de produccion.

## Controles

- Sanctum y roles `user`, `admin` y `superadmin`.
- El email verificado es obligatorio para crear reservas.
- Cada cliente esta vinculado a un usuario para impedir reservas con datos de otra persona.
- La disponibilidad se valida en servidor contra cancha activa, franja habilitada y solapamientos.

La documentacion operativa y de seguridad esta en el [`README` raiz](../README.md) y [`SECURITY.md`](../SECURITY.md).
