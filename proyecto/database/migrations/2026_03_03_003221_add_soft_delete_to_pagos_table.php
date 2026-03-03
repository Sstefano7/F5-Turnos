<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('pagos', function (Blueprint $table) {
            // ¡Esta es la línea que faltaba!
            $table->softDeletes(); 
        });
    }

    public function down()
    {
        Schema::table('pagos', function (Blueprint $table) {
            // Y esta es para revertirlo por las dudas
            $table->dropSoftDeletes(); 
        });
    }
};