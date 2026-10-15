<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Respaldo definitivo contra doble reserva bajo concurrencia.
     *
     * El chequeo de solapamiento del controlador es check-then-insert: dos
     * requests simultaneos pueden pasar el chequeo y ambos insertar. Esta
     * exclusion constraint garantiza a nivel de base de datos que dos turnos
     * activos en la misma cancha/fecha no puedan solaparse nunca.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return; // SQLite (CI) no soporta exclusion constraints
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');

        // tsrange (sin zona): fecha + hora_inicio es 'timestamp without time
        // zone', asi la constraint no depende del TimeZone de la sesion.
        DB::statement(<<<'SQL'
            ALTER TABLE turnos ADD CONSTRAINT turnos_no_overlap
            EXCLUDE USING gist (
                cancha_id WITH =,
                fecha WITH =,
                tsrange(
                    fecha + hora_inicio,
                    fecha + hora_fin,
                    '[)'
                ) WITH &&
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
    }
};
