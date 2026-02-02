<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cliente;

class ClienteSeeder extends Seeder
{
    public function run(): void
    {
        $clientes = [
            [
                'nombre' => 'Juan',
                'apellido' => 'Pérez',
                'email' => 'juan.perez@email.com',
                'telefono' => '1234567890',
                'dni' => '12345678',
            ],
            [
                'nombre' => 'María',
                'apellido' => 'González',
                'email' => 'maria.gonzalez@email.com',
                'telefono' => '0987654321',
                'dni' => '87654321',
            ],
            [
                'nombre' => 'Carlos',
                'apellido' => 'Rodríguez',
                'email' => 'carlos.rodriguez@email.com',
                'telefono' => '1122334455',
                'dni' => '11223344',
            ],
        ];

        foreach ($clientes as $cliente) {
            Cliente::create($cliente);
        }
    }
}