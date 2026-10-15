<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE turnos DROP CONSTRAINT IF EXISTS turnos_no_overlap');
        DB::statement(<<<'SQL'
            ALTER TABLE turnos ADD CONSTRAINT turnos_no_overlap
            EXCLUDE USING gist (
                cancha_id WITH =,
                fecha WITH =,
                tsrange(fecha + hora_inicio, fecha + hora_fin, '[)') WITH &&
            )
            WHERE (deleted_at IS NULL AND estado IN ('pendiente', 'confirmado', 'pendiente_senia'))
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE turnos DROP CONSTRAINT IF EXISTS turnos_no_overlap');
        DB::statement(<<<'SQL'
            ALTER TABLE turnos ADD CONSTRAINT turnos_no_overlap
            EXCLUDE USING gist (
                cancha_id WITH =,
                fecha WITH =,
                tsrange(fecha + hora_inicio, fecha + hora_fin, '[)') WITH &&
            )
            WHERE (estado IN ('pendiente', 'confirmado', 'pendiente_senia'))
        SQL);
    }
};
