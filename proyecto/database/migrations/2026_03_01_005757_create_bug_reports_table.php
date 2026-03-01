<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bug_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('titulo');
            $table->text('descripcion');
            $table->enum('tipo', ['bug', 'mejora', 'pregunta'])->default('bug');
            $table->enum('prioridad', ['baja', 'media', 'alta', 'critica'])->default('media');
            $table->enum('estado', ['nuevo', 'en_revision', 'en_progreso', 'resuelto', 'cerrado'])->default('nuevo');
            $table->string('pagina')->nullable(); // URL donde ocurrió
            $table->string('navegador')->nullable();
            $table->text('pasos_reproducir')->nullable();
            $table->json('metadata')->nullable(); // Info adicional
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bug_reports');
    }
};