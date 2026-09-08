<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('backup_schedules', function (Blueprint $table) {
            $table->timestamp('ultimo_backup_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('backup_schedules', function (Blueprint $table) {
            $table->dropColumn('ultimo_backup_at');
        });
    }
};
