<?php

namespace App\Http\Controllers;

use App\Models\SystemLog;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class LogController extends Controller
{
    /**
     * Devuelve los últimos 200 registros del log del sistema.
     * Prioriza la base de datos (PostgreSQL/Supabase) para persistencia en entornos serverless (Vercel),
     * y utiliza storage/logs/laravel.log como fallback en desarrollo local.
     */
    public function index()
    {
        // 1. Verificar registros en base de datos
        if (Schema::hasTable('system_logs')) {
            $dbLogs = SystemLog::orderBy('id', 'desc')->limit(200)->get();

            if ($dbLogs->isNotEmpty()) {
                $formatted = $dbLogs->map(function ($log) {
                    return [
                        'id'        => $log->id,
                        'logged_at' => $log->created_at ? $log->created_at->toDateTimeString() : now()->toDateTimeString(),
                        'level'     => strtolower($log->level ?? 'info'),
                        'message'   => $log->message,
                    ];
                });

                return response()->json($formatted);
            }
        }

        // 2. Fallback a archivo de texto local storage/logs/laravel.log
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
     * Limpia los logs del sistema (base de datos y archivo local).
     */
    public function destroy($id)
    {
        if (Schema::hasTable('system_logs')) {
            SystemLog::truncate();
        }

        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            File::put($logPath, '');
        }

        return response()->json(['message' => 'Logs limpiados correctamente.']);
    }

    /**
     * Exporta los últimos 100 registros del log a PDF.
     */
    public function exportLogsPdf()
    {
        $lines = [];

        // 1. Obtener desde base de datos
        if (Schema::hasTable('system_logs')) {
            $dbLogs = SystemLog::orderBy('id', 'desc')->limit(100)->get();
            foreach ($dbLogs as $log) {
                $date = $log->created_at ? $log->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s');
                $lines[] = "[{$date}] " . strtoupper($log->level) . ": " . $log->message;
            }
        }

        // 2. Si no hay en BD, buscar en archivo local
        if (empty($lines)) {
            $logPath = storage_path('logs/laravel.log');
            if (File::exists($logPath)) {
                $logContent = File::get($logPath);
                $fileLines = array_reverse(explode("\n", $logContent));
                $lines = array_slice(array_filter($fileLines), 0, 100);
            }
        }

        if (empty($lines)) {
            $lines = ['[' . now()->format('Y-m-d H:i:s') . '] INFO: No hay registros de logs disponibles en el sistema.'];
        }

        $pdf = Pdf::loadView('pdf.logs_report', ['logs' => $lines]);
        $pdf->setPaper('a4', 'landscape');

        return $pdf->download('reporte_logs_sistema.pdf');
    }

    /**
     * Genera un log de prueba (solo superadmin).
     */
    public function storeTestLog(Request $request)
    {
        $user = $request->user();
        $userName = $user ? $user->name : 'Superadmin';

        $log = SystemLog::create([
            'level'   => $request->get('level', 'info'),
            'message' => $request->get('message', "Log de prueba generado por {$userName} desde el Panel de Administración."),
            'context' => [
                'user_id' => $user?->id,
                'ip'      => $request->ip(),
                'agent'   => $request->header('User-Agent'),
            ],
        ]);

        return response()->json([
            'message' => 'Log de prueba generado correctamente.',
            'log'     => [
                'id'        => $log->id,
                'logged_at' => $log->created_at->toDateTimeString(),
                'level'     => $log->level,
                'message'   => $log->message,
            ],
        ], 201);
    }
}