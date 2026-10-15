<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->unique()->after('id')
                ->constrained()->nullOnDelete();
        });

        // Vincula los registros históricos cuando existe una cuenta con el mismo email.
        DB::table('clientes')->orderBy('id')->each(function (object $cliente): void {
            $userId = User::whereRaw('LOWER(email) = ?', [strtolower($cliente->email)])->value('id');

            if ($userId) {
                DB::table('clientes')->where('id', $cliente->id)->update(['user_id' => $userId]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
