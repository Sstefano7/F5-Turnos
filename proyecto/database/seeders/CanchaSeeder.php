<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cancha;

class CanchaSeeder extends Seeder
{
    public function run(): void
    {
        $canchas = [
            [
                'nombre' => 'Cancha Fútbol 5 - Principal',
                'tipo' => 'futbol5',
                'descripcion' => 'Cancha de fútbol 5 con césped sintético de última generación',
                'precio_hora' => 15000,
                'activa' => true,
            ],
            [
                'nombre' => 'Cancha Fútbol 5 - Secundaria',
                'tipo' => 'futbol5',
                'descripcion' => 'Cancha de fútbol 5 techada',
                'precio_hora' => 12000,
                'activa' => true,
            ],
            [
                'nombre' => 'Cancha Pádel 1',
                'tipo' => 'padel',
                'descripcion' => 'Cancha de pádel profesional con iluminación LED',
                'precio_hora' => 8000,
                'activa' => true,
            ],
            [
                'nombre' => 'Cancha Pádel 2',
                'tipo' => 'padel',
                'descripcion' => 'Cancha de pádel panorámica',
                'precio_hora' => 8000,
                'activa' => true,
            ],
        ];

        foreach ($canchas as $cancha) {
            Cancha::create($cancha);
        }
    }
}