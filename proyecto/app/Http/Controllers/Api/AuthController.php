<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\VerificationMail;
use App\Mail\WelcomeMail;
use App\Models\Cliente;
use App\Models\Promocode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function failedAttemptsKey(): string
    {
        return 'failed_registrations:' . request()->ip();
    }

    private function challengeKey(string $token): string
    {
        return 'register_challenge:' . $token;
    }

    private function challengeSolvedKey(string $token): string
    {
        return 'register_challenge_solved:' . $token;
    }

    /**
     * Registro completo con todas las secciones del formulario.
     */
    public function register(Request $request)
    {
        // Honeypot: si un bot llena el campo oculto, simulamos éxito sin crear nada.
        if ($request->filled('website')) {
            return response()->json([
                'message' => 'Registro completado correctamente.',
                'access_token' => 'spam',
                'token_type' => 'Bearer',
                'user' => [],
                'verification' => ['sent' => false],
            ], 201);
        }

        $ip = $request->ip();
        $failed = (int) Cache::get($this->failedAttemptsKey(), 0);

        // Captcha invisible: después de 3 intentos fallidos es obligatorio resolver el reto.
        if ($failed >= 3) {
            $challengeToken = $request->input('challenge_token');
            if (!$challengeToken || !Cache::get($this->challengeSolvedKey($challengeToken))) {
                $challenge = $this->createChallenge();
                return response()->json([
                    'message' => 'Demasiados intentos fallidos. Resolve la verificación para continuar.',
                    'challenge_required' => true,
                    'challenge' => $challenge,
                ], 429);
            }
        }

        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'min:3', 'max:120', 'regex:/^[\p{L}\s]+$/u'],
                'email' => 'required|string|email|max:255|unique:users',
                'phone' => 'required|string|max:20',
                'country_code' => 'required|string|max:6',
                'birth_date' => 'required|date|before:today-18years|after:1900-01-01',
                'password' => [
                    'required', 'string', 'min:8', 'confirmed',
                    'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[^A-Za-z0-9]/',
                ],
                'dni' => 'nullable|string|regex:/^\d{6,11}$/',
                'preferred_sport' => 'required|in:futbol5,padel,ambos',
                'skill_level' => 'nullable|in:principiante,intermedio,avanzado,competitivo',
                'gender' => 'nullable|in:masculino,femenino,otro,prefiero-no-decir',
                'preferred_days' => 'nullable|array|max:7',
                'preferred_days.*' => 'in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
                'preferred_times' => 'nullable|array|max:3',
                'preferred_times.*' => 'in:mañana,tarde,noche',
                'team_name' => 'nullable|string|max:120',
                'promo_code' => 'nullable|string|regex:/^[A-Z0-9-]{4,20}$/i',
                'newsletter' => 'sometimes|boolean',
                'sms_notifications' => 'sometimes|boolean',
            ]);
        } catch (ValidationException $e) {
            // Incrementar el contador de intentos fallidos (para el captcha invisible)
            Cache::put($this->failedAttemptsKey(), $failed + 1, now()->addHour());
            throw $e;
        }

        // Validación de teléfono: dígitos combinados (prefijo + número) entre 9 y 15.
        $phoneDigits = preg_replace('/\D/', '', $validated['phone']);
        $codeDigits = preg_replace('/\D/', '', $validated['country_code']);
        if (!$phoneDigits || strlen($codeDigits . $phoneDigits) < 9 || strlen($codeDigits . $phoneDigits) > 15) {
            Cache::put($this->failedAttemptsKey(), $failed + 1, now()->addHour());
            throw ValidationException::withMessages([
                'phone' => ['El teléfono no es válido para el país seleccionado.'],
            ]);
        }

        // Validar código promocional si fue enviado.
        $promocode = null;
        if (!empty($validated['promo_code'])) {
            $promocode = Promocode::where('code', Str::upper($validated['promo_code']))
                ->where('used', false)
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->first();

            if (!$promocode) {
                Cache::put($this->failedAttemptsKey(), $failed + 1, now()->addHour());
                throw ValidationException::withMessages([
                    'promo_code' => ['El código promocional no es válido o ya fue utilizado.'],
                ]);
            }
        }

        // Crear usuario (marca email_verified_at queda null hasta verificar)
        $verificationToken = Str::random(64);
        $user = User::create([
            'name' => trim($validated['name']),
            'email' => $validated['email'],
            'password' => $validated['password'],
            'phone' => trim($validated['phone']),
            'country_code' => trim($validated['country_code']),
            'birth_date' => $validated['birth_date'],
            'dni' => $validated['dni'] ?? null,
            'preferred_sport' => $validated['preferred_sport'],
            'skill_level' => $validated['skill_level'] ?? null,
            'preferred_days' => $validated['preferred_days'] ?? null,
            'preferred_times' => $validated['preferred_times'] ?? null,
            'team_name' => $validated['team_name'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'newsletter' => $request->boolean('newsletter'),
            'sms_notifications' => $request->boolean('sms_notifications'),
            'email_verification_token' => $verificationToken,
        ]);

        // Auto-crear Cliente para que las reservas vinculen automáticamente.
        $this->syncCliente($user, $validated);

        // Aplicar / generar códigos promocionales.
        if ($promocode) {
            $promocode->update(['used' => true, 'user_id' => $user->id]);
        }
        $welcomeCode = $this->issueWelcomeCode($user);

        // Enviar emails (verificación + bienvenida). En local sin mail configurado
        // el token se devuelve para testing (mismo patrón que forgotPassword).
        $sent = $this->sendVerificationEmail($user);
        $this->sendWelcomeEmail($user, $welcomeCode);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registro completado correctamente.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
            'verification' => [
                'sent' => $sent,
                'needs_verification' => !$user->email_verified_at,
                'token_for_testing' => (app()->environment('local') && !$sent) ? $verificationToken : null,
            ],
        ], 201);
    }

    /**
     * Crear o actualizar el Cliente vinculado al usuario registrado.
     */
    private function syncCliente(User $user, array $validated): void
    {
        $parts = preg_split('/\s+/', trim($validated['name']), 2);
        $nombre = $parts[0] ?? '';
        $apellido = $parts[1] ?? '';

        $cliente = Cliente::where('email', $user->email)->first();

        if ($cliente) {
            $cliente->update([
                'telefono' => trim($validated['phone']),
                'dni' => $validated['dni'] ?? $cliente->dni,
            ]);
            return;
        }

        Cliente::create([
            'nombre' => $nombre,
            'apellido' => $apellido,
            'email' => $user->email,
            'telefono' => trim($validated['phone']),
            'dni' => $validated['dni'] ?? null,
        ]);
    }

    private function issueWelcomeCode(User $user): string
    {
        $code = 'BIENVENIDA-' . strtoupper(Str::random(6));
        Promocode::create([
            'code' => $code,
            'user_id' => $user->id,
            'discount_type' => 'bienvenida',
            'discount_value' => 10,
            'used' => false,
            'expires_at' => now()->addMonths(3),
        ]);
        return $code;
    }

    private function sendVerificationEmail(User $user): bool
    {
        try {
            Mail::to($user->email)->send(new VerificationMail($user->name, $user->email_verification_token));
            return true;
        } catch (\Exception $e) {
            Log::error('Error al enviar email de verificación: ' . $e->getMessage());
            return false;
        }
    }

    private function sendWelcomeEmail(User $user, string $welcomeCode): bool
    {
        try {
            Mail::to($user->email)->send(new WelcomeMail($user->name, $welcomeCode));
            return true;
        } catch (\Exception $e) {
            Log::error('Error al enviar email de bienvenida: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Verificar email con token (llega desde el link del correo).
     */
    public function verifyEmail($token)
    {
        $user = User::where('email_verification_token', $token)->first();

        if (!$user) {
            return response()->json([
                'message' => 'El enlace de verificación es inválido o ya fue utilizado.',
            ], 422);
        }

        $user->email_verified_at = now();
        $user->email_verification_token = null;
        $user->save();

        return response()->json([
            'message' => 'Email verificado correctamente.',
            'user' => $user,
        ]);
    }

    /**
     * Reenviar email de verificación (usuario autenticado).
     */
    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Tu email ya está verificado.',
            ]);
        }

        $user->email_verification_token = Str::random(64);
        $user->save();

        $sent = $this->sendVerificationEmail($user);

        return response()->json([
            'message' => $sent
                ? 'Te enviamos un nuevo link de verificación a tu email.'
                : 'Hubo un problema al enviar el email. Intentá nuevamente más tarde.',
            'token_for_testing' => $sent ? null : $user->email_verification_token,
        ], $sent ? 200 : 500);
    }

    /**
     * Validar código promocional desde el botón "Aplicar".
     */
    public function validatePromo(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:20',
        ]);

        $code = Str::upper(trim($request->code));
        $promocode = Promocode::where('code', $code)
            ->where('used', false)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        if (!$promocode) {
            return response()->json([
                'valid' => false,
                'message' => 'El código no es válido o ya fue utilizado.',
            ], 200);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Código aplicado correctamente.',
            'code' => $code,
        ], 200);
    }

    /**
     * Generar un reto aritmético simple (captcha invisible auto-contenido).
     */
    public function createChallenge(): array
    {
        $a = random_int(2, 9);
        $b = random_int(2, 9);
        $ops = ['+', '-', '*'];
        $op = $ops[array_rand($ops)];

        $answer = match ($op) {
            '+' => $a + $b,
            '-' => $a - $b,
            '*' => $a * $b,
        };

        $token = Str::random(32);
        Cache::put($this->challengeKey($token), Hash::make((string) $answer), now()->addMinutes(10));

        return [
            'token' => $token,
            'question' => "{$a} {$op} {$b}",
        ];
    }

    /**
     * Resolver el reto de verificación (lo llama el frontend).
     */
    public function solveChallenge(Request $request)
    {
        $request->validate([
            'challenge_token' => 'required|string',
            'answer' => 'required|numeric',
        ]);

        $key = $this->challengeKey($request->challenge_token);
        $hash = Cache::get($key);

        if (!$hash || !Hash::check((string) $request->answer, $hash)) {
            $challenge = $this->createChallenge();
            return response()->json([
                'success' => false,
                'message' => 'Respuesta incorrecta. Probá de nuevo.',
                'challenge' => $challenge,
            ], 422);
        }

        Cache::put($this->challengeSolvedKey($request->challenge_token), true, now()->addMinutes(10));
        Cache::forget($key);

        return response()->json([
            'success' => true,
            'message' => 'Verificación correcta. Ya podés completar el registro.',
            'challenge_token' => $request->challenge_token,
        ]);
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