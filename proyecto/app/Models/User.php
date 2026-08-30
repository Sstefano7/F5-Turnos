<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'country_code',
        'birth_date',
        'dni',
        'gender',
        'preferred_sport',
        'skill_level',
        'preferred_days',
        'preferred_times',
        'team_name',
        'profile_photo',
        'newsletter',
        'sms_notifications',
        'email_verification_token',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'email_verification_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'birth_date' => 'date',
            'preferred_days' => 'array',
            'preferred_times' => 'array',
            'newsletter' => 'boolean',
            'sms_notifications' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function cliente()
    {
        return $this->hasOne(Cliente::class, 'email', 'email');
    }

    public function promocodes()
    {
        return $this->hasMany(Promocode::class);
    }

    public function generateVerificationToken(): string
    {
        return \Illuminate\Support\Str::random(64);
    }
}