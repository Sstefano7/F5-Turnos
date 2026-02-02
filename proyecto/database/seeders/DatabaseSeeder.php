<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Crear usuario administrador
        User::create([
            'name' => 'Administrador',
            'email' => 'admin@canchas.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        // Llamar a los otros seeders
        $this->call([
            CanchaSeeder::class,
            HorarioSeeder::class,
            ClienteSeeder::class,
        ]);
    }
}