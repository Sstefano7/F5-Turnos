<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Turno;
use App\Models\Cancha;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TurnoController extends Controller
{
public function index(Request $request)
{
    $query = Turno::with(['cancha', 'cliente']); // ← AGREGAR with()

    // Filtros opcionales
    if ($request->has('fecha')) {
        $query->whereDate('fecha', $request->fecha);
    }

    if ($request->has('estado')) {
        $query->where('estado', $request->estado);
    }

    if ($request->has('cancha_id')) {
        $query->where('cancha_id', $request->cancha_id);
    }

    $turnos = $query->orderBy('fecha')->orderBy('hora_inicio')->get();

    return response()->json($turnos);
}

    public function show($id)
    {
        $turno = Turno::with(['cancha', 'cliente', 'pago'])->findOrFail($id);
        return response()->json($turno);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cancha_id' => 'required|exists:canchas,id',
            'cliente_id' => 'required|exists:clientes,id',
            'fecha' => 'required|date|after_or_equal:today',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'observaciones' => 'nullable|string',
        ]);

        // Verificar que no haya otro turno en ese horario
        $turnoExistente = Turno::where('cancha_id', $request->cancha_id)
            ->whereDate('fecha', $request->fecha)
            ->where('hora_inicio', $request->hora_inicio)
            ->whereIn('estado', ['pendiente', 'confirmado'])
            ->first();

        if ($turnoExistente) {
            return response()->json([
                'message' => 'Ya existe un turno reservado en ese horario'
            ], 422);
        }

        // Calcular el precio
        $cancha = Cancha::findOrFail($request->cancha_id);
        $horaInicio = Carbon::parse($request->hora_inicio);
        $horaFin = Carbon::parse($request->hora_fin);
        $duracionHoras = $horaFin->diffInHours($horaInicio);
        $precio = $cancha->precio_hora * $duracionHoras;

        $turno = Turno::create([
            'cancha_id' => $request->cancha_id,
            'cliente_id' => $request->cliente_id,
            'user_id' => $request->user() ? $request->user()->id : null, // ← CAMBIAR A ESTO
            'fecha' => $request->fecha,
            'hora_inicio' => $request->hora_inicio,
            'hora_fin' => $request->hora_fin,
            'precio' => $precio,
            'estado' => 'pendiente',
            'observaciones' => $request->observaciones,
        ]);
        return response()->json($turno->load(['cancha', 'cliente']), 201);
    }

    public function update(Request $request, $id)
    {
        $turno = Turno::findOrFail($id);

        $request->validate([
            'cancha_id' => 'exists:canchas,id',
            'cliente_id' => 'exists:clientes,id',
            'fecha' => 'date|after_or_equal:today',
            'hora_inicio' => 'date_format:H:i',
            'hora_fin' => 'date_format:H:i|after:hora_inicio',
            'estado' => 'in:pendiente,confirmado,cancelado,completado',
            'observaciones' => 'nullable|string',
        ]);

        // Si se cambia la fecha u hora, verificar disponibilidad
        if ($request->has('fecha') || $request->has('hora_inicio')) {
            $fecha = $request->fecha ?? $turno->fecha;
            $horaInicio = $request->hora_inicio ?? $turno->hora_inicio;
            $canchaId = $request->cancha_id ?? $turno->cancha_id;

            $turnoExistente = Turno::where('cancha_id', $canchaId)
                ->whereDate('fecha', $fecha)
                ->where('hora_inicio', $horaInicio)
                ->whereIn('estado', ['pendiente', 'confirmado'])
                ->where('id', '!=', $id)
                ->first();

            if ($turnoExistente) {
                return response()->json([
                    'message' => 'Ya existe un turno reservado en ese horario'
                ], 422);
            }
        }

        // Recalcular precio si cambia la cancha o duración
        if ($request->has('cancha_id') || $request->has('hora_inicio') || $request->has('hora_fin')) {
            $canchaId = $request->cancha_id ?? $turno->cancha_id;
            $cancha = Cancha::findOrFail($canchaId);
            $horaInicio = Carbon::parse($request->hora_inicio ?? $turno->hora_inicio);
            $horaFin = Carbon::parse($request->hora_fin ?? $turno->hora_fin);
            $duracionHoras = $horaFin->diffInHours($horaInicio);
            $request->merge(['precio' => $cancha->precio_hora * $duracionHoras]);
        }

        $turno->update($request->all());

        return response()->json($turno->load(['cancha', 'cliente']));
    }

    public function destroy($id)
    {
        $turno = Turno::findOrFail($id);
        $turno->delete();

        return response()->json([
            'message' => 'Turno eliminado correctamente'
        ]);
    }

    // Obtener los turnos del usuario autenticado
    public function misTurnos(Request $request)
    {
        // Obtener el usuario autenticado
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado'
            ], 401);
        }
        
        // Buscar turnos del usuario
        $turnos = Turno::with(['cancha', 'cliente'])
            ->where('user_id', $user->id)
            ->orderBy('fecha')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json($turnos);
    }
    // Cancelar un turno
public function cancelar($id)
{
    $turno = Turno::findOrFail($id);

    if ($turno->estado === 'cancelado') {
        return response()->json([
            'message' => 'El turno ya está cancelado'
        ], 422);
    }

    if ($turno->estado === 'completado') {
        return response()->json([
            'message' => 'No se puede cancelar un turno completado'
        ], 422);
    }

    // Comentamos temporalmente la validación de 24 horas para que puedas probar
    /*
    $fechaTurno = Carbon::parse($turno->fecha . ' ' . $turno->hora_inicio);
    $horasRestantes = now()->diffInHours($fechaTurno, false);

    if ($horasRestantes < 24) {
        return response()->json([
            'message' => 'Debe cancelar con al menos 24 horas de anticipación'
        ], 422);
    }
    */

    $turno->update(['estado' => 'cancelado']);

    return response()->json([
        'message' => 'Turno cancelado correctamente',
        'turno' => $turno->load(['cancha', 'cliente'])
    ]);
}
}