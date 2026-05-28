<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BackupSchedule;
use Illuminate\Support\Facades\Artisan;

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
            Artisan::call('backup:run', ['--disable-notifications' => true]);
            $this->info(Artisan::output());
        }

        $this->info("Se ejecutaron {$schedules->count()} backup(s) programado(s).");
    }
}
