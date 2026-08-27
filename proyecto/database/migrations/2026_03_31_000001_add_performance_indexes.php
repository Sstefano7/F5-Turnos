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
     * - bug_reports(estado, tipo, prioridad): usada en los filtros del panel de superadmin
     */
    public function up(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->index(['cancha_id', 'fecha', 'hora_inicio'], 'turnos_disponibilidad_idx');
            $table->index(['user_id', 'fecha'], 'turnos_user_fecha_idx');
        });

        Schema::table('horarios', function (Blueprint $table) {
            $table->index(['cancha_id', 'dia_semana'], 'horarios_cancha_dia_idx');
        });

        // Tabla pagos eliminada (pagos externos), solo crear índice si existe
        if (Schema::hasTable('pagos')) {
            Schema::table('pagos', function (Blueprint $table) {
                $table->index('turno_id', 'pagos_turno_id_idx');
            });
        }

        Schema::table('bug_reports', function (Blueprint $table) {
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

        if (Schema::hasTable('pagos')) {
            Schema::table('pagos', function (Blueprint $table) {
                $table->dropIndex('pagos_turno_id_idx');
            });
        }

        Schema::table('bug_reports', function (Blueprint $table) {
            $table->dropIndex('bug_reports_filtros_idx');
        });
    }
};