<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_verifica_email_con_token(): void
    {
        $user = User::create([
            'name' => 'Juan Pérez',
            'email' => 'juan@ejemplo.com',
            'password' => 'StrongPass1!',
            'email_verification_token' => 'token-verificacion-123',
        ]);

        $this->getJson('/api/verify-email/token-verificacion-123')
            ->assertStatus(200)
            ->assertJsonPath('message', 'Email verificado correctamente.');

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->email_verification_token);
    }

    public function test_rechaza_token_invalido(): void
    {
        $this->getJson('/api/verify-email/token-inexistente')
            ->assertStatus(422);
    }

    public function test_no_puede_verificar_el_mismo_token_dos_veces(): void
    {
        User::create([
            'name' => 'Juan Pérez',
            'email' => 'juan@ejemplo.com',
            'password' => 'StrongPass1!',
            'email_verification_token' => 'token-123',
        ]);

        $this->getJson('/api/verify-email/token-123')->assertStatus(200);
        $this->getJson('/api/verify-email/token-123')->assertStatus(422);
    }

    public function test_reenvio_de_verificacion_requiere_autenticacion_y_renueva_token(): void
    {
        $this->postJson('/api/resend-verification')->assertStatus(401);

        $user = User::create([
            'name' => 'Juan Pérez',
            'email' => 'juan@ejemplo.com',
            'password' => 'StrongPass1!',
            'email_verification_token' => 'token-viejo',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/resend-verification')
            ->assertStatus(200);

        $user->refresh();
        $this->assertNotEquals('token-viejo', $user->email_verification_token);
        $this->assertNotNull($user->email_verification_token);
    }

    public function test_reenvio_no_cambia_token_si_email_ya_verificado(): void
    {
        $user = User::create([
            'name' => 'Juan Pérez',
            'email' => 'juan@ejemplo.com',
            'password' => 'StrongPass1!',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/resend-verification')
            ->assertStatus(200)
            ->assertJsonPath('message', 'Tu email ya está verificado.');
    }
}