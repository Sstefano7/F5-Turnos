<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Pago;
use App\Models\Turno;

class PagoController extends Controller
{
   public function index(Request $request)
    {
    $perPage = $request->get('per_page', 15);
    $pagos = Pago::with(['turno.cancha', 'turno.cliente'])->paginate($perPage);
    return response()->json($pagos);
    }

    public function show($id)
    {
        $pago = Pago::with(['turno.cancha', 'turno.cliente'])->findOrFail($id);
        return response()->json($pago);
    }

    public function store(Request $request)
    {
        $request->validate([
            'turno_id' => 'required|exists:turnos,id',
            'monto' => 'required|numeric|min:0',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia',
            'estado' => 'in:pendiente,completado,reembolsado'
        ]);

        // Verificar que el turno no tenga ya un pago
        $pagoExistente = Pago::where('turno_id', $request->turno_id)->first();
        if ($pagoExistente) {
            return response()->json([
                'message' => 'Este turno ya tiene un pago registrado'
            ], 422);
        }

        $pago = Pago::create([
            'turno_id' => $request->turno_id,
            'monto' => $request->monto,
            'metodo_pago' => $request->metodo_pago,
            'estado' => $request->estado ?? 'pendiente',
            'fecha_pago' => $request->estado === 'completado' ? now() : null
        ]);

        return response()->json($pago->load(['turno.cancha', 'turno.cliente']), 201);
    }

    public function update(Request $request, $id)
    {
        $pago = Pago::findOrFail($id);

        $request->validate([
            'monto' => 'numeric|min:0',
            'metodo_pago' => 'in:efectivo,tarjeta,transferencia',
            'estado' => 'in:pendiente,completado,reembolsado'
        ]);

        $data = $request->all();

        // Si se marca como completado y no tenía fecha, agregar la fecha actual
        if ($request->estado === 'completado' && !$pago->fecha_pago) {
            $data['fecha_pago'] = now();
        }

        $pago->update($data);

        return response()->json($pago->load(['turno.cancha', 'turno.cliente']));
    }

    public function destroy($id)
    {
        $pago = Pago::findOrFail($id);
        $pago->delete();

        return response()->json([
            'message' => 'Pago eliminado correctamente'
        ]);
    }

    // Obtener pagos por turno
    public function porTurno($turnoId)
    {
        $pago = Pago::where('turno_id', $turnoId)
            ->with(['turno.cancha', 'turno.cliente'])
            ->first();
        
        return response()->json($pago);
    }

    // Obtener estadísticas de pagos
public function estadisticas()
{
    try {
        $totalIngresos = Pago::where('estado', 'completado')->sum('monto') ?: 0;
        $pagosPendientes = Pago::where('estado', 'pendiente')->sum('monto') ?: 0;
        $totalPagos = Pago::count() ?: 0;
        $pagosCompletados = Pago::where('estado', 'completado')->count() ?: 0;

        // Versión simplificada para evitar problemas de GroupBy
        $pagosPorMetodo = Pago::select('metodo_pago')
            ->selectRaw('COUNT(*) as cantidad, SUM(monto) as total')
            ->groupBy('metodo_pago')
            ->get();

        return response()->json([
            'total_ingresos' => (float)$totalIngresos,
            'pagos_pendientes' => (float)$pagosPendientes,
            'total_pagos' => (int)$totalPagos,
            'pagos_completados' => (int)$pagosCompletados,
            'pagos_por_metodo' => $pagosPorMetodo
        ]);
    } catch (\Exception $e) {
        // Esto nos dirá el error real en el log si algo falla
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
}