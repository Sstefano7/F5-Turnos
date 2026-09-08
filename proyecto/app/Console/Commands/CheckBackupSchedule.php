<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BackupSchedule;
use App\Services\DatabaseBackupService;

class CheckBackupSchedule extends Command
{
    protected $signature = 'backups:check-schedule';
    protected $description = 'Ejecuta backups automáticos según la configuración de backup_schedules';

    public function handle()
    {
        $dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        $diaActual = $dias[(int) now()->dayOfWeek];
        $horaActual = now()->format('H:i');

        $schedules = BackupSchedule::where('activo', true)
            ->where('dia_semana', $diaActual)
            ->where('hora', $horaActual)
            ->get();

        if ($schedules->isEmpty()) {
            $this->info('No hay backups programados para este momento.');
            return;
        }

        foreach ($schedules as $schedule) {
            $this->info("Ejecutando backup programado: {$schedule->dia_semana} {$schedule->hora}");
            try {
                $backup = DatabaseBackupService::createBackup();
                $this->info("Backup generado exitosamente: {$backup['name']} ({$backup['size']})");
            } catch (\Throwable $e) {
                $this->error("Error al generar backup programado: " . $e->getMessage());
            }
        }

        $this->info("Se procesaron {$schedules->count()} backup(s) programado(s).");
    }
}
