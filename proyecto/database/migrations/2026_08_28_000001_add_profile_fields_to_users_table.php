<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('country_code')->nullable()->after('phone');
            $table->date('birth_date')->nullable()->after('country_code');
            $table->string('dni')->nullable()->after('birth_date');
            $table->string('gender')->nullable()->after('dni');
            $table->string('preferred_sport')->nullable()->after('gender');
            $table->string('skill_level')->nullable()->after('preferred_sport');
            $table->json('preferred_days')->nullable()->after('skill_level');
            $table->json('preferred_times')->nullable()->after('preferred_days');
            $table->string('team_name')->nullable()->after('preferred_times');
            $table->string('profile_photo')->nullable()->after('team_name');
            $table->boolean('newsletter')->default(false)->after('profile_photo');
            $table->boolean('sms_notifications')->default(false)->after('newsletter');
            $table->string('email_verification_token')->nullable()->after('sms_notifications');

            $table->index('dni');
            $table->index('email_verification_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['dni']);
            $table->dropIndex(['email_verification_token']);
            $table->dropColumn([
                'sms_notifications',
                'newsletter',
                'profile_photo',
                'team_name',
                'preferred_times',
                'preferred_days',
                'skill_level',
                'preferred_sport',
                'gender',
                'dni',
                'birth_date',
                'country_code',
                'phone',
                'email_verification_token',
            ]);
        });
    }
};