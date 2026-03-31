<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega índices a las tablas de mayor carga de consultas.
     * 
     * - turnos(cancha_id, fecha, hora_inicio): usada en cada verificación de disponibilidad
     * - turnos(user_id, fecha): usada en "mis turnos" de un usuario
     * - horarios(cancha_id, dia_semana): usada al cargar horarios disponibles por cancha y día
     * - pagos(turno_id): usada en consultas de pago por turno
     * - bug_reports(estado, tipo, prioridad): usada en los filtros del panel de superadmin
     */
    public function up(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            // Índice compuesto para la verificación de disponibilidad de horarios
            $table->index(['cancha_id', 'fecha', 'hora_inicio'], 'turnos_disponibilidad_idx');

            // Índice para la consulta "mis turnos" filtrada por usuario
            $table->index(['user_id', 'fecha'], 'turnos_user_fecha_idx');
        });

        Schema::table('horarios', function (Blueprint $table) {
            // Índice para cargar horarios por cancha y día de la semana
            $table->index(['cancha_id', 'dia_semana'], 'horarios_cancha_dia_idx');
        });

        Schema::table('pagos', function (Blueprint $table) {
            // Índice para buscar el pago de un turno específico
            $table->index('turno_id', 'pagos_turno_id_idx');
        });

        Schema::table('bug_reports', function (Blueprint $table) {
            // Índice para los filtros del panel de superadmin
            $table->index(['estado', 'tipo', 'prioridad'], 'bug_reports_filtros_idx');
        });
    }

    public function down(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropIndex('turnos_disponibilidad_idx');
            $table->dropIndex('turnos_user_fecha_idx');
        });

        Schema::table('horarios', function (Blueprint $table) {
            $table->dropIndex('horarios_cancha_dia_idx');
        });

        Schema::table('pagos', function (Blueprint $table) {
            $table->dropIndex('pagos_turno_id_idx');
        });

        Schema::table('bug_reports', function (Blueprint $table) {
            $table->dropIndex('bug_reports_filtros_idx');
        });
    }
};
