# Sistema de Gestión de Turnos - Canchas Deportivas

Sistema web completo para la gestión de reservas de canchas de fútbol 5 y pádel, con panel de administración, sistema de pagos y reportes.

## 📋 Características

- **Sistema de Autenticación**: Login y registro con roles (Usuario/Admin)
- **Gestión de Canchas**: CRUD completo de canchas deportivas
- **Sistema de Reservas**: Reserva de turnos con selección de fecha y horario
- **Gestión de Pagos**: Registro y seguimiento de pagos
- **Panel de Administración**: Dashboard con estadísticas en tiempo real
- **Reportes de Bugs**: Sistema integrado para reportar problemas
- **Auditoría**: Registro de todas las acciones importantes
- **Paginación**: Manejo eficiente de grandes volúmenes de datos
- **Responsive**: Diseño adaptable a dispositivos móviles

## 🛠️ Tecnologías

### Backend
- PHP 8.2+
- Laravel 12
- MySQL
- Laravel Sanctum (Autenticación API)
- Laravel Auditing (Logs)

### Frontend
- React 18
- Vite
- React Router DOM
- Axios
- CSS3

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **PHP** >= 8.2
- **Composer** (Gestor de dependencias de PHP)
- **Node.js** >= 18.x y npm
- **MySQL** >= 8.0
- **XAMPP** o servidor web con Apache y MySQL

## 🚀 Instalación y Despliegue

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Sstefano7/Taller-Integracion.git
cd Taller-Integracion
```

### 2. Configuración del Backend (Laravel)

#### 2.1. Instalar dependencias
```bash
cd proyecto
composer install
```

#### 2.2. Configurar variables de entorno

Copia el archivo de ejemplo y configúralo:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos:
```env
APP_NAME="Gestión de Turnos"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=turnos_canchas
DB_USERNAME=root
DB_PASSWORD=

ADMIN_EMAIL=tu-email@gmail.com
```

#### 2.3. Generar key de aplicación
```bash
php artisan key:generate
```

#### 2.4. Crear base de datos

Abre MySQL desde XAMPP o línea de comandos:
```sql
CREATE DATABASE turnos_canchas;
```

#### 2.5. Ejecutar migraciones y seeders
```bash
php artisan migrate --seed
```

Esto creará:
- 4 canchas de ejemplo (2 de fútbol 5 y 2 de pádel)
- Horarios automáticos de 8:00 AM a 11:00 PM
- 3 clientes de prueba
- 1 usuario administrador

**Credenciales del Admin:**
- Email: `admin@canchas.com`
- Password: `password123`

#### 2.6. Iniciar servidor de desarrollo
```bash
php artisan serve
```

El backend estará disponible en: `http://localhost:8000`

---

### 3. Configuración del Frontend (React)

#### 3.1. Instalar dependencias

Abre una **nueva terminal** y ejecuta:
```bash
cd turnos-canchas-frontend
npm install
```

#### 3.2. Iniciar servidor de desarrollo
```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## 🎯 Uso del Sistema

### Acceso Público

1. Abre `http://localhost:5173`
2. Puedes ver las canchas disponibles sin autenticación
3. Para hacer una reserva, debes iniciar sesión

### Registro de Usuario

1. Haz clic en "Iniciar Sesión"
2. Luego en "Regístrate"
3. Completa el formulario
4. Una vez registrado, podrás hacer reservas

### Panel de Administración

1. Inicia sesión con las credenciales del admin
2. Verás el botón "Panel Admin" en el header
3. Desde aquí puedes:
   - Ver estadísticas del sistema
   - Gestionar canchas
   - Gestionar turnos/reservas
   - Gestionar clientes
   - Ver reportes de bugs
   - Gestionar pagos

### Hacer una Reserva

1. Inicia sesión como usuario
2. Selecciona una cancha
3. Elige fecha y horario
4. Completa tus datos
5. Confirma la reserva
6. Ve a "Mis Reservas" para ver tus reservas activas

---

## 📁 Estructura del Proyecto
```
proyecto/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/    # Controladores de la API
│   │   └── Middleware/         # Middleware personalizado
│   └── Models/                 # Modelos Eloquent
├── database/
│   ├── migrations/             # Migraciones de BD
│   └── seeders/                # Seeders de datos
├── routes/
│   └── api.php                 # Rutas de la API
└── storage/
    └── logs/                   # Logs del sistema

turnos-canchas-frontend/
├── src/
│   ├── components/             # Componentes reutilizables
│   ├── pages/                  # Páginas principales
│   │   └── admin/              # Páginas de administración
│   ├── services/               # Servicios API
│   ├── context/                # Context API de React
│   └── styles/                 # Archivos CSS
└── public/                     # Archivos estáticos
```

---

## 🔧 Comandos Útiles

### Backend (Laravel)
```bash
# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Ver rutas disponibles
php artisan route:list

# Crear controlador
php artisan make:controller NombreController

# Crear modelo con migración
php artisan make:model NombreModelo -m

# Refrescar base de datos (CUIDADO: borra todo)
php artisan migrate:fresh --seed
```

### Frontend (React)
```bash
# Instalar nueva dependencia
npm install nombre-paquete

# Build para producción
npm run build

# Preview del build
npm run preview
```

---

## 🐛 Solución de Problemas

### Error: "Target class [Controller] does not exist"
```bash
composer dump-autoload
php artisan config:clear
```

### Error: "Access denied for user"

Verifica las credenciales de MySQL en el archivo `.env`

### Error: "npm not recognized"

Asegúrate de tener Node.js instalado y reinicia la terminal

### Error: "CORS policy"

Verifica que `config/cors.php` tenga configurado `http://localhost:5173` en `allowed_origins`

### Puerto 8000 o 5173 ya en uso
```bash
# Laravel en otro puerto
php artisan serve --port=8001

# React en otro puerto
npm run dev -- --port 5174
```

---

## 📧 Configuración de Email (Opcional)

Para recibir reportes de bugs por email, configura en `.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=tu-email@gmail.com
```

**Nota:** Para Gmail, necesitas generar una "Contraseña de Aplicación"

---

## 👥 Usuarios de Prueba

### Administrador
- Email: `admin@canchas.com`
- Password: `password123`

### Clientes (creados con seeder)
- Juan Pérez: `juan.perez@email.com`
- María González: `maria.gonzalez@email.com`
- Carlos Rodríguez: `carlos.rodriguez@email.com`

---

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 👨‍💻 Autor

Stefano Schneider
GitHub: [@Sstefano7](https://github.com/Sstefano7)
---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

Si encuentras algún bug o tienes alguna sugerencia, por favor:
- Usa el sistema de reportes integrado (botón "🐛 Reportar Bug")
- Abre un issue en GitHub
- Contacta a: [tu-email@ejemplo.com]