<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cancha;
use Illuminate\Http\Request;

class CanchaController extends Controller
{
    public function index(Request $request)
    {
        // Iniciamos la consulta vacía
        $query = Cancha::query();

        // 1. FILTRO DE ESTADO:
        // Si la petición NO tiene el parámetro ?admin=true, ocultamos las inactivas
        if (!$request->boolean('admin')) {
            $query->where('activa', true);
        }

        // 2. PAGINACIÓN VS LISTA COMPLETA:
        // Si React nos envía el parámetro ?per_page=..., paginamos.
        if ($request->has('per_page')) {
            $perPage = $request->get('per_page', 20);
            return response()->json($query->paginate($perPage));
        }

        // Si no piden paginación, devolvemos el arreglo limpio con todas
        return response()->json($query->get());
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

        $cancha = Cancha::create($request->only([
            'nombre', 'tipo', 'descripcion', 'precio_hora', 'activa', 'imagen',
        ]));

        // Crear horarios automáticamente para la nueva cancha
        // Optimizado: 1 sola query INSERT en lugar de 105 (7 días × 15 franjas)
        $dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

        $franjas = [
            ['08:00', '09:00'], ['09:00', '10:00'], ['10:00', '11:00'],
            ['11:00', '12:00'], ['12:00', '13:00'], ['13:00', '14:00'],
            ['14:00', '15:00'], ['15:00', '16:00'], ['16:00', '17:00'],
            ['17:00', '18:00'], ['18:00', '19:00'], ['19:00', '20:00'],
            ['20:00', '21:00'], ['21:00', '22:00'], ['22:00', '23:00'],
        ];

        $horariosAInsertar = [];
        $ahora = now();

        foreach ($dias as $dia) {
            foreach ($franjas as $franja) {
                $horariosAInsertar[] = [
                    'cancha_id'   => $cancha->id,
                    'hora_inicio' => $franja[0],
                    'hora_fin'    => $franja[1],
                    'dia_semana'  => $dia,
                    'disponible'  => true,
                    'created_at'  => $ahora,
                    'updated_at'  => $ahora,
                ];
            }
        }

        \App\Models\Horario::insert($horariosAInsertar); // 1 sola query

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

        $cancha->update($request->only([
            'nombre', 'tipo', 'descripcion', 'precio_hora', 'activa', 'imagen',
        ]));

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