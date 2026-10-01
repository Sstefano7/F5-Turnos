<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Cancha;
use App\Models\Turno;
use App\Models\Cliente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_puede_obtener_estadisticas_enriquecidas()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $cancha = Cancha::create([
            'nombre'      => 'Cancha Central Fútbol 5',
            'tipo'        => 'futbol5',
            'precio_hora' => 10000,
            'activa'      => true,
        ]);

        $cliente = Cliente::create([
            'nombre'   => 'Carlos',
            'apellido' => 'Tevez',
            'email'    => 'carlos.tevez@example.com',
            'telefono' => '1122334455',
        ]);

        Turno::create([
            'cancha_id'   => $cancha->id,
            'cliente_id'  => $cliente->id,
            'user_id'     => $admin->id,
            'fecha'       => now()->toDateString(),
            'hora_inicio' => '19:00',
            'hora_fin'    => '20:00',
            'precio'      => 10000,
            'estado'      => 'confirmado',
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'totalCanchas',
                'totalTurnos',
                'totalClientes',
                'turnosPendientes',
                'ingresosMes',
                'ingresosMesAnterior',
                'turnosPorEstado' => [
                    'confirmados',
                    'pendientes',
                    'completados',
                    'cancelados',
                ],
                'turnosPorTipo' => [
                    'futbol5',
                    'padel',
                ],
                'topCanchas',
                'actividad7Dias',
            ]);

        $this->assertEquals(1, $response->json('totalCanchas'));
        $this->assertEquals(1, $response->json('totalTurnos'));
        $this->assertEquals(1, $response->json('turnosPorEstado.confirmados'));
        $this->assertEquals(1, $response->json('turnosPorTipo.futbol5'));
    }
}
