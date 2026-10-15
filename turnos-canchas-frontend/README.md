# F5 Turnos Frontend

SPA React/Vite para reservas y administracion de canchas. Configura `VITE_API_URL` con la URL de la API Laravel.

```bash
npm ci
npm run dev
npm run lint
npm run build
```

Las rutas administrativas requieren autenticacion y el backend mantiene la autorizacion definitiva. La disponibilidad solo se muestra cuando la API puede confirmarla; nunca se generan turnos de ejemplo.

Consulta el [`README` raiz](../README.md) para despliegue y [`SECURITY.md`](../SECURITY.md) para controles de seguridad.
