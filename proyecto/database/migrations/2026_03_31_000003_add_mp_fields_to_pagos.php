<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            // ID de la preferencia de MercadoPago (se crea al iniciar el pago)
            $table->string('mp_preference_id')->nullable()->after('fecha_pago');
            // ID del pago confirmado por MercadoPago (llega en el webhook)
            $table->string('mp_payment_id')->nullable()->after('mp_preference_id');
            // Estado que reporta MercadoPago: approved, pending, rejected
            $table->string('mp_status')->nullable()->after('mp_payment_id');
            // Tipo de pago: 'senia' (depósito inicial) o 'saldo' (resto en persona)
            $table->enum('tipo', ['senia', 'saldo'])->default('senia')->after('mp_status');
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropColumn(['mp_preference_id', 'mp_payment_id', 'mp_status', 'tipo']);
        });
    }
};
