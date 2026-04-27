<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Agregar campos de seña a la tabla turnos
        Schema::table('turnos', function (Blueprint $table) {
            // Monto de la seña a pagar (ej: 30% del total)
            $table->decimal('monto_senia', 8, 2)->nullable()->after('precio');
            // Monto restante a pagar en persona
            $table->decimal('monto_restante', 8, 2)->nullable()->after('monto_senia');
            // Hasta cuándo tiene el usuario para pagar la seña
            $table->timestamp('senia_vence_en')->nullable()->after('monto_restante');
            // ID de la preferencia de MercadoPago
            $table->string('mp_preference_id')->nullable()->after('senia_vence_en');
        });

        // Cambiar el enum de estado para incluir 'pendiente_senia'
        // En MySQL, cambiar un ENUM requiere redefinirlo completo
        \DB::statement("ALTER TABLE turnos MODIFY COLUMN estado ENUM('pendiente_senia','pendiente','confirmado','cancelado','completado') NOT NULL DEFAULT 'pendiente_senia'");
    }

    public function down(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropColumn(['monto_senia', 'monto_restante', 'senia_vence_en', 'mp_preference_id']);
        });

        \DB::statement("ALTER TABLE turnos MODIFY COLUMN estado ENUM('pendiente','confirmado','cancelado','completado') NOT NULL DEFAULT 'pendiente'");
    }
};
