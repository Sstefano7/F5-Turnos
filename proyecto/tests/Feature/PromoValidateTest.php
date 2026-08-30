<?php

namespace Tests\Feature;

use App\Models\Promocode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromoValidateTest extends TestCase
{
    use RefreshDatabase;

    public function test_valida_codigo_promocional_vigente(): void
    {
        Promocode::create([
            'code' => 'BIENVENIDA-ABC123',
            'discount_type' => 'bienvenida',
            'discount_value' => 10,
            'used' => false,
            'expires_at' => now()->addMonth(),
        ]);

        $this->postJson('/api/promo/validate', ['code' => 'BIENVENIDA-ABC123'])
            ->assertOk()
            ->assertJsonPath('valid', true);
    }

    public function test_rechaza_codigo_inexistente_o_usado(): void
    {
        $this->postJson('/api/promo/validate', ['code' => 'NO-EXISTE'])
            ->assertOk()
            ->assertJsonPath('valid', false);

        Promocode::create([
            'code' => 'BIENVENIDA-USADO',
            'discount_type' => 'bienvenida',
            'used' => true,
        ]);

        $this->postJson('/api/promo/validate', ['code' => 'BIENVENIDA-USADO'])
            ->assertOk()
            ->assertJsonPath('valid', false);
    }

    public function test_normaliza_codigo_a_mayusculas(): void
    {
        Promocode::create([
            'code' => 'BIENVENIDA-ABC123',
            'discount_type' => 'bienvenida',
            'used' => false,
        ]);

        $this->postJson('/api/promo/validate', ['code' => ' bienvenida-abc123 '])
            ->assertOk()
            ->assertJsonPath('valid', true);
    }
}