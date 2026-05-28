<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BackupSchedule;
use Illuminate\Http\Request;

class BackupScheduleController extends Controller
{
    public function index()
    {
        $schedules = BackupSchedule::orderBy('created_at', 'desc')->get();
        return response()->json($schedules);
    }

    public function store(Request $request)
    {
        $request->validate([
            'dia_semana' => 'required|in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'hora' => 'required|date_format:H:i',
            'activo' => 'boolean',
        ]);

        $schedule = BackupSchedule::create([
            'dia_semana' => $request->dia_semana,
            'hora' => $request->hora,
            'activo' => $request->activo ?? true,
        ]);

        return response()->json($schedule, 201);
    }

    public function update(Request $request, $id)
    {
        $schedule = BackupSchedule::findOrFail($id);

        $request->validate([
            'dia_semana' => 'in:lunes,martes,miercoles,jueves,viernes,sabado,domingo',
            'hora' => 'date_format:H:i',
            'activo' => 'boolean',
        ]);

        $schedule->update($request->only(['dia_semana', 'hora', 'activo']));

        return response()->json($schedule);
    }

    public function destroy($id)
    {
        $schedule = BackupSchedule::findOrFail($id);
        $schedule->delete();

        return response()->json(['message' => 'Programación eliminada correctamente']);
    }
}
