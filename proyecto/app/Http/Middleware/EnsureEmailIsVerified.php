<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()?->email_verified_at) {
            return response()->json([
                'message' => 'Debés verificar tu email antes de reservar un turno.',
            ], 403);
        }

        return $next($request);
    }
}
