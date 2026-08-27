<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL no soporta ->enum()->change() con CHECK nativo
        // Se usa SQL raw compatible según driver
        if (DB::getDriverName() === 'pgsql') {
            // En PG el tipo enum ya existe, solo necesitamos ampliar el CHECK
            // Reconstruimos la columna como varchar con check compatible
            // Primero eliminamos el tipo enum viejo si existe y convertimos a varchar
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255)");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'");
            // Eliminamos constraint previo si existe y agregamos nuevo
            try {
                DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            } catch (\Exception $e) {}
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'superadmin'))");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['user', 'admin', 'superadmin'])->default('user')->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'))");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('user')->change();
            });
        }
    }
};