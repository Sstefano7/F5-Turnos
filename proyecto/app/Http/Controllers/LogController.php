<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\File;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class LogController extends Controller
{
    /**
     * Devuelve los últimos 200 registros del log del sistema parseados.
     */
    public function index()
    {
        $logPath = storage_path('logs/laravel.log');

        if (!File::exists($logPath)) {
            return response()->json([]);
        }

        $logContent = File::get($logPath);
        $lines = array_filter(explode("\n", $logContent));

        // Invertir para mostrar los más recientes primero y tomar los últimos 200
        $lines = array_reverse(array_values($lines));
        $lines = array_slice($lines, 0, 200);

        $logs = [];
        $id = 1;

        foreach ($lines as $line) {
            // Parsear líneas con formato estándar de Laravel: [YYYY-MM-DD HH:MM:SS] local.LEVEL: mensaje
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \w+\.(\w+): (.+)$/', $line, $matches)) {
                $logs[] = [
                    'id'        => $id++,
                    'logged_at' => $matches[1],
                    'level'     => strtolower($matches[2]),
                    'message'   => $matches[3],
                ];
            } elseif (trim($line) !== '') {
                // Líneas de stack trace u otras sin formato
                $logs[] = [
                    'id'        => $id++,
                    'logged_at' => now()->toDateTimeString(),
                    'level'     => 'debug',
                    'message'   => $line,
                ];
            }
        }

        return response()->json($logs);
    }

    /**
     * Elimina una entrada concreta del log (por ID de posición en la respuesta).
     * Como el log es un archivo de texto, "eliminar" equivale a limpiar el archivo completo.
     * Para logs en producción se recomienda usar una tabla de base de datos.
     */
    public function destroy($id)
    {
        // En implementaciones con archivo de texto, no se puede eliminar una línea individualmente
        // de forma eficiente y segura. Se limpian todos los logs del archivo.
        $logPath = storage_path('logs/laravel.log');

        if (!File::exists($logPath)) {
            return response()->json(['message' => 'No hay archivo de logs.'], 404);
        }

        File::put($logPath, '');

        return response()->json(['message' => 'Logs limpiados correctamente.']);
    }

    /**
     * Exporta los últimos 100 registros del log a PDF.
     */
    public function exportLogsPdf()
    {
        $logPath = storage_path('logs/laravel.log');

        if (!File::exists($logPath)) {
            return response()->json(['message' => 'No hay archivo de logs disponible.'], 404);
        }

        $logContent = File::get($logPath);
        $lines = array_reverse(explode("\n", $logContent));
        $logs = array_slice(array_filter($lines), 0, 100);

        $pdf = Pdf::loadView('pdf.logs_report', compact('logs'));
        $pdf->setPaper('a4', 'landscape');

        return $pdf->download('reporte_logs_sistema.pdf');
    }
}