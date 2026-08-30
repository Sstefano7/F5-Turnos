<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Promocode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AuthRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Juan Pérez',
            'email' => 'juan@ejemplo.com',
            'phone' => '11 1234-5678',
            'country_code' => '+54',
            'birth_date' => '1995-05-10',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
            'dni' => '30123456',
            'preferred_sport' => 'futbol5',
            'skill_level' => 'intermedio',
            'preferred_days' => ['lunes', 'miercoles'],
            'preferred_times' => ['noche'],
            'team_name' => 'Los Amigos FC',
            'gender' => 'masculino',
            'newsletter' => true,
            'sms_notifications' => true,
        ], $overrides);
    }

    public function test_registro_completo_exitoso_crea_usuario_cliente_y_promo_de_bienvenida(): void
    {
        $response = $this->postJson('/api/register', $this->validPayload());

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Registro completado correctamente.')
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'user' => [
                    'name', 'email', 'phone', 'country_code', 'birth_date',
                    'dni', 'preferred_sport', 'skill_level', 'preferred_days',
                    'preferred_times', 'team_name', 'gender', 'newsletter', 'sms_notifications',
                ],
                'verification' => ['sent', 'needs_verification', 'token_for_testing'],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'juan@ejemplo.com',
            'preferred_sport' => 'futbol5',
            'team_name' => 'Los Amigos FC',
        ]);

        $user = User::where('email', 'juan@ejemplo.com')->first();
        $this->assertNotNull($user->email_verification_token);
        $this->assertNull($user->email_verified_at);

        // Cliente auto-creado (nombre completo en 'nombre', resto en 'apellido')
        $this->assertDatabaseHas('clientes', [
            'email' => 'juan@ejemplo.com',
            'nombre' => 'Juan',
            'apellido' => 'Pérez',
            'dni' => '30123456',
        ]);

        // Código de bienvenida emitido
        $this->assertDatabaseHas('promocodes', [
            'user_id' => $user->id,
            'discount_type' => 'bienvenida',
            'used' => false,
        ]);
    }

    public function test_registro_duplica_cliente_existente_en_vez_de_crear_otro(): void
    {
        Cliente::create([
            'nombre' => 'Juan',
            'apellido' => 'Pérez',
            'email' => 'juan@ejemplo.com',
            'telefono' => '11 1111-1111',
        ]);

        $this->postJson('/api/register', $this->validPayload())->assertStatus(201);

        $this->assertEquals(1, Cliente::where('email', 'juan@ejemplo.com')->count());
    }

    public function test_registro_valida_nombre_minimo_y_solo_letras(): void
    {
        $this->postJson('/api/register', $this->validPayload(['name' => 'Ju']))->assertStatus(422);
        $this->postJson('/api/register', $this->validPayload(['name' => 'Juan 123']))->assertStatus(422);
    }

    public function test_registro_rechaza_menor_de_18(): void
    {
        $this->postJson('/api/register', $this->validPayload([
            'birth_date' => now()->subYears(17)->toDateString(),
        ]))->assertStatus(422);
    }

    public function test_registro_valida_fortaleza_de_contrasena(): void
    {
        $faltasMayuscula = $this->validPayload(['password' => 'strongpass1!', 'password_confirmation' => 'strongpass1!']);
        $faltasNumero = $this->validPayload(['password' => 'StrongPass!!', 'password_confirmation' => 'StrongPass!!']);
        $faltasSimbolo = $this->validPayload(['password' => 'StrongPass1', 'password_confirmation' => 'StrongPass1']);

        foreach ([$faltasMayuscula, $faltasNumero, $faltasSimbolo] as $payload) {
            $this->postJson('/api/register', $payload)->assertStatus(422);
        }
    }

    public function test_registro_valida_contrasena_corta_y_no_coincidente(): void
    {
        $corta = $this->validPayload(['password' => 'Pass1!', 'password_confirmation' => 'Pass1!']);
        $noCoinciden = $this->validPayload(['password' => 'StrongPass1!', 'password_confirmation' => 'StrongPass2!']);

        $this->postJson('/api/register', $corta)->assertStatus(422);
        $this->postJson('/api/register', $noCoinciden)->assertStatus(422);
    }

    public function test_registro_valida_telefono(): void
    {
        $sinDigitos = $this->validPayload(['phone' => 'abcdef', 'country_code' => '+54']);
        $muyCorto = $this->validPayload(['phone' => '123', 'country_code' => '+54']);

        $this->postJson('/api/register', $sinDigitos)->assertStatus(422);
        $this->postJson('/api/register', $muyCorto)->assertStatus(422);
    }

    public function test_registro_rechaza_email_duplicado(): void
    {
        $this->postJson('/api/register', $this->validPayload())->assertStatus(201);
        $this->postJson('/api/register', $this->validPayload(['phone' => '11 9999-9999']))->assertStatus(422);
    }

    public function test_honeypot_detecta_bots_sin_crear_usuario(): void
    {
        $payload = $this->validPayload(['website' => 'http://bot.example.com']);

        $this->postJson('/api/register', $payload)->assertStatus(201);

        $this->assertDatabaseMissing('users', ['email' => 'juan@ejemplo.com']);
    }

    public function test_aplica_promocode_referido_y_lo_marca_usado(): void
    {
        $promo = Promocode::create([
            'code' => 'REF-ABC123',
            'discount_type' => 'referido',
            'discount_value' => 15,
            'used' => false,
        ]);

        $this->postJson('/api/register', $this->validPayload(['promo_code' => 'REF-ABC123']))
            ->assertStatus(201);

        $promo->refresh();
        $this->assertTrue($promo->used);
        $this->assertNotNull($promo->user_id);
    }

    public function test_rechaza_promocode_invalido_o_usado(): void
    {
        $promo = Promocode::create([
            'code' => 'REF-USED1',
            'discount_type' => 'referido',
            'discount_value' => 15,
            'used' => true,
        ]);

        $this->postJson('/api/register', $this->validPayload(['promo_code' => 'NO-EXISTE']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('promo_code');

        $this->postJson('/api/register', $this->validPayload(['promo_code' => 'REF-USED1']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('promo_code');
    }

    public function test_exige_reto_aritmetico_despues_de_3_intentos_fallidos(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/register', $this->validPayload([
                'email' => "fallo{$i}@ejemplo.com",
                'password' => 'corta',
                'password_confirmation' => 'corta',
            ]))->assertStatus(422);
        }

        $response = $this->postJson('/api/register', $this->validPayload([
            'email' => 'valid@ejemplo.com',
        ]));

        $response->assertStatus(429)
            ->assertJsonPath('challenge_required', true);

        $this->assertArrayHasKey('challenge', $response->json());
        $this->assertArrayHasKey('token', $response->json('challenge'));
        $this->assertArrayHasKey('question', $response->json('challenge'));
    }

    public function test_resolver_reto_permite_registrarse(): void
    {
        // El contador se siembra directo para no agotar el throttle (5/hora) del test
        Cache::put('failed_registrations:127.0.0.1', 3, now()->addHour());

        $blocked = $this->postJson('/api/register', $this->validPayload([
            'email' => 'valid@ejemplo.com',
        ]))->assertStatus(429);

        $challenge = $blocked->json('challenge');
        [$a, $op, $b] = explode(' ', $challenge['question']);
        $answer = match ($op) { '+' => $a + $b, '-' => $a - $b, '*' => $a * $b };

        $this->postJson('/api/register/challenge', [
            'challenge_token' => $challenge['token'],
            'answer' => $answer,
        ])->assertStatus(200)->assertJsonPath('success', true);

        $this->postJson('/api/register', $this->validPayload([
            'email' => 'valid@ejemplo.com',
            'challenge_token' => $challenge['token'],
        ]))->assertStatus(201);

        $this->assertDatabaseHas('users', ['email' => 'valid@ejemplo.com']);
    }

    public function test_respuesta_incorrecta_del_reto_genera_nuevo_reto(): void
    {
        Cache::put('failed_registrations:127.0.0.1', 3, now()->addHour());

        $blocked = $this->postJson('/api/register', $this->validPayload([
            'email' => 'valid@ejemplo.com',
        ]))->assertStatus(429);

        $challenge = $blocked->json('challenge');

        $this->postJson('/api/register/challenge', [
            'challenge_token' => $challenge['token'],
            'answer' => 99999,
        ])->assertStatus(422)->assertJsonPath('success', false);
    }
}