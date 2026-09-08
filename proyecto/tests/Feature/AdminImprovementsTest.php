<?php

namespace Tests\Feature;

use App\Models\BugReport;
use App\Models\Cancha;
use App\Models\Cliente;
use App\Models\Pago;
use App\Models\Turno;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminImprovementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_puede_listar_usuarios()
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);
        $user1 = User::factory()->create(['name' => 'Carlos Perez', 'email' => 'carlos@test.com', 'role' => 'user']);
        $user2 = User::factory()->create(['name' => 'Maria Lopez', 'email' => 'maria@test.com', 'role' => 'admin']);

        Sanctum::actingAs($superadmin);

        $response = $this->getJson('/api/users');
        $response->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'total']);

        // Búsqueda por nombre
        $searchResponse = $this->getJson('/api/users?search=Carlos');
        $searchResponse->assertOk();
        $this->assertCount(1, $searchResponse->json('data'));
        $this->assertEquals('carlos@test.com', $searchResponse->json('data.0.email'));
    }

    public function test_no_se_puede_degradar_al_ultimo_superadmin()
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        Sanctum::actingAs($superadmin);

        // Intento de auto-degradación
        $response = $this->putJson("/api/users/{$superadmin->id}/role", [
            'role' => 'admin',
        ]);
        $response->assertStatus(403);

        // Crear un segundo superadmin que intente degradar al primero
        $superadmin2 = User::factory()->create(['role' => 'superadmin']);
        Sanctum::actingAs($superadmin2);

        // Si degradamos a superadmin1, como superadmin2 sigue siendo superadmin, debe funcionar
        $okResponse = $this->putJson("/api/users/{$superadmin->id}/role", [
            'role' => 'admin',
        ]);
        $okResponse->assertOk();

        // Ahora solo superadmin2 es superadmin. Intentar auto-degradarse desde superadmin2 debe fallar
        $failResponse = $this->putJson("/api/users/{$superadmin2->id}/role", [
            'role' => 'user',
        ]);
        $failResponse->assertStatus(403);
    }

    public function test_no_se_puede_eliminar_a_si_mismo_ni_al_ultimo_superadmin()
    {
        $superadmin = User::factory()->create(['role' => 'superadmin']);

        Sanctum::actingAs($superadmin);

        // Auto-eliminación
        $selfDelete = $this->deleteJson("/api/users/{$superadmin->id}");
        $selfDelete->assertStatus(403);

        // Crear otro superadmin
        $superadmin2 = User::factory()->create(['role' => 'superadmin']);
        Sanctum::actingAs($superadmin2);

        // Eliminar superadmin1 cuando hay más de 1 superadmin -> OK
        $deleteOk = $this->deleteJson("/api/users/{$superadmin->id}");
        $deleteOk->assertOk();

        // Ahora solo queda superadmin2. Un admin normal no tiene acceso a /api/users
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $forbiddenDelete = $this->deleteJson("/api/users/{$superadmin2->id}");
        $forbiddenDelete->assertStatus(403);
    }

    public function test_busqueda_cross_database_en_clientes_y_pagos()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $cliente = Cliente::create([
            'nombre'   => 'Agustin',
            'apellido' => 'Gomez',
            'dni'      => '35123456',
            'email'    => 'agustin@example.com',
            'telefono' => '1122334455',
        ]);

        $cancha = Cancha::create([
            'nombre'      => 'Cancha Padel Central',
            'tipo'        => 'padel',
            'precio_hora' => 5000,
            'activa'      => true,
        ]);

        $turno = Turno::create([
            'cancha_id'   => $cancha->id,
            'cliente_id'  => $cliente->id,
            'user_id'     => $admin->id,
            'fecha'       => now()->addDay()->toDateString(),
            'hora_inicio' => '18:00',
            'hora_fin'    => '19:00',
            'precio'      => 5000,
            'estado'      => 'confirmado',
        ]);

        $pago = Pago::create([
            'turno_id'    => $turno->id,
            'monto'       => 5000,
            'estado'      => 'pagado',
            'metodo_pago' => 'transferencia',
            'referencia'  => 'TRF-998877',
        ]);

        // Búsqueda en clientes
        $resCliente = $this->getJson('/api/clientes?search=Agustin');
        $resCliente->assertOk();
        $this->assertNotEmpty($resCliente->json('data'));

        // Búsqueda en pagos
        $resPago = $this->getJson('/api/pagos?search=TRF-998877');
        $resPago->assertOk();
        $this->assertNotEmpty($resPago->json('data'));
    }

    public function test_papelera_y_restauracion_de_turnos()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $cliente = Cliente::create([
            'nombre'   => 'Roberto',
            'apellido' => 'Diaz',
            'email'    => 'roberto@example.com',
            'telefono' => '1155667788',
        ]);

        $cancha = Cancha::create([
            'nombre'      => 'Cancha Futbol 1',
            'tipo'        => 'futbol5',
            'precio_hora' => 8000,
            'activa'      => true,
        ]);

        $turno1 = Turno::create([
            'cancha_id'   => $cancha->id,
            'cliente_id'  => $cliente->id,
            'user_id'     => $admin->id,
            'fecha'       => now()->addDays(2)->toDateString(),
            'hora_inicio' => '20:00',
            'hora_fin'    => '21:00',
            'precio'      => 8000,
            'estado'      => 'confirmado',
        ]);

        // Eliminar turno (soft delete)
        $delResponse = $this->deleteJson("/api/turnos/{$turno1->id}");
        $delResponse->assertOk();
        $this->assertSoftDeleted('turnos', ['id' => $turno1->id]);

        // Consultar con filtro de eliminados
        $listTrashed = $this->getJson('/api/turnos?solo_eliminados=1');
        $listTrashed->assertOk();
        $this->assertCount(1, $listTrashed->json('data'));

        // Restaurar turno
        $restoreResponse = $this->patchJson("/api/turnos/{$turno1->id}/restore");
        $restoreResponse->assertOk();
        $this->assertNotSoftDeleted('turnos', ['id' => $turno1->id]);

        // Verificar bloqueo si se intenta restaurar con colisión de horario
        $turno1->delete();

        // Creamos otro turno activo en el mismo horario
        Turno::create([
            'cancha_id'   => $cancha->id,
            'cliente_id'  => $cliente->id,
            'user_id'     => $admin->id,
            'fecha'       => $turno1->fecha->toDateString(),
            'hora_inicio' => '20:00',
            'hora_fin'    => '21:00',
            'precio'      => 8000,
            'estado'      => 'confirmado',
        ]);

        // Intentar restaurar el turno1 colisionado debe fallar con 422
        $colisionResponse = $this->patchJson("/api/turnos/{$turno1->id}/restore");
        $colisionResponse->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'No se puede restaurar el turno porque el horario ya fue reservado por otro cliente.'
            ]);
    }
}
