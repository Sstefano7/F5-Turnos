<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turno_id')->nullable()->constrained('turnos')->onDelete('set null');
            $table->decimal('monto', 10, 2);
            $table->string('metodo_pago', 50)->default('efectivo'); // efectivo, tarjeta, transferencia, mercadopago
            $table->string('estado', 50)->default('pendiente'); // pendiente, pagado, fallido, reembolsado
            $table->string('referencia')->nullable();
            $table->timestamp('fecha_pago')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['estado', 'created_at']);
            $table->index('metodo_pago');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
