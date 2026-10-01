# Análisis del Admin Dashboard — Turnos Canchas

**Fecha:** 8 de septiembre de 2026  
**Proyecto:** Turnos Canchas (Laravel API)  
**Clasificación:** BORRADOR / CONFIDENCIAL

---

## Resumen Ejecutivo

Se revisaron **18 archivos** del backend Laravel (controladores, middlewares, modelos, rutas, recursos, configuración) enfocados en el panel de administración con dos roles: **Admin** y **Superadmin**.

| Métrica | Valor |
|---|---|
| Errores críticos (P0) | 6 |
| Problemas de diseño/mejoras (P1–P3) | 11 |
| Mejoras específicas por rol | 9 |
| Archivos con hallazgos | 12 |

---

## 1. Arquitectura de Roles

### Rutas protegidas (`routes/api.php`)

| Middleware | Rutas | Descripción |
|---|---|---|
| `admin` | 31 rutas | Dashboard stats, Canchas CRUD, Turnos (update/destroy), Clientes CRUD, Horarios CRUD, Pagos CRUD + PDF |
| `superadmin` | 33 rutas | Bug reports, Logs, Auditorías, Usuarios (roles/eliminar), Backups + Programación |

### Middlewares

- **`IsAdmin`** (línea 14): `in_array($user->role, ['admin', 'superadmin'])` — Superadmin hereda permisos de admin.
- **`IsSuperAdmin`** (línea 13): `$user->role !== 'superadmin'` — Acceso exclusivo.

---

## 2. Errores Críticos (P0 — Bloqueantes)

| # | Archivo:Línea | Problema | Impacto |
|---|---|---|---|
| 1 | `DashboardController.php:23` `ClienteController.php:20` `PagoController.php:37` | **Uso de `ilike` (PostgreSQL)** — Falla en MySQL/SQLite. | Consultas rotas en BD no-PostgreSQL. |
| 2 | `BugReportController.php:139` | **Export PDF sin límite** — `BugReport::all()` carga TODO en memoria. | OOM en producción con miles de reportes. |
| 3 | `LogController.php:61–73` | **`destroy($id)` borra TODO el log** — No elimina línea individual, vacía `laravel.log` completo. | Pérdida total de logs; engañoso y peligroso. |
| 4 | `routes/api.php:67` | **Cache de dashboard no invalida** — Clave global `dashboard.stats`; 10s stale para todos. | Datos desactualizados tras CRUD. |
| 5 | `TurnoController.php:148–152` | **Actualiza precio sin validar ownership** — Admin cambia `cancha_id`/`hora` y recalcula precio sin verificar `user_id`. | Posible manipulación de precios. |
| 6 | `config/turnos.php:8` | **Email admin por defecto hardcoded** — `'admin@canchas.com'` se usa en producción si no hay `ADMIN_EMAIL` en `.env`. | Emails a dirección inexistente. |

---

## 3. Problemas de Diseño / Mejoras (P1–P3)

| Prioridad | Área | Problema | Recomendación |
|---|---|---|---|
| P1 | Dashboard | Cache key global | Clave por usuario o invalidar con tags/events |
| P1 | ClienteResource | Datos sensibles (DNI, tel, email) expuestos a cualquier admin | Policy: superadmin ve todo, admin solo ve clientes con turnos asignados |
| P1 | Rate limiting | Solo rutas públicas tienen throttle | Añadir `throttle:60,1` a rutas admin/superadmin |
| P1 | AuthController | `getAllUsers`, `updateUserRole`, `deleteUser` sin validación de "último superadmin" | Impedir borrar/degradar al único superadmin |
| P2 | Dashboard | Stats básicos; sin desglose | Añadir: `turnos_por_estado`, `ingresos_mes_anterior`, `ocupacion_promedio`, `top_canchas` |
| P2 | Turnos | Admin puede `destroy` cualquier turno (soft delete) pero no hay forma de ver eliminados | Añadir `withTrashed()` en index admin + filtro `trashed_only` |
| P2 | BackupController | `download` lee archivo completo en memoria (`$content`) | Usar `response()->streamDownload()` para archivos grandes |
| P2 | Horarios | `CanchaController.store()` inserta 105 filas hardcoded (7 días × 15 franjas) | Hacer configurable: franjas, días, rango horario |
| P3 | Auditoría | Admin no ve auditorías (solo superadmin) | Exponer `audits` read-only a admin (filtrado por recursos que gestiona) |
| P3 | Pagos | `exportPdf` duplica lógica de `index` | Extraer query a método privado `buildPagosQuery()` |
| P3 | Bug Reports | `store` envía email síncrono (bloquea request) | Usar queue (`ShouldQueue`) |

---

## 4. Mejoras Específicas por Rol

### Admin (gestión operativa)
1. **Dashboard enriquecido**: gráficos de ocupación, ingresos por cancha, turnos pendientes de confirmar/pendientes de seña
2. **Filtros avanzados** en listados (fecha rango, cancha, estado, cliente)
3. **Vista de turnos eliminados** (papelera) con restore
4. **Exportar listados a CSV/Excel** (no solo PDF pagos)
5. **Notificaciones**: badge de turnos pendientes, bugs nuevos asignados

### Superadmin (gobernanza y plataforma)
1. **Gestión de roles con validaciones**: no auto-degradarse, no borrar último superadmin
2. **Dashboard de salud del sistema**: logs error count, backup status, disk space, queue jobs
3. **Impersonación** (login as user) para debugging
4. **Auditoría de acciones admin** (quién borró qué, cuándo)
5. **Configuración dinámica** (senia %, email admin, límites) desde UI

---

## 5. Plan de Acción Priorizado

| Prioridad | Acción | Archivos Afectados | Esfuerzo |
|---|---|---|---|
| **P0** | Fix `ilike` → compatible MySQL/SQLite | `DashboardController`, `ClienteController`, `PagoController` | Bajo |
| **P0** | Fix `LogController::destroy()` — eliminar o renombrar a `clearAll()` | `LogController` | Bajo |
| **P0** | Fix `BugReportController::exportPdf()` — añadir `limit(500)` | `BugReportController` | Bajo |
| **P1** | Invalidar cache dashboard en eventos CRUD relevantes | `DashboardController`, observers/events | Medio |
| **P1** | Rate limiting en rutas admin/superadmin | `routes/api.php` | Bajo |
| **P1** | Validar "último superadmin" en AuthController | `AuthController` | Medio |
| **P2** | Enriquecer dashboard stats | `DashboardController` | Medio |
| **P2** | Policies (Authorization) en lugar de solo middleware | Nuevo: `ClientePolicy`, `TurnoPolicy`, etc. | Alto |
| **P3** | Queue para emails de bug reports | `BugReportController`, nuevo Job | Medio |
| **P3** | Configuración horarios dinámica | `CanchaController`, config, migración | Medio |

---

## 6. Anexos Técnicos

### Modelos Principales
- `User` — roles: `user`, `admin`, `superadmin`
- `Cliente` — datos personales (DNI, teléfono, email), `SoftDeletes`, `Auditable`
- `Turno` — estados: `pendiente`, `confirmado`, `cancelado`, `completado`, `pendiente_senia`
- `Cancha` — tipos: `futbol5`, `padel`
- `Pago` — métodos: `efectivo`, `tarjeta`, `transferencia`, `mercadopago`
- `BugReport` — tipos: `bug`, `mejora`, `pregunta`; prioridades: `baja`, `media`, `alta`, `critica`

### Configuración (`config/turnos.php`)

```php
'senia' => [
    'porcentaje' => env('SENIA_PORCENTAJE', 30),
    'minutos_expiracion' => env('SENIA_MINUTOS_EXPIRACION', 15),
],
'admin_email' => env('ADMIN_EMAIL', 'admin@canchas.com'),
```

### Recursos
- `ClienteResource` — oculta `email`, `telefono`, `dni` a no-admins (línea 24–28)

---

## 7. Checklist de Verificación Post-Fix

- [ ] Tests de integración para middlewares `admin` / `superadmin`
- [ ] Verificar queries con `LIKE` case-insensitive en MySQL/SQLite
- [ ] Probar export PDF con 1000+ registros (memory < 128MB)
- [ ] Confirmar `LogController::clearAll()` requiere confirmación explícita
- [ ] Cache dashboard se invalida tras crear/editar/borrar turno, cancha, cliente, pago
- [ ] Rate limiting responde 429 con `Retry-After` header
- [ ] No se puede degradar/borrar el último superadmin
- [ ] Dashboard muestra métricas comparativas (mes actual vs anterior)

---

*Generado automáticamente — revisar y validar antes de aplicar cambios en producción.*