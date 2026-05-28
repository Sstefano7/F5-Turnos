<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Liberar turnos pendientes de seña que expiraron — corre cada minuto
Schedule::command('turnos:liberar-expirados')->everyMinute();

// Backups automáticos programados — corre cada minuto y verifica si hay schedules activos
Schedule::command('backups:check-schedule')->everyMinute();
