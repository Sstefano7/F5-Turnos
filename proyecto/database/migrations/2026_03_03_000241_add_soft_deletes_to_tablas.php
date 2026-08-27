<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('canchas', function (Blueprint $table) { $table->softDeletes(); });
        Schema::table('turnos', function (Blueprint $table) { $table->softDeletes(); });
        Schema::table('clientes', function (Blueprint $table) { $table->softDeletes(); });
    }

    public function down()
    {
        Schema::table('canchas', function (Blueprint $table) { $table->dropSoftDeletes(); });
        Schema::table('turnos', function (Blueprint $table) { $table->dropSoftDeletes(); });
        Schema::table('clientes', function (Blueprint $table) { $table->dropSoftDeletes(); });
    }
};