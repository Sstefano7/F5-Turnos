<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PagoController;
use App\Http\Controllers\Api\CanchaController;
use App\Http\Controllers\Api\TurnoController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\LogController; 
use App\Http\Controllers\Api\BugReportController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\DashboardController;

// Rutas públicas (sin autenticación)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/bug-reports', [BugReportController::class, 'store']); // Cualquiera puede reportar bugs
Route::get('/canchas', [CanchaController::class, 'index']);
Route::get('/canchas/{id}', [CanchaController::class, 'show']);
Route::get('/canchas/{id}/horarios-disponibles', [HorarioController::class, 'disponibles']);

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    
    // Autenticación
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Gestión de turnos (usuarios normales)
    Route::get('/turnos', [TurnoController::class, 'index']);
    Route::post('/turnos', [TurnoController::class, 'store']);
    Route::get('/turnos/{id}', [TurnoController::class, 'show']);
    Route::get('/mis-turnos', [TurnoController::class, 'misTurnos']);
    Route::patch('/turnos/{id}/cancelar', [TurnoController::class, 'cancelar']);
    
    // Gestión de clientes (lectura para usuarios autenticados)
    Route::get('/clientes', [ClienteController::class, 'index']);
    Route::post('/clientes', [ClienteController::class, 'store']);
    Route::get('/clientes/{id}', [ClienteController::class, 'show']);
    
    // --- RUTAS DE ADMINISTRADOR NORMAL ---
    Route::middleware('admin')->group(function () {

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        
        // Gestión de canchas
        Route::get('/canchas/paginated', [CanchaController::class, 'indexPaginated']);
        Route::post('/canchas', [CanchaController::class, 'store']);
        Route::put('/canchas/{id}', [CanchaController::class, 'update']);
        Route::delete('/canchas/{id}', [CanchaController::class, 'destroy']);
        
        // Gestión de turnos
        Route::put('/turnos/{id}', [TurnoController::class, 'update']);
        Route::delete('/turnos/{id}', [TurnoController::class, 'destroy']);
        
        // Gestión de clientes
        Route::put('/clientes/{id}', [ClienteController::class, 'update']);
        Route::delete('/clientes/{id}', [ClienteController::class, 'destroy']);
        
        // Gestión de horarios
        Route::apiResource('horarios', HorarioController::class);

        // Gestión de pagos
        Route::get('/pagos/estadisticas', [PagoController::class, 'estadisticas']);
        Route::get('/pagos/turno/{turnoId}', [PagoController::class, 'porTurno']);
        Route::get('/pagos', [PagoController::class, 'index']);
        Route::post('/pagos', [PagoController::class, 'store']);
        Route::get('/pagos/{id}', [PagoController::class, 'show']);
        Route::put('/pagos/{id}', [PagoController::class, 'update']);
        Route::delete('/pagos/{id}', [PagoController::class, 'destroy']);
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
    });
});