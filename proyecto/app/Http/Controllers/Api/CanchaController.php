<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cancha;
use Illuminate\Http\Request;

class CanchaController extends Controller
{
    public function index()
    {
        $canchas = Cancha::activas()->get();
        return response()->json($canchas);
    }

    public function show($id)
    {
        $cancha = Cancha::with('horarios')->findOrFail($id);
        return response()->json($cancha);
    }

   public function store(Request $request)
{
    $request->validate([
        'nombre' => 'required|string|max:255',
        'tipo' => 'required|in:futbol5,padel',
        'descripcion' => 'nullable|string',
        'precio_hora' => 'required|numeric|min:0',
        'activa' => 'boolean',
        'imagen' => 'nullable|string',
    ]);

    $cancha = Cancha::create($request->all());

    // Crear horarios automáticamente para la nueva cancha
    $dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
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

    foreach ($dias as $dia) {
        foreach ($horarios as $horario) {
            \App\Models\Horario::create([
                'cancha_id' => $cancha->id,
                'hora_inicio' => $horario[0],
                'hora_fin' => $horario[1],
                'dia_semana' => $dia,
                'disponible' => true,
            ]);
        }
    }

    return response()->json($cancha, 201);
}
    public function update(Request $request, $id)
    {
        $cancha = Cancha::findOrFail($id);

        $request->validate([
            'nombre' => 'string|max:255',
            'tipo' => 'in:futbol5,padel',
            'descripcion' => 'nullable|string',
            'precio_hora' => 'numeric|min:0',
            'activa' => 'boolean',
            'imagen' => 'nullable|string',
        ]);

        $cancha->update($request->all());

        return response()->json($cancha);
    }

    public function destroy($id)
    {
        $cancha = Cancha::findOrFail($id);
        $cancha->delete();

        return response()->json([
            'message' => 'Cancha eliminada correctamente'
        ]);
    }
}