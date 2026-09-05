<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->timestamp('senia_vence_en')->nullable();
            $table->decimal('monto_senia', 8, 2)->nullable();
        });

        $check = DB::selectOne("
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'turnos'::regclass
              AND contype = 'c'
            LIMIT 1
        ");

        if ($check) {
            DB::statement("ALTER TABLE turnos DROP CONSTRAINT \"{$check->conname}\"");
        }

        DB::statement("ALTER TABLE turnos ADD CONSTRAINT turnos_estado_check CHECK (estado IN ('pendiente', 'confirmado', 'cancelado', 'completado', 'pendiente_senia'))");
    }

    public function down(): void
    {
        $check = DB::selectOne("
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'turnos'::regclass
              AND contype = 'c'
            LIMIT 1
        ");

        if ($check) {
            DB::statement("ALTER TABLE turnos DROP CONSTRAINT \"{$check->conname}\"");
        }

        DB::statement("ALTER TABLE turnos ADD CONSTRAINT turnos_estado_check CHECK (estado IN ('pendiente', 'confirmado', 'cancelado', 'completado'))");

        Schema::table('turnos', function (Blueprint $table) {
            $table->dropColumn(['monto_senia', 'senia_vence_en']);
        });
    }
};