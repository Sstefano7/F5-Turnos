<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    protected $table = 'system_logs';

    protected $fillable = [
        'level',
        'message',
        'context',
    ];

    protected $casts = [
        'context'    => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Helper para registrar un log en base de datos fácilmente.
     */
    public static function log(string $level, string $message, array $context = []): self
    {
        return self::create([
            'level'   => strtolower($level),
            'message' => $message,
            'context' => $context,
        ]);
    }
}
