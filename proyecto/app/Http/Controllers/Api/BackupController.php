<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DatabaseBackupService;
use Illuminate\Http\Request;

class BackupController extends Controller
{
    // 1. Crear un nuevo backup de la base de datos
    public function create()
    {
        try {
            set_time_limit(300);

            $backupInfo = DatabaseBackupService::createBackup();

            return response()->json([
                'message' => 'Backup generado exitosamente.',
                'backup' => $backupInfo,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al generar backup: ' . $e->getMessage()
            ], 500);
        }
    }

    // 2. Listar todos los backups existentes y procesar pendientes si corresponde
    public function index()
    {
        try {
            // Verificar de manera oportunista si hay algún backup programado pendiente para hoy
            try {
                \App\Console\Commands\CheckBackupSchedule::processDueSchedules();
            } catch (\Throwable $e) {
                // Si falla el scheduled check, no interrumpimos el listado
            }

            $backups = DatabaseBackupService::listBackups();
            return response()->json($backups);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al listar backups: ' . $e->getMessage()
            ], 500);
        }
    }

    // 5. Endpoint de cron para ejecutar backups programados pendientes
    public function runScheduled(Request $request)
    {
        try {
            set_time_limit(300);
            $executed = \App\Console\Commands\CheckBackupSchedule::processDueSchedules();

            return response()->json([
                'message' => "Proceso completado. Se ejecutaron {$executed} backup(s).",
                'executed_count' => $executed,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al procesar backups programados: ' . $e->getMessage()
            ], 500);
        }
    }

    // 3. Descargar un backup específico con validación de path traversal
    public function download($fileName)
    {
        $fileName = basename($fileName);

        if (pathinfo($fileName, PATHINFO_EXTENSION) !== 'zip') {
            return response()->json(['error' => 'Tipo de archivo no permitido'], 403);
        }

        try {
            $content = DatabaseBackupService::downloadBackup($fileName);

            if ($content === null) {
                return response()->json(['error' => 'Archivo de backup no encontrado en el servidor'], 404);
            }

            return response($content, 200, [
                'Content-Type' => 'application/zip',
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
                'Content-Length' => strlen($content),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al descargar el backup: ' . $e->getMessage()], 500);
        }
    }

    // 4. Eliminar un backup de Supabase Storage
    public function destroy($fileName)
    {
        $fileName = basename($fileName);

        if (pathinfo($fileName, PATHINFO_EXTENSION) !== 'zip') {
            return response()->json(['error' => 'Tipo de archivo no permitido'], 403);
        }

        try {
            $deleted = DatabaseBackupService::deleteBackup($fileName);

            if (!$deleted) {
                return response()->json(['error' => 'No se pudo eliminar el backup de Supabase Storage'], 500);
            }

            return response()->json(['message' => 'Backup eliminado exitosamente']);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al eliminar el backup: ' . $e->getMessage()], 500);
        }
    }
}