<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\File;
use Barryvdh\DomPDF\Facade\Pdf;

class LogController extends Controller
{
    public function exportLogsPdf()
    {
        $logPath = storage_path('logs/laravel.log');

        if (!File::exists($logPath)) {
            return response()->json(['message' => 'No hay archivo de logs disponible.'], 404);
        }

        // Leemos el archivo completo
        $logContent = File::get($logPath);
        
        // Convertimos en array por líneas y las invertimos (lo más nuevo arriba)
        $lines = array_reverse(explode("\n", $logContent));

        // Tomamos solo las últimas 100 líneas para evitar que el PDF sea demasiado pesado
        $logs = array_slice(array_filter($lines), 0, 100);

        $pdf = Pdf::loadView('pdf.logs_report', compact('logs'));
        
        // Orientación horizontal para leer mejor las rutas de archivos
        $pdf->setPaper('a4', 'landscape');

        return $pdf->download('reporte_logs_sistema.pdf');
    }
}