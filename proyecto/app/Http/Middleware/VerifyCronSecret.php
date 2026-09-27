<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege los endpoints /api/cron/* que ejecutan trabajo costoso
 * (dumps completos de la base). Vercel envía `Authorization: Bearer
 * ${CRON_SECRET}` en sus cron jobs cuando la variable está definida.
 *
 * Si no hay CRON_SECRET configurado, la petición se rechaza igual
 * (fail-closed): un endpoint costoso nunca debe quedar abierto.
 */
class VerifyCronSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = config('app.cron_secret');

        if (empty($expected) || !hash_equals((string) $expected, (string) $request->bearerToken())) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        return $next($request);
    }
}
