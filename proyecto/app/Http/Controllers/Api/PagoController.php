<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pago;
use App\Models\Turno;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PagoController extends Controller
{
    public function index(Request $request)
    {
        $query = Pago::with(['turno.cancha', 'turno.cliente']);

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('metodo_pago')) {
            $query->where('metodo_pago', $request->metodo_pago);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('referencia', 'ilike', "%{$search}%");

                if (is_numeric($search)) {
                    $q->orWhere('id', (int) $search)
                      ->orWhere('turno_id', (int) $search)
                      ->orWhere('monto', (float) $search);
                }

                $q->orWhereHas('turno.cliente', function ($cq) use ($search) {
                    $cq->where('nombre', 'ilike', "%{$search}%")
                       ->orWhere('apellido', 'ilike', "%{$search}%")
                       ->orWhere('dni', 'ilike', "%{$search}%");
                });
            });
        }

        $perPage = min((int) $request->get('per_page', 15), 100);
        $pagos = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($pagos);
    }

    public function show($id)
    {
        $pago = Pago::with(['turno.cancha', 'turno.cliente'])->findOrFail($id);
        return response()->json($pago);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'turno_id'    => 'nullable|exists:turnos,id',
            'monto'       => 'required|numeric|min:0',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,mercadopago',
            'estado'      => 'required|in:pendiente,pagado,fallido,reembolsado',
            'referencia'  => 'nullable|string|max:255',
            'fecha_pago'  => 'nullable|date',
        ]);

        if ($data['estado'] === 'pagado' && empty($data['fecha_pago'])) {
            $data['fecha_pago'] = Carbon::now();
        }

        $pago = Pago::create($data);
        $pago->load(['turno.cancha', 'turno.cliente']);

        return response()->json($pago, 201);
    }

    public function update(Request $request, $id)
    {
        $pago = Pago::findOrFail($id);

        $data = $request->validate([
            'turno_id'    => 'nullable|exists:turnos,id',
            'monto'       => 'sometimes|required|numeric|min:0',
            'metodo_pago' => 'sometimes|required|in:efectivo,tarjeta,transferencia,mercadopago',
            'estado'      => 'sometimes|required|in:pendiente,pagado,fallido,reembolsado',
            'referencia'  => 'nullable|string|max:255',
            'fecha_pago'  => 'nullable|date',
        ]);

        if (isset($data['estado']) && $data['estado'] === 'pagado' && empty($data['fecha_pago']) && empty($pago->fecha_pago)) {
            $data['fecha_pago'] = Carbon::now();
        }

        $pago->update($data);
        $pago->load(['turno.cancha', 'turno.cliente']);

        return response()->json($pago);
    }

    public function destroy($id)
    {
        $pago = Pago::findOrFail($id);
        $pago->delete();

        return response()->json([
            'message' => 'Pago eliminado correctamente'
        ]);
    }

    public function exportPdf(Request $request)
    {
        $query = Pago::with(['turno.cancha', 'turno.cliente']);

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('metodo_pago')) {
            $query->where('metodo_pago', $request->metodo_pago);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('referencia', 'ilike', "%{$search}%");

                if (is_numeric($search)) {
                    $q->orWhere('id', (int) $search)
                      ->orWhere('turno_id', (int) $search)
                      ->orWhere('monto', (float) $search);
                }

                $q->orWhereHas('turno.cliente', function ($cq) use ($search) {
                    $cq->where('nombre', 'ilike', "%{$search}%")
                       ->orWhere('apellido', 'ilike', "%{$search}%")
                       ->orWhere('dni', 'ilike', "%{$search}%");
                });
            });
        }

        $pagos = $query->orderBy('id', 'desc')->limit(500)->get();

        $pdf = Pdf::loadView('pdf.pagos', compact('pagos'));

        return $pdf->download('reporte_pagos_' . date('Y-m-d') . '.pdf');
    }
}
