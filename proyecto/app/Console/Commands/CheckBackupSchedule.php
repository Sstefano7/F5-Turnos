<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BackupSchedule;
use App\Services\DatabaseBackupService;
use Carbon\Carbon;

class CheckBackupSchedule extends Command
{
    protected $signature = 'backups:check-schedule';
    protected $description = 'Ejecuta backups automáticos según la configuración de backup_schedules';

    public function handle()
    {
        $executed = self::processDueSchedules(function ($msg, $isError = false) {
            if ($isError) {
                $this->error($msg);
            } else {
                $this->info($msg);
            }
        });

        $this->info("Se procesaron {$executed} backup(s) programado(s).");
    }

    /**
     * Procesa los backups programados pendientes para el día y la hora actual (Zona Horaria Argentina).
     */
    public static function processDueSchedules(?callable $logger = null): int
    {
        $now = Carbon::now('America/Argentina/Buenos_Aires');
        $dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        $diaActual = $dias[(int) $now->dayOfWeek];
        $horaActual = $now->format('H:i');
        $inicioHoy = $now->copy()->startOfDay();

        // Buscar programaciones activas para hoy cuya hora ya haya llegado y no se hayan ejecutado hoy
        $schedules = BackupSchedule::where('activo', true)
            ->where('dia_semana', $diaActual)
            ->where('hora', '<=', $horaActual)
            ->where(function ($q) use ($inicioHoy) {
                $q->whereNull('ultimo_backup_at')
                  ->orWhere('ultimo_backup_at', '<', $inicioHoy);
            })
            ->get();

        if ($schedules->isEmpty()) {
            if ($logger) $logger("No hay backups programados pendientes para ejecutar (Hoy: {$diaActual}, Hora: {$horaActual}).");
            return 0;
        }

        $executed = 0;
        foreach ($schedules as $schedule) {
            if ($logger) $logger("Ejecutando backup programado: {$schedule->dia_semana} {$schedule->hora}...");
            try {
                $backup = DatabaseBackupService::createBackup();
                $schedule->update(['ultimo_backup_at' => Carbon::now()]);
                $executed++;
                if ($logger) $logger("Backup generado exitosamente: {$backup['name']} ({$backup['size']})");
            } catch (\Throwable $e) {
                if ($logger) $logger("Error al generar backup programado ID #{$schedule->id}: " . $e->getMessage(), true);
            }
        }

        return $executed;
    }
}
