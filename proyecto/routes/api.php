<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CanchaController;
use App\Http\Controllers\Api\TurnoController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PagoController;

// Rutas públicas (sin autenticación)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

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
    
    // Rutas solo para administradores
    Route::middleware('admin')->group(function () {
        // Gestión de canchas
        Route::post('/canchas', [CanchaController::class, 'store']);
        Route::put('/canchas/{id}', [CanchaController::class, 'update']);
        Route::delete('/canchas/{id}', [CanchaController::class, 'destroy']);
        
        // Gestión de turnos (admin puede editar/eliminar cualquier turno)
        Route::put('/turnos/{id}', [TurnoController::class, 'update']);
        Route::delete('/turnos/{id}', [TurnoController::class, 'destroy']);
        
        // Gestión de clientes
        Route::apiResource('clientes', ClienteController::class);
        
        // Gestión de horarios
        Route::apiResource('horarios', HorarioController::class);

        // Gestión de pagos - AGREGAR EN ESTE ORDEN
        Route::get('/pagos/estadisticas', [\App\Http\Controllers\Api\PagoController::class, 'estadisticas']);
        Route::get('/pagos/turno/{turnoId}', [\App\Http\Controllers\Api\PagoController::class, 'porTurno']);
        Route::get('/pagos', [\App\Http\Controllers\Api\PagoController::class, 'index']);
        Route::post('/pagos', [\App\Http\Controllers\Api\PagoController::class, 'store']);
        Route::get('/pagos/{id}', [\App\Http\Controllers\Api\PagoController::class, 'show']);
        Route::put('/pagos/{id}', [\App\Http\Controllers\Api\PagoController::class, 'update']);
        Route::delete('/pagos/{id}', [\App\Http\Controllers\Api\PagoController::class, 'destroy']);
    });
});