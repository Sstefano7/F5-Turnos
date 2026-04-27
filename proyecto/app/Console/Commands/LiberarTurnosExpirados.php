<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Turno;

class LiberarTurnosExpirados extends Command
{
    protected $signature   = 'turnos:liberar-expirados';
    protected $description = 'Cancela los turnos pendientes de seña cuyo tiempo de pago expiró';

    public function handle(): void
    {
        $cancelados = Turno::where('estado', 'pendiente_senia')
            ->whereNotNull('senia_vence_en')
            ->where('senia_vence_en', '<', now())
            ->get();

        if ($cancelados->isEmpty()) {
            $this->info('No hay turnos expirados.');
            return;
        }

        foreach ($cancelados as $turno) {
            $turno->update(['estado' => 'cancelado']);
            $this->line("Turno #{$turno->id} cancelado por falta de pago de seña.");
        }

        $this->info("Se cancelaron {$cancelados->count()} turno(s) expirado(s).");
    }
}
