<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Los usuarios administrador solo se crean fuera de producción.
        // En producción deben crearse manualmente con una contraseña fuerte.
        if (!app()->environment('production')) {
            $password = env('SEED_ADMIN_PASSWORD', 'password123');

            User::firstOrCreate(
                ['email' => 'superadmin@canchas.com'],
                [
                    'name' => 'Super Administrador',
                    'password' => bcrypt($password),
                    'role' => 'superadmin',
                ]
            );

            User::firstOrCreate(
                ['email' => 'admin@canchas.com'],
                [
                    'name' => 'Administrador',
                    'password' => bcrypt($password),
                    'role' => 'admin',
                ]
            );
        }

        // Llamar a los otros seeders
        $this->call([
            CanchaSeeder::class,
            HorarioSeeder::class,
            ClienteSeeder::class,
        ]);
    }
}