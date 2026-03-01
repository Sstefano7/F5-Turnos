<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Cancha;
use App\Models\Turno;
use App\Models\Cliente;
use App\Models\Pago;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalCanchas = Cancha::count();
        $totalTurnos = Turno::count();
        $totalClientes = Cliente::count();
        $turnosPendientes = Turno::where('estado', 'pendiente')->count();
        
        // Ingresos del mes actual
        $mesActual = Carbon::now()->month;
        $añoActual = Carbon::now()->year;
        
        $ingresosMes = Pago::whereMonth('created_at', $mesActual)
            ->whereYear('created_at', $añoActual)
            ->where('estado', 'completado')
            ->sum('monto');
            
        return response()->json([
            'totalCanchas' => $totalCanchas,
            'totalTurnos' => $totalTurnos,
            'totalClientes' => $totalClientes,
            'turnosPendientes' => $turnosPendientes,
            'ingresosMes' => floatval($ingresosMes)
        ]);
    }
}