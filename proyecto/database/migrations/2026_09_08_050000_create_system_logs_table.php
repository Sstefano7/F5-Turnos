<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->id();
            $table->string('level', 20)->default('info');
            $table->text('message');
            $table->json('context')->nullable();
            $table->timestamps();

            $table->index(['created_at', 'level']);
        });

        // Insertar un primer registro informativo
        \Illuminate\Support\Facades\DB::table('system_logs')->insert([
            'level' => 'info',
            'message' => 'Sistema de logs persistente en base de datos inicializado correctamente.',
            'context' => json_encode(['env' => app()->environment()]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
