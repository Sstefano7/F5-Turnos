<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;


class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son incorrectas.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);

        
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }


     public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email'
        ], [
            'email.exists' => 'No existe ninguna cuenta con este email.'
        ]);

        // Generar token
        $token = Str::random(64);

        // Eliminar tokens anteriores de este email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Crear nuevo token
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => now()
        ]);

        // Enviar email
        try {
            $user = User::where('email', $request->email)->first();
            
            Mail::raw(
                "Hola {$user->name},\n\n" .
                "Has solicitado restablecer tu contraseña.\n\n" .
                "Usa el siguiente código para restablecer tu contraseña:\n\n" .
                "Código: {$token}\n\n" .
                "Este código expirará en 60 minutos.\n\n" .
                "Si no solicitaste restablecer tu contraseña, ignora este mensaje.\n\n" .
                "Saludos,\n" .
                "El equipo de " . config('app.name'),
                function ($message) use ($request) {
                    $message->to($request->email)
                        ->subject('Restablecer Contraseña - ' . config('app.name'));
                }
            );

            return response()->json([
                'message' => 'Te hemos enviado un código de recuperación a tu email.',
                // Solo en local para facilitar el desarrollo sin email configurado
                'token_for_testing' => app()->environment('local') ? $token : null,
            ]);

        } catch (\Exception $e) {
            Log::error('Error al enviar email de recuperación: ' . $e->getMessage());

            // NUNCA exponer el token en producción, incluso si el email falla
            if (app()->environment('local')) {
                return response()->json([
                    'message' => 'Email no configurado (modo desarrollo). Usa este token directamente.',
                    'token_for_testing' => $token,
                ]);
            }

            return response()->json([
                'message' => 'Hubo un problema al enviar el email. Por favor intenta nuevamente más tarde.'
            ], 500);
        }
    }

    /**
     * Restablecer contraseña con token
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Buscar token
        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$passwordReset) {
            return response()->json([
                'message' => 'Token inválido o expirado.'
            ], 422);
        }

        // Verificar que el token no haya expirado (60 minutos)
        $createdAt = \Carbon\Carbon::parse($passwordReset->created_at);
    
        if ($createdAt->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'El código ha expirado. Por favor solicita uno nuevo.'
            ], 422);
        }

        // Verificar token
        if (!Hash::check($request->token, $passwordReset->token)) {
            return response()->json([
                'message' => 'El código es incorrecto.'
            ], 422);
        }

        // Actualizar contraseña
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Eliminar token usado
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Tu contraseña ha sido restablecida exitosamente.'
        ]);
    }
    
}