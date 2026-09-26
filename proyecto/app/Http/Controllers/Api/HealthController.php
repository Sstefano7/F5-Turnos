<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /**
     * Health check para el smoke test del deploy.
     * Devuelve el SHA del commit desplegado (Vercel lo inyecta en build/runtime)
     * para que el workflow pueda verificar que la API corre el código recién
     * pusheado y no un deploy anterior.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'sha' => config('app.sha'),
            'time' => now()->toIso8601String(),
        ]);
    }
}
