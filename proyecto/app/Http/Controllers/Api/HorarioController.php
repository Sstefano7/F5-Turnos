<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Horario;
use App\Models\Turno;
use Illuminate\Http\Request;
use Carbon\Carbon;

class HorarioController extends Controller
{
    public function index(Request $request)
    {
        $query = Horario::with('cancha');

        // Filtro por cancha (recomendado para no cargar todos los horarios)
        if ($request->has('cancha_id')) {
            $query->where('cancha_id', $request->cancha_id);
        }

        // Filtro por día de la semana
        if ($request->has('dia_semana')) {
            $query->where('dia_semana', $request->dia_semana);
        }

        $perPage = min((int) $request->get('per_page', 50), 200);
        $horarios = $query->paginate($perPage);

        return response()->json($horarios);
    }

    public function show($id)
    {
        $horario = Horario::with('cancha')->findOrFail($id);
        return response()->json($horario);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cancha_id' => 'required|exists:canchas,id',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'dia_semana' => 'required|in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'disponible' => 'boolean',
        ]);

        $horario = Horario::create($request->only([
            'cancha_id', 'hora_inicio', 'hora_fin', 'dia_semana', 'disponible',
        ]));

        return response()->json($horario, 201);
    }

    public function update(Request $request, $id)
    {
        $horario = Horario::findOrFail($id);

        $request->validate([
            'cancha_id' => 'exists:canchas,id',
            'hora_inicio' => 'date_format:H:i',
            'hora_fin' => 'date_format:H:i|after:hora_inicio',
            'dia_semana' => 'in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'disponible' => 'boolean',
        ]);

        $horario->update($request->only([
            'cancha_id', 'hora_inicio', 'hora_fin', 'dia_semana', 'disponible',
        ]));

        return response()->json($horario);
    }

    public function destroy($id)
    {
        $horario = Horario::findOrFail($id);
        $horario->delete();

        return response()->json([
            'message' => 'Horario eliminado correctamente'
        ]);
    }

    // Método para obtener horarios disponibles de una cancha en una fecha específica
    public function disponibles($canchaId, Request $request)
    {
        $request->validate([
            'fecha' => 'required|date'
        ]);

        $fecha = Carbon::parse($request->fecha);

        // Fechas pasadas: devolver arreglo vacío (la UI deshabilita esos días)
        if ($fecha->isBefore(Carbon::today())) {
            return response()->json([]);
        }

        $diaSemana = $this->getDiaSemanaEspanol($fecha->dayOfWeek);

        // Obtener horarios de la cancha para ese día
        $horarios = Horario::where('cancha_id', $canchaId)
            ->where('dia_semana', $diaSemana)
            ->where('disponible', true)
            ->get();

        // Obtener turnos ya reservados para esa fecha
        $turnosReservados = Turno::where('cancha_id', $canchaId)
            ->whereDate('fecha', $fecha)
            ->whereIn('estado', ['pendiente', 'confirmado', 'completado'])
            ->get();

        // Filtrar horarios disponibles
        $horariosDisponibles = $horarios->filter(function($horario) use ($turnosReservados) {
            foreach ($turnosReservados as $turno) {
                if ($horario->hora_inicio == $turno->hora_inicio) {
                    return false;
                }
            }
            return true;
        });

        return response()->json($horariosDisponibles->values());
    }

    private function getDiaSemanaEspanol($dayOfWeek)
    {
        $dias = [
            0 => 'domingo',
            1 => 'lunes',
            2 => 'martes',
            3 => 'miercoles',
            4 => 'jueves',
            5 => 'viernes',
            6 => 'sabado'
        ];

        return $dias[$dayOfWeek];
    }
}