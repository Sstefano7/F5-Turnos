<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CanchaController;
use App\Http\Controllers\Api\TurnoController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\Api\BugReportController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\BackupScheduleController;
use App\Http\Controllers\Api\ProfileController;

// Rutas públicas (sin autenticación)

// Registro: máximo 8 registros por hora por IP (evitar creación masiva de cuentas).
// Prefijo 'register': cada ruta throttle usa su propio key (Laravel los comparte por IP si no se distinguen).
Route::middleware('throttle:8,60,register')->post('/register', [AuthController::class, 'register']);

// Verificación de email desde el link del correo
Route::get('/verify-email/{token}', [AuthController::class, 'verifyEmail']);

// Captcha invisible auto-contenido (reto aritmético tras 3 intentos fallidos)
Route::middleware('throttle:20,1,challenge')->post('/register/challenge', [AuthController::class, 'solveChallenge']);

// Validación de código promocional (botón "Aplicar")
Route::middleware('throttle:10,1,promo')->post('/promo/validate', [AuthController::class, 'validatePromo']);

// Login y recuperación: máximo 5 intentos por minuto (protección brute-force y spam)
Route::middleware('throttle:5,1,login')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
});

// Reset password: máximo 10 intentos por minuto
Route::middleware('throttle:10,1,reset')->post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('throttle:5,1,bug')->post('/bug-reports', [BugReportController::class, 'store']); // Cualquiera puede reportar bugs (máx 5/min)
Route::get('/canchas', [CanchaController::class, 'index']);
Route::get('/canchas/{id}', [CanchaController::class, 'show']);
Route::get('/canchas/{id}/horarios-disponibles', [HorarioController::class, 'disponibles']);

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    
    // Autenticación
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']);
    
    // Gestión de turnos (usuarios normales)
    Route::get('/turnos', [TurnoController::class, 'index']);
    Route::post('/turnos', [TurnoController::class, 'store']);
    Route::get('/turnos/{id}', [TurnoController::class, 'show']);
    Route::get('/mis-turnos', [TurnoController::class, 'misTurnos']);
    Route::patch('/turnos/{id}/cancelar', [TurnoController::class, 'cancelar']);
    
    // --- RUTAS DE ADMINISTRADOR NORMAL ---
    Route::middleware('admin')->group(function () {

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        
        // Gestión de canchas (usar ?per_page= para paginación en index)
        Route::post('/canchas', [CanchaController::class, 'store']);
        Route::put('/canchas/{id}', [CanchaController::class, 'update']);
        Route::delete('/canchas/{id}', [CanchaController::class, 'destroy']);
        
        // Gestión de turnos (admin)
        Route::put('/turnos/{id}', [TurnoController::class, 'update']);
        Route::delete('/turnos/{id}', [TurnoController::class, 'destroy']);
        
        // Gestión de clientes (solo admin — contiene datos personales: DNI, teléfono, email)
        Route::get('/clientes', [ClienteController::class, 'index']);
        Route::post('/clientes', [ClienteController::class, 'store']);
        Route::get('/clientes/{id}', [ClienteController::class, 'show']);
        Route::put('/clientes/{id}', [ClienteController::class, 'update']);
        Route::delete('/clientes/{id}', [ClienteController::class, 'destroy']);
        
        // Gestión de horarios
        Route::apiResource('horarios', HorarioController::class);
    });

    // --- RUTAS EXCLUSIVAS DE SUPER ADMIN ---
    Route::middleware('superadmin')->group(function () {
        
        // Exportaciones a PDF (SOLO SUPERADMIN)
        Route::get('/bug-reports/export-pdf', [BugReportController::class, 'exportPdf']);
        Route::get('/logs/export-pdf', [LogController::class, 'exportLogsPdf']);
        Route::get('/audits/export-pdf', [AuditController::class, 'exportPdf']);
        
        // Gestión de reportes de bugs (SOLO SUPERADMIN)
        Route::get('/bug-reports', [BugReportController::class, 'index']);
        Route::get('/bug-reports/{id}', [BugReportController::class, 'show']);
        Route::put('/bug-reports/{id}', [BugReportController::class, 'update']);
        Route::delete('/bug-reports/{id}', [BugReportController::class, 'destroy']);
        
        // Auditoría y Logs (SOLO SUPERADMIN)
        Route::get('/audits', [AuditController::class, 'index']);
        Route::get('/audits/{id}', [AuditController::class, 'show']);
        Route::get('/logs', [LogController::class, 'index']);
        Route::delete('/logs/{id}', [LogController::class, 'destroy']);
        
        // Gestión de usuarios (SOLO SUPERADMIN)
        Route::get('/users', [AuthController::class, 'getAllUsers']);
        Route::put('/users/{id}/role', [AuthController::class, 'updateUserRole']);
        Route::delete('/users/{id}', [AuthController::class, 'deleteUser']);
        
        /// Backups (SOLO SUPERADMIN)
        Route::get('/backups', [\App\Http\Controllers\Api\BackupController::class, 'index']);
        Route::post('/backups/create', [\App\Http\Controllers\Api\BackupController::class, 'create']);
        Route::get('/backups/download/{filename}', [\App\Http\Controllers\Api\BackupController::class, 'download']);
        Route::get('/backups/schedule', [BackupScheduleController::class, 'index']);
        Route::post('/backups/schedule', [BackupScheduleController::class, 'store']);
        Route::put('/backups/schedule/{id}', [BackupScheduleController::class, 'update']);
        Route::delete('/backups/schedule/{id}', [BackupScheduleController::class, 'destroy']);
    });
});