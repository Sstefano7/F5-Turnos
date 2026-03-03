<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PagoController;
use App\Http\Controllers\Api\CanchaController;
use App\Http\Controllers\Api\TurnoController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\AuthController;


// Rutas públicas (sin autenticación)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Ruta pública para reportar bugs (cualquiera puede reportar)
Route::post('/bug-reports', [\App\Http\Controllers\Api\BugReportController::class, 'store']);

// Consultar canchas y horarios disponibles (público)
Route::get('/canchas', [CanchaController::class, 'index']);
Route::get('/canchas/{id}', [CanchaController::class, 'show']);
Route::get('/canchas/{id}/horarios-disponibles', [HorarioController::class, 'disponibles']);

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    
    // Autenticación
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Gestión de turnos (accesible para usuarios autenticados)
    Route::get('/turnos', [TurnoController::class, 'index']);
    Route::post('/turnos', [TurnoController::class, 'store']);
    Route::get('/turnos/{id}', [TurnoController::class, 'show']);
    Route::get('/mis-turnos', [TurnoController::class, 'misTurnos']);
    Route::patch('/turnos/{id}/cancelar', [TurnoController::class, 'cancelar']);
    
    // Gestión de clientes (usuarios autenticados pueden ver, crear y consultar)
    Route::get('/clientes', [ClienteController::class, 'index']);
    Route::post('/clientes', [ClienteController::class, 'store']);
    Route::get('/clientes/{id}', [ClienteController::class, 'show']);
    
    // Rutas solo para administradores
    Route::middleware('admin')->group(function () {

        Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats']);
        
        Route::get('/audits', [\App\Http\Controllers\Api\AuditController::class, 'index']);
        Route::get('/audits/{id}', [\App\Http\Controllers\Api\AuditController::class, 'show']);

        // Gestión de canchas
        Route::get('/canchas/paginated', [CanchaController::class, 'indexPaginated']);
        Route::post('/canchas', [CanchaController::class, 'store']);
        Route::put('/canchas/{id}', [CanchaController::class, 'update']);
        Route::delete('/canchas/{id}', [CanchaController::class, 'destroy']);
        
        // Gestión de turnos (admin puede editar/eliminar cualquier turno)
        Route::put('/turnos/{id}', [TurnoController::class, 'update']);
        Route::delete('/turnos/{id}', [TurnoController::class, 'destroy']);
        
        // Gestión de clientes (admin puede editar y eliminar)
        Route::put('/clientes/{id}', [ClienteController::class, 'update']);
        Route::delete('/clientes/{id}', [ClienteController::class, 'destroy']);
        
        // Gestión de horarios
        Route::apiResource('horarios', HorarioController::class);

        // Gestión de pagos
        Route::get('/pagos/estadisticas', [\App\Http\Controllers\Api\PagoController::class, 'estadisticas']);
        Route::get('/pagos/turno/{turnoId}', [\App\Http\Controllers\Api\PagoController::class, 'porTurno']);
        Route::get('/pagos', [\App\Http\Controllers\Api\PagoController::class, 'index']);
        Route::post('/pagos', [\App\Http\Controllers\Api\PagoController::class, 'store']);
        Route::get('/pagos/{id}', [\App\Http\Controllers\Api\PagoController::class, 'show']);
        Route::put('/pagos/{id}', [\App\Http\Controllers\Api\PagoController::class, 'update']);
        Route::delete('/pagos/{id}', [\App\Http\Controllers\Api\PagoController::class, 'destroy']);

         // Gestión de reportes de bugs (admin)
        Route::get('/bug-reports', [\App\Http\Controllers\Api\BugReportController::class, 'index']);
        Route::get('/bug-reports/export-pdf', [\App\Http\Controllers\Api\BugReportController::class, 'exportPdf']);
        Route::get('/bug-reports/{id}', [\App\Http\Controllers\Api\BugReportController::class, 'show']);
        Route::put('/bug-reports/{id}', [\App\Http\Controllers\Api\BugReportController::class, 'update']);
        Route::delete('/bug-reports/{id}', [\App\Http\Controllers\Api\BugReportController::class, 'destroy']);
        
        // Auditoría
        Route::get('/audits', [\App\Http\Controllers\Api\AuditController::class, 'index']);
        Route::get('/audits/{id}', [\App\Http\Controllers\Api\AuditController::class, 'show']);
    });
});