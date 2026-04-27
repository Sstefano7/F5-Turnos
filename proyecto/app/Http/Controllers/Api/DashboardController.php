<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Cancha;
use App\Models\Turno;
use App\Models\Cliente;
use App\Models\Pago;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function stats()
    {
        // Caché de 10 segundos para evitar recalcular masivamente, pero mantener frescura
        $stats = Cache::remember('dashboard.stats', 10, function () {
            $mesActual = Carbon::now()->month;
            $añoActual = Carbon::now()->year;

            $ingresosMes = Pago::whereMonth('created_at', $mesActual)
                ->whereYear('created_at', $añoActual)
                ->where('estado', 'completado')
                ->sum('monto');

            return [
                'totalCanchas'     => Cancha::count(),
                'totalTurnos'      => Turno::count(),
                'totalClientes'    => Cliente::count(),
                'turnosPendientes' => Turno::where('estado', 'pendiente')->count(),
                'ingresosMes'      => floatval($ingresosMes),
            ];
        });

        return response()->json($stats);
    }
}