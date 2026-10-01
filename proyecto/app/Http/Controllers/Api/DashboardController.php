<?php

namespace App\Http\Controllers\Api;

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
        // Caché de 10 segundos para mantener frescura y alto desempeño
        $stats = Cache::remember('dashboard.stats', 10, function () {
            $ahora = Carbon::now();
            $mesActual = $ahora->month;
            $añoActual = $ahora->year;

            // 1. Ingresos mes actual
            $ingresosMes = Pago::whereMonth('created_at', $mesActual)
                ->whereYear('created_at', $añoActual)
                ->whereIn('estado', ['pagado', 'completado'])
                ->sum('monto');

            if ($ingresosMes <= 0) {
                $ingresosMes = Turno::whereMonth('fecha', $mesActual)
                    ->whereYear('fecha', $añoActual)
                    ->whereIn('estado', ['confirmado', 'completado'])
                    ->sum('precio');
            }

            // 2. Ingresos mes anterior para comparativa
            $mesAnterior = Carbon::now()->subMonth();
            $ingresosMesAnterior = Pago::whereMonth('created_at', $mesAnterior->month)
                ->whereYear('created_at', $mesAnterior->year)
                ->whereIn('estado', ['pagado', 'completado'])
                ->sum('monto');

            if ($ingresosMesAnterior <= 0) {
                $ingresosMesAnterior = Turno::whereMonth('fecha', $mesAnterior->month)
                    ->whereYear('fecha', $mesAnterior->year)
                    ->whereIn('estado', ['confirmado', 'completado'])
                    ->sum('precio');
            }

            // 3. Desglose de turnos por estado
            $turnosPorEstado = [
                'confirmados' => Turno::where('estado', 'confirmado')->count(),
                'pendientes'  => Turno::whereIn('estado', ['pendiente', 'pendiente_senia'])->count(),
                'completados' => Turno::where('estado', 'completado')->count(),
                'cancelados'  => Turno::where('estado', 'cancelado')->count(),
            ];

            // 4. Desglose por deporte
            $turnosFutbol = Turno::whereHas('cancha', fn($q) => $q->where('tipo', 'futbol5'))->count();
            $turnosPadel  = Turno::whereHas('cancha', fn($q) => $q->where('tipo', 'padel'))->count();

            // 5. Ranking de canchas más reservadas
            $topCanchas = Cancha::withCount('turnos')
                ->orderBy('turnos_count', 'desc')
                ->limit(4)
                ->get(['id', 'nombre', 'tipo'])
                ->map(fn($c) => [
                    'nombre' => $c->nombre,
                    'tipo'   => $c->tipo,
                    'turnos' => $c->turnos_count
                ]);

            // 6. Actividad de reservas en los últimos 7 días
            $diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            $actividad7Dias = [];
            for ($i = 6; $i >= 0; $i--) {
                $dia = Carbon::today()->subDays($i);
                $actividad7Dias[] = [
                    'fecha'    => $dia->toDateString(),
                    'etiqueta' => $diasNombres[$dia->dayOfWeek] . ' ' . $dia->day,
                    'cantidad' => Turno::whereDate('fecha', $dia->toDateString())->count(),
                ];
            }

            return [
                'totalCanchas'        => Cancha::count(),
                'totalTurnos'         => Turno::count(),
                'totalClientes'       => Cliente::count(),
                'turnosPendientes'    => Turno::where('estado', 'pendiente')->count(),
                'ingresosMes'         => floatval($ingresosMes),
                'ingresosMesAnterior' => floatval($ingresosMesAnterior),
                'turnosPorEstado'     => $turnosPorEstado,
                'turnosPorTipo'       => [
                    'futbol5' => $turnosFutbol,
                    'padel'   => $turnosPadel,
                ],
                'topCanchas'          => $topCanchas,
                'actividad7Dias'      => $actividad7Dias,
            ];
        });

        return response()->json($stats);
    }
}