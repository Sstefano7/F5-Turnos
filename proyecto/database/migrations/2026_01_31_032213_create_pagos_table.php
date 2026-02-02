<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turno_id')->constrained()->onDelete('cascade');
            $table->decimal('monto', 8, 2);
            $table->enum('metodo_pago', ['efectivo', 'tarjeta', 'transferencia']);
            $table->enum('estado', ['pendiente', 'completado', 'reembolsado'])->default('pendiente');
            $table->timestamp('fecha_pago')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
