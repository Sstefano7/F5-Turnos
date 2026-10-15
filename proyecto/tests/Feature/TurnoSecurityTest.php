<?php

namespace Tests\Feature;

use App\Models\Cancha;
use App\Models\Cliente;
use App\Models\Horario;
use App\Models\Turno;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TurnoSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function canchaConHorario(array $overrides = []): Cancha
    {
        $cancha = Cancha::create(array_merge([
            'nombre' => 'Cancha Central',
            'tipo' => 'futbol5',
            'precio_hora' => 10000,
            'activa' => true,
        ], $overrides));

        $dias = [0 => 'domingo', 1 => 'lunes', 2 => 'martes', 3 => 'miercoles', 4 => 'jueves', 5 => 'viernes', 6 => 'sabado'];
        Horario::create([
            'cancha_id' => $cancha->id,
            'dia_semana' => $dias[now()->addDay()->dayOfWeek],
            'hora_inicio' => '18:00',
            'hora_fin' => '19:00',
            'disponible' => true,
        ]);

        return $cancha;
    }

    private function payload(Cancha $cancha): array
    {
        return [
            'cancha_id' => $cancha->id,
            'cliente' => [
                'nombre' => 'Nombre enviado',
                'apellido' => 'Apellido enviado',
                'email' => 'otro@example.com',
                'telefono' => '111111111',
                'dni' => '30111222',
            ],
            'fecha' => now()->addDay()->toDateString(),
            'hora_inicio' => '18:00',
            'hora_fin' => '19:00',
        ];
    }

    public function test_usuario_solo_reserva_para_su_cliente_y_no_recibe_pii(): void
    {
        $user = User::factory()->create();
        $clientePropio = Cliente::create([
            'user_id' => $user->id,
            'nombre' => 'Cliente',
            'apellido' => 'Propio',
            'email' => $user->email,
            'telefono' => '1100000000',
            'dni' => '30111111',
        ]);
        $clienteAjeno = Cliente::create([
            'nombre' => 'Cliente',
            'apellido' => 'Ajeno',
            'email' => 'ajeno@example.com',
            'telefono' => '1199999999',
            'dni' => '30999999',
        ]);
        $cancha = $this->canchaConHorario();

        Sanctum::actingAs($user);
        $response = $this->postJson('/api/turnos', $this->payload($cancha));

        $response->assertCreated()
            ->assertJsonPath('turno.cliente.id', $clientePropio->id)
            ->assertJsonMissingPath('turno.cliente.email')
            ->assertJsonMissingPath('turno.cliente.telefono')
            ->assertJsonMissingPath('turno.cliente.dni');
        $this->assertDatabaseHas('turnos', ['cliente_id' => $clientePropio->id]);
        $this->assertDatabaseMissing('turnos', ['cliente_id' => $clienteAjeno->id]);
    }

    public function test_email_sin_verificar_no_puede_reservar(): void
    {
        $user = User::factory()->unverified()->create();
        Cliente::create([
            'user_id' => $user->id,
            'nombre' => 'Cliente',
            'apellido' => 'Sin Verificar',
            'email' => $user->email,
            'telefono' => '1100000000',
        ]);
        $cancha = $this->canchaConHorario();

        Sanctum::actingAs($user);
        $this->postJson('/api/turnos', $this->payload($cancha))
            ->assertForbidden();
    }

    public function test_no_se_puede_reservar_cancha_inactiva_o_fuera_de_horario(): void
    {
        $user = User::factory()->create();
        Cliente::create([
            'user_id' => $user->id,
            'nombre' => 'Cliente',
            'apellido' => 'Propio',
            'email' => $user->email,
            'telefono' => '1100000000',
        ]);
        Sanctum::actingAs($user);

        $inactiva = $this->canchaConHorario(['activa' => false]);
        $this->postJson('/api/turnos', $this->payload($inactiva))->assertStatus(422);

        $cancha = Cancha::create([
            'nombre' => 'Sin horario', 'tipo' => 'padel', 'precio_hora' => 10000, 'activa' => true,
        ]);
        $this->postJson('/api/turnos', $this->payload($cancha))->assertStatus(422);
    }

    public function test_disponibilidad_oculta_horarios_con_solapamiento_parcial(): void
    {
        $cancha = $this->canchaConHorario();
        $cliente = Cliente::create([
            'nombre' => 'Cliente',
            'apellido' => 'Prueba',
            'email' => 'cliente-disponibilidad@example.com',
            'telefono' => '1100000000',
        ]);
        Turno::create([
            'cancha_id' => $cancha->id,
            'cliente_id' => $cliente->id,
            'fecha' => now()->addDay()->toDateString(),
            'hora_inicio' => '18:30',
            'hora_fin' => '19:30',
            'precio' => 10000,
            'estado' => 'confirmado',
        ]);

        $this->getJson('/api/canchas/' . $cancha->id . '/horarios-disponibles?fecha=' . now()->addDay()->toDateString())
            ->assertOk()
            ->assertExactJson([]);
    }
}
