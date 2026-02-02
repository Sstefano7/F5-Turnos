<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cancha;
use App\Models\Horario;

class HorarioSeeder extends Seeder
{
    public function run(): void
    {
        $canchas = Cancha::all();
        $dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        // Horarios de 8:00 a 23:00 (cada hora)
        $horarios = [
            ['08:00', '09:00'],
            ['09:00', '10:00'],
            ['10:00', '11:00'],
            ['11:00', '12:00'],
            ['12:00', '13:00'],
            ['13:00', '14:00'],
            ['14:00', '15:00'],
            ['15:00', '16:00'],
            ['16:00', '17:00'],
            ['17:00', '18:00'],
            ['18:00', '19:00'],
            ['19:00', '20:00'],
            ['20:00', '21:00'],
            ['21:00', '22:00'],
            ['22:00', '23:00'],
        ];

        foreach ($canchas as $cancha) {
            foreach ($dias as $dia) {
                foreach ($horarios as $horario) {
                    Horario::create([
                        'cancha_id' => $cancha->id,
                        'hora_inicio' => $horario[0],
                        'hora_fin' => $horario[1],
                        'dia_semana' => $dia,
                        'disponible' => true,
                    ]);
                }
            }
        }
    }
}